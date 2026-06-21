import "./globals.css";   // ← WAJIB
import "aos/dist/aos.css"; // import CSS AOS
import NavbarClient from "@/app/components/NavbarClient";
import AosInit from "@/app/components/AosInit";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AosInit />
        <NavbarClient />
        {children}
      </body>
    </html>
  );
}
