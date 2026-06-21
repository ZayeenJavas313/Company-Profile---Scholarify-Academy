"use client";

interface SubtestInfoProps {
  title: string;
  duration: number;
  questions: number;
  onStart: () => void;
}

export default function SubtestInfo({ title, duration, questions, onStart }: SubtestInfoProps) {
  return (
    <div className="subtest-card">
      <h2>{title}</h2>
      <p>Durasi: {duration} menit</p>
      <p>Jumlah Soal: {questions}</p>
      <p className="subtest-rule">Kerjakan dengan teliti dan pastikan koneksi stabil.</p>
      <button className="start-button" onClick={onStart}>
        Mulai Subtest
      </button>
    </div>
  );
}
