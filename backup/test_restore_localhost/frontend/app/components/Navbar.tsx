"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./Navbar.css";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // cek apakah user punya cookie "session"
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch("/api/check-session");
        const data = await res.json();
        setIsLoggedIn(data.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo kiri */}
        <Link href="/" className="navbar-logo">
          <Image
            src="/images/scholarify-logo.png"
            alt="Scholarify Logo"
            width={40}
            height={40}
            className="logo-img"
          />
          <span className="navbar-title">Scholarify</span>
        </Link>

        {/* Tombol kanan (sembunyikan di halaman login) */}
        {pathname !== "/login" && (
          <div className="navbar-buttons">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            ) : (
              <Link href="/login" className="login-btn">
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
