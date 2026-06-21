"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StatsCards from "./StatsCards";
import SubtestStats from "./SubtestStats";
import TopUsers from "./TopUsers";
import SoalList from "./SoalList";
import UsersList from "./UsersList";
import HasilList from "./HasilList";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface AdminDashboardProps {
  user: { username: string; name: string; role?: string } | null;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "soal" | "users" | "hasil">("dashboard");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Load saved tab from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('admin_active_tab');
      if (savedTab && ['dashboard', 'soal', 'users', 'hasil'].includes(savedTab)) {
        setActiveTab(savedTab as "dashboard" | "soal" | "users" | "hasil");
      }
    }
  }, []);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false);
      }
    };

    if (isMobileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobileDropdownOpen]);

  // Update localStorage when tab changes
  const handleTabChange = (tab: "dashboard" | "soal" | "users" | "hasil") => {
    setActiveTab(tab);
    setIsMobileDropdownOpen(false);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_tab', tab);
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "soal", label: "Bank Soal" },
    { id: "users", label: "Pengguna" },
    { id: "hasil", label: "Hasil Tryout" },
  ];

  const selectedTab = tabs.find(tab => tab.id === activeTab) || tabs[0];

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Ambil username dari session
      let sessionData;
      try {
        const sessionRes = await fetch("/api/check-session", {
          credentials: "include",
          cache: "no-store",
        });
        
        if (!sessionRes.ok) {
          throw new Error(`Session check failed: ${sessionRes.status}`);
        }
        
        sessionData = await sessionRes.json();
      } catch (sessionError) {
        console.error("Error checking session:", sessionError);
        alert("Gagal memeriksa session. Silakan login ulang.");
        router.replace("/login");
        return;
      }
      
      const username = sessionData?.user?.username || "";
      
      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        router.replace("/login");
        return;
      }
      
      // Check if backend is accessible
      const apiUrl = `${API_BASE_URL}/admin/dashboard/?username=${encodeURIComponent(username)}`;
      console.log("Fetching dashboard data from:", apiUrl);
      
      let res;
      try {
        res = await fetch(apiUrl, {
          credentials: "include",
          cache: "no-store",
        });
      } catch (fetchError: any) {
        // Network error atau backend tidak bisa dijangkau
        console.error("Fetch error:", fetchError);
        const errorMessage = fetchError.message || "Unknown error";
        
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
          alert(`Backend server tidak dapat dijangkau.\n\nPastikan:\n1. Backend Django berjalan di ${API_BASE_URL.replace('/api', '')}\n2. CORS sudah dikonfigurasi dengan benar\n3. Tidak ada firewall yang memblokir koneksi\n\nError: ${errorMessage}`);
        } else {
          alert(`Gagal menghubungi backend server.\n\nError: ${errorMessage}`);
        }
        return;
      }

      if (res.status === 403) {
        alert("Akses ditolak. Hanya admin yang bisa mengakses halaman ini.");
        router.replace("/tryout");
        return;
      }

      if (!res.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData?.error || errorData?.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          const text = await res.text();
          if (text) {
            errorMessage = text.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Gagal memuat data dashboard.\n\nError: ${errorMessage}\n\nPastikan:\n1. Backend Django berjalan\n2. Anda adalah admin\n3. CORS sudah dikonfigurasi`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar dengan Logo dan Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-md sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 py-2">
            {/* Logo dan Teks Halo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
              <Image
                src="/images/scholarify-logo.png"
                alt="Scholarify Logo"
                width={60}
                height={60}
                className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]"
                quality={100}
                priority
                unoptimized={false}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm md:text-base font-bold whitespace-nowrap text-slate-900 truncate">
                  <span className="hidden sm:inline">Halo admin Scholarify</span>
                  <span className="sm:hidden">Admin</span>
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap truncate">
                  {user?.name || user?.username || 'Admin'}
                </span>
              </div>
            </div>

            {/* Tabs Navigation - Center */}
            <nav className="hidden md:flex items-center space-x-1 mx-2 md:mx-4 flex-1 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                  className={`px-3 md:px-5 py-2 md:py-2.5 mx-0.5 md:mx-1 rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 ${
                  activeTab === tab.id
                      ? "bg-[#EEC0A3] text-[#4B2F1F] border border-[#D9A684] shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

            {/* Mobile Tabs - Custom Dropdown */}
            <div ref={mobileDropdownRef} className="md:hidden flex-1 mx-2 min-w-0 relative">
              <button
                type="button"
                onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                className="w-full pl-3 pr-9 py-2 h-[36px] text-xs border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-500 transition-all text-slate-900 bg-white text-left flex items-center justify-between hover:border-slate-400"
              >
                <span className="text-slate-900 font-medium truncate">
                  {selectedTab.label}
                </span>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isMobileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMobileDropdownOpen(false)}
                  ></div>
                  <div className="absolute z-[100] w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-1.5 top-full mt-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id as any)}
                        className={`w-full px-3 py-2.5 text-left text-xs text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                          activeTab === tab.id ? "bg-slate-50" : ""
                        }`}
                      >
                        {activeTab === tab.id ? (
                          <svg
                            className="w-4 h-4 text-slate-900 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <div className="w-4 h-4 flex-shrink-0"></div>
                        )}
                        <span className="flex-1">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons - Right */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => router.push("/tryout")}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#4B2F1F] hover:text-[#D9A684] rounded-lg sm:rounded-xl transition-all duration-200"
              >
                <span className="hidden sm:inline">Lihat Tryout</span>
                <span className="sm:hidden">Tryout</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#4B2F1F] bg-[#D9A684] hover:bg-[#D9A684]/90 border border-[#D9A684]/50 rounded-lg sm:rounded-xl transition-all duration-200"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fadeIn">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm font-medium text-slate-600">Memuat data dashboard...</p>
              </div>
            ) : dashboardData ? (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-bold mb-0.5 text-slate-900 tracking-tight">Dashboard Admin</h1>
                  <p className="text-xs text-slate-500 font-medium">Ringkasan statistik dan aktivitas platform</p>
                </div>
                <StatsCards stats={dashboardData.stats} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                  <SubtestStats data={dashboardData.subtest_stats} />
                  <TopUsers data={dashboardData.top_users} />
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">Gagal memuat data</h3>
                <p className="text-sm mb-4 text-slate-500">Pastikan backend berjalan dan Anda adalah admin</p>
                <button
                  onClick={fetchDashboardData}
                  className="px-6 py-2 rounded-xl font-medium text-sm transition-all duration-200 bg-[#EEC0A3] text-[#4B2F1F] hover:bg-[#D9A684] border border-[#D9A684]"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "soal" && (
          <div className="animate-fadeIn">
            <SoalList />
          </div>
        )}
        {activeTab === "users" && (
          <div className="animate-fadeIn">
            <UsersList />
          </div>
        )}
        {activeTab === "hasil" && (
          <div className="animate-fadeIn">
            <HasilList />
          </div>
        )}
      </main>
    </div>
  );
}
