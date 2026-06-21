"use client";

import { useEffect, useState } from "react";

type TimerProps = {
  duration: number; // durasi dalam menit
  onFinish?: () => void; // opsional, bisa dipakai kalau mau trigger auto-submit
};

export default function Timer({ duration, onFinish }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // konversi ke detik

  // format helper (jam : menit : detik)
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${hrs} : ${mins} : ${secs}`;
  };

  // countdown effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onFinish) onFinish(); // panggil callback kalau waktu habis
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onFinish]);

  return (
    <div className="timer-container">
      <p className="timer-label">Sisa Waktu</p>
      <p className="timer-value">{formatTime(timeLeft)}</p>
    </div>
  );
}
