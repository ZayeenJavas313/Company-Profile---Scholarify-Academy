"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "./components/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ username: string; name: string; role?: string } | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/check-session");
        
        if (!res.ok) {
          throw new Error('Gagal memeriksa sesi');
        }
        
        const data = await res.json();

        if (!data.user) {
          router.replace("/login");
          return;
        }

        const userData = data.user;
        setUser(userData);

        // Cek apakah user adalah admin
        if (userData.role === "admin") {
          setIsAdmin(true);
        } else {
          // Redirect ke halaman utama jika bukan admin
          router.replace("/tryout");
          return;
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.replace("/login");
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Memeriksa otentikasi...</span>
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h2>
          <p className="mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <button
            onClick={() => router.push('/tryout')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminDashboard user={user} />
    </div>
  );
}

