"use client";

import Timer from "./Timer";
import "@/app/tryout/styles/tryout.css";

type Subtest = {
  id: string;
  batchId: string;
  title: string;
  description: string;
  duration: number; // menit
};

type QuestionOption = {
  key: string;
  text: string;
};

type Question = {
  id: string;
  subtestId: string;
  section?: string;
  question: string;
  options: QuestionOption[];
  answer: string;
};

const SECTION_LABEL: Record<string, string> = {
  induktif: "Penalaran Induktif",
  deduktif: "Penalaran Deduktif",
  kuantitatif: "Penalaran Kuantitatif",
};

type QuestionCardProps = {
  subtest: Subtest;
  question: Question;
  questionIndex: number; // 0-based
  totalQuestions: number;
  selectedAnswer?: string;
  onSelectAnswer: (answerKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isLast: boolean;
};

export default function QuestionCard({
  subtest,
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onPrev,
  onNext,
  onSubmit,
  isLast,
}: QuestionCardProps) {
  // judul bagian di atas (misal: Penalaran Induktif)
  const sectionTitle = question.section
    ? SECTION_LABEL[question.section] ?? question.section
    : subtest.title;

  return (
    <div className="question-card">
      <div className="question-card-header">
        <div>
          <p className="question-section-title">{sectionTitle}</p>
          <p className="question-subtest-title">
            {subtest.title.toUpperCase()}
          </p>
          <p className="question-number">Nomor soal : {questionIndex + 1}</p>
        </div>
        {/* timer di kanan */}
        <Timer duration={subtest.duration} />
      </div>

      <div className="question-body">
        <p className="question-text">{question.question}</p>

        <div className="question-options">
          {question.options.map((opt) => {
            const isSelected = selectedAnswer === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelectAnswer(opt.key)}
                className={`question-option ${isSelected ? "selected" : ""}`}
              >
                <span className="opt-key">{opt.key}.</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="question-footer">
        <button
          onClick={onPrev}
          disabled={questionIndex === 0}
          className="footer-btn"
        >
          Soal Sebelumnya
        </button>
        <p className="question-current">
          Nomor Soal : {questionIndex + 1} / {totalQuestions}
        </p>
        {isLast ? (
          <button onClick={onSubmit} className="footer-btn primary">
            Kirim Jawaban
          </button>
        ) : (
          <button onClick={onNext} className="footer-btn">
            Soal Selanjutnya
          </button>
        )}
      </div>
    </div>
  );
}
