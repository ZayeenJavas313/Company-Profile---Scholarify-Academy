"use client";

import { useEffect } from "react";
import AOS from "aos";

export default function AosInit() {
  useEffect(() => {
    AOS.init({
      // sesuaikan opsi jika perlu
      duration: 700,
      easing: "ease-in-out",
      once: true,
      offset: 120,
    });

    // refresh pada mount untuk memastikan elemen yang dimuat dinamis terdeteksi
    AOS.refresh();
  }, []);

  return null;
}
