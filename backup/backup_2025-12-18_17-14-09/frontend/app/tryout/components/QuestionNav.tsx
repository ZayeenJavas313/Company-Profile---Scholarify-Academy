"use client";

import "@/app/tryout/styles/tryout.css";

type Question = {
  id: string;
  subtestId: string;
  section?: string;
  question: string;
  options: { key: string; text: string }[];
  answer: string;
};

type QuestionNavProps = {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>; // { "pu-1": "A", ... }
  onJump: (index: number) => void;
};

export default function QuestionNav({
  questions,
  currentIndex,
  answers,
  onJump,
}: QuestionNavProps) {
  return (
    <div className="nav-card">
      <h3>Navigasi Soal</h3>
      <p className="nav-subtitle">Pilihan ganda</p>

      <div className="nav-grid">
        {questions.map((q, index) => {
          const isActive = index === currentIndex;
          const isAnswered = !!answers[q.id];

          return (
            <button
              key={q.id}
              onClick={() => onJump(index)}
              className={`nav-number ${
                isActive ? "active" : isAnswered ? "answered" : ""
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="nav-legend">
        <span className="legend-box active"></span> Sedang dikerjakan
        <span className="legend-box answered"></span> Sudah dijawab
        <span className="legend-box idle"></span> Belum dijawab
      </div>
    </div>
  );
}
