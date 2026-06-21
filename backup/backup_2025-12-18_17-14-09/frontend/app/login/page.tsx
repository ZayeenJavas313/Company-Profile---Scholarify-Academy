"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Login() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/tryout";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      let data: any = {};
      try {
        data = await res.json();
        console.log("[Login Page] Response data:", data);
      } catch (e) {
        console.error("[Login Page] Error parsing JSON:", e);
        const text = await res.text();
        console.error("[Login Page] Response text:", text);
        throw new Error("Gagal memparse response dari server");
      }
      
      if (!res.ok) {
        console.error("[Login Page] Response not ok:", res.status, data);
        throw new Error(data?.error || "Gagal login");
      }
      
      if (!data?.ok) {
        console.error("[Login Page] Data.ok is false:", data);
        throw new Error(data?.error || "Gagal login");
      }
      
      if (!data?.user) {
        console.error("[Login Page] No user in response:", data);
        throw new Error("Response tidak valid: user tidak ditemukan");
      }
      
      console.log("[Login Page] Login successful, redirecting...");
      
      // Cek role user dari response
      const userRole = data?.user?.role || "student";
      
      // Wait a bit untuk memastikan cookie ter-set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect berdasarkan role
      if (userRole === "admin") {
        console.log("[Login Page] Redirecting to /admin");
        // Gunakan window.location untuk force navigation
        window.location.href = "/admin";
      } else {
        console.log("[Login Page] Redirecting to:", from);
        window.location.href = from;
      }
    } catch (e: any) {
      console.error("[Login Page] Error:", e);
      setErr(e.message || "Gagal login. Pastikan backend Django berjalan di http://localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4F2] flex items-center justify-center px-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#F1D7C8] p-8 space-y-6">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <div className="animate-pulse text-slate-700">Memuat...</div>
          </div>
        )}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[#4B2F1F]">Masuk ke Scholarify</h1>
          <p className="text-slate-500 max-w-xs mx-auto" style={{ fontSize: "10px" }}>
            Hubungi admin untuk mendapatkan Username dan Password
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="text-sm text-[#7A5B46]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full py-3 px-4 border rounded-lg border-[#F1D7C8] focus:border-[#EEC0A3] focus:ring-[#F5E0D0] bg-[#FFF9F4]"
              placeholder="username"
              required
              suppressHydrationWarning
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="text-sm text-[#7A5B46]">Password</label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 px-4 pr-11 border rounded-lg border-[#F1D7C8] focus:border-[#EEC0A3] focus:ring-[#F5E0D0] bg-[#FFF9F4]"
                placeholder="*********"
                required
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-4 flex items-center text-[#7A5B46]/70 hover:text-[#4B2F1F]"
              >
                {showPassword ? (
                  // ikon mata tertutup
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                  <path d="M9.88 5.08A9.77 9.77 0 0 1 12 5c4.5 0 8.27 2.94 9.5 7a9.77 9.77 0 0 1-1.93 3.5" />
                  <path d="M6.24 6.24A9.77 9.77 0 0 0 2.5 12a9.77 9.77 0 0 0 2.5 4.5A9.77 9.77 0 0 0 9 18.86" />
                  </svg>
                ) : (
                  // ikon mata terbuka
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {err && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {err}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 bg-[#EEC0A3] hover:bg-[#E0B091] text-[#4B2F1F] font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            {loading ? "Login..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}