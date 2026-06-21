// app/tryout/components/QuestionPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Subtest } from "@/data/subtests";
import { Question } from "@/data/questions";
import { submitJawaban } from "@/app/lib/clientApi";

type Props = {
  batchId: string;
  subtest: Subtest;
  questions: Question[];
};

export default function QuestionPageClient({
  batchId,
  subtest,
  questions,
}: Props) {
  const router = useRouter();

  // index soal berjalan
  const [currentIndex, setCurrentIndex] = useState(0);
  // jawaban user: {soal_id: "A"} atau {index: "A"} sebagai fallback
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  // timer dalam detik
  const [secondsLeft, setSecondsLeft] = useState(
    Math.round((subtest.duration ?? 30) * 60)
  );

  // toggle dropdown navigasi soal di header
  const [showMobileNav, setShowMobileNav] = useState(false);

  // key localStorage yang sudah include username
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("guest");
  const [initialSeconds, setInitialSeconds] = useState(0);
  // Track apakah user sudah submit jawaban
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const initStorageKey = async () => {
      try {
        const res = await fetch("/api/check-session");
        const data = await res.json();

        const user =
          data?.user?.username && typeof data.user.username === "string"
            ? data.user.username
            : "guest";

        setUsername(user);
        setStorageKey(`tryout_progress_${user}_${batchId}`);
      } catch {
        setStorageKey(`tryout_progress_guest_${batchId}`);
      }
    };

    initStorageKey();
    setInitialSeconds(Math.round((subtest.duration ?? 30) * 60));
  }, [batchId, subtest.duration]);

  // format mm:ss
  const timeString = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secondsLeft % 60)
      .toString()
      .padStart(2, "0");
    return `${m} : ${s}`;
  }, [secondsLeft]);

  // tandai subtest selesai di localStorage
  const markSubtestDone = () => {
    if (typeof window === "undefined" || !storageKey) return;
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[subtest.id] = "done";
    localStorage.setItem(storageKey, JSON.stringify(parsed));
  };

  // selesai → submit jawaban ke API → balik
  const finishAndBack = async (reason: "submit" | "time") => {
    console.log("🔵 finishAndBack called with reason:", reason);
    console.log("🔵 Current state:", {
      username,
      questionsLength: questions.length,
      answersCount: Object.keys(answers).length,
      answers: answers,
    });
    
    // Set flag bahwa user sudah submit, sehingga bisa keluar
    setIsSubmitted(true);
    
    markSubtestDone();
    
    // submit jawaban ke API jika user sudah login
    if (username !== "guest" && questions.length > 0) {
      console.log("✅ User is logged in and has questions, proceeding to submit...");
      try {
        const durasiDetik = initialSeconds - secondsLeft;
        // ambil code dari subtest (bisa dari backend atau fallback ke id uppercase)
        const subtestCode = (subtest as any).code || subtest.id.toUpperCase();
        
        // Validasi: pastikan ada jawaban sebelum submit
        if (Object.keys(answers).length === 0) {
          console.warn("WARNING: Tidak ada jawaban yang akan disubmit!");
          alert("Anda belum mengisi jawaban. Silakan isi minimal satu jawaban sebelum submit.");
          return; // Jangan lanjutkan jika tidak ada jawaban
        }
        
        // Log detail jawaban untuk debugging
        const answersDetail = Object.entries(answers).slice(0, 5).map(([key, value]) => ({
          key,
          value,
          questionIndex: questions.findIndex((q: any) => (q.soal_id ?? q.id) == key),
        }));
        
        console.log("=== SUBMITTING ANSWERS ===");
        console.log("Submitting answers:", {
          username,
          subtestCode,
          batchId,
          answersCount: Object.keys(answers).length,
          durasiDetik,
          sampleAnswers: answersDetail,
          allAnswersKeys: Object.keys(answers),
        });
        
        // Pastikan kita mengirim soal_id jika tersedia, bukan index
        // Convert answers dari {soal_id/index: "A"} ke format yang benar
        // BACKEND MENGHARAPKAN soal_id SEBAGAI STRING!
        const answersToSubmit: Record<string, string> = {};
        Object.entries(answers).forEach(([key, value]) => {
          // Cari question yang sesuai dengan key ini
          const question = questions.find((q: any, idx: number) => {
            const qKey = q.soal_id ?? idx;
            return String(qKey) === String(key);
          });
          
          // Gunakan soal_id jika tersedia, jika tidak gunakan key as-is
          // PASTIKAN SEMUA KEY ADALAH STRING!
          const finalKey = question?.soal_id ? String(question.soal_id) : String(key);
          answersToSubmit[finalKey] = String(value).toUpperCase().trim();
        });
        
        console.log("Answers to submit (with soal_id):", {
          originalCount: Object.keys(answers).length,
          convertedCount: Object.keys(answersToSubmit).length,
          original: Object.keys(answers).slice(0, 5),
          converted: Object.keys(answersToSubmit).slice(0, 5),
          sampleValues: Object.entries(answersToSubmit).slice(0, 5),
          allConvertedKeys: Object.keys(answersToSubmit),
          questionsSoalIds: questions.map((q: any) => (q as any)?.soal_id).filter(Boolean).slice(0, 10),
          questionsDetail: questions.slice(0, 5).map((q: any, idx: number) => ({
            index: idx,
            id: q.id,
            soal_id: q.soal_id,
            hasSoalId: !!q.soal_id,
          })),
        });
        
        if (Object.keys(answersToSubmit).length === 0) {
          console.error("ERROR: answersToSubmit kosong setelah konversi!");
          alert("Terjadi kesalahan saat memproses jawaban. Silakan coba lagi.");
          return;
        }
        
        const result = await submitJawaban(
          username,
          subtestCode,
          batchId,
          answersToSubmit,
          durasiDetik > 0 ? durasiDetik : undefined
        );
        
        console.log("✅ Submit success:", result);
      } catch (error) {
        console.error("❌ Error submitting answers:", error);
        // tetap lanjutkan meskipun submit gagal
      }
    } else {
      console.warn("⚠️ Skipping submit - username:", username, "questions:", questions.length);
      if (username === "guest") {
        console.warn("⚠️ User is guest, cannot submit answers");
      }
      if (questions.length === 0) {
        console.warn("⚠️ No questions available");
      }
    }
    
    router.replace(`/tryout/${batchId}/do?done=${subtest.id}&r=${reason}`);
  };

  // timer jalan
  useEffect(() => {
    if (secondsLeft <= 0) {
      finishAndBack("time");
      return;
    }
    const t = setInterval(() => {
      setSecondsLeft((sec) => sec - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft, initialSeconds]);

  // kalau user maksa balik ke subtest yang sudah dikerjakan, kunci
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[subtest.id] === "done") {
        router.replace(`/tryout/${batchId}/do`);
      }
    }
  }, [batchId, subtest.id, router, storageKey]);

  // Prevent user from leaving page before submitting answers
  useEffect(() => {
    if (typeof window === "undefined" || isSubmitted) return;
    
    // Handler untuk beforeunload (menutup tab/browser/refresh)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Standard way untuk modern browsers
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = "Apakah Anda yakin ingin keluar? Jawaban yang belum dikirim akan hilang.";
      return e.returnValue;
    };

    // Flag untuk mencegah infinite loop
    let isHandlingPopState = false;

    // Handler untuk popstate (back button)
    const handlePopState = (e: PopStateEvent) => {
      if (isHandlingPopState || isSubmitted) return;
      
      isHandlingPopState = true;
      
      // Prevent back navigation dengan push state lagi
      window.history.pushState(null, "", window.location.href);
      
      // Show confirmation
      const confirmLeave = window.confirm(
        "Apakah Anda yakin ingin keluar? Jawaban yang belum dikirim akan hilang."
      );
      
      if (confirmLeave) {
        // User confirmed, allow navigation
        setIsSubmitted(true);
        // Navigate back after a short delay to allow state update
        setTimeout(() => {
          window.history.back();
          isHandlingPopState = false;
        }, 100);
      } else {
        isHandlingPopState = false;
      }
    };

    // Push state untuk intercept back button (hanya sekali saat mount)
    window.history.pushState(null, "", window.location.href);
    
    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isSubmitted]);

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = (value: string) => {
    // Gunakan soal_id jika ada, jika tidak gunakan index sebagai fallback
    const currentQ = questions[currentIndex] as any;
    const questionKey = currentQ?.soal_id ?? currentIndex;
    
    // Pastikan soal_id digunakan jika tersedia
    const finalKey = currentQ?.soal_id ? String(currentQ.soal_id) : String(currentIndex);
    
    console.log(`📝 Answer selected for question ${currentIndex}:`, {
      soal_id: currentQ?.soal_id,
      questionKey: finalKey,
      value,
      questionObject: {
        id: currentQ?.id,
        soal_id: currentQ?.soal_id,
        subtestId: currentQ?.subtestId,
      },
    });
    setAnswers((prev) => ({ ...prev, [finalKey]: value }));
  };

  const handleSubmit = async () => {
    console.log("=".repeat(50));
    console.log("🟢🟢🟢 BUTTON 'KIRIM JAWABAN' DIKLIK! 🟢🟢🟢");
    console.log("=".repeat(50));
    console.log("Current answers:", answers);
    console.log("Answers count:", Object.keys(answers).length);
    await finishAndBack("submit");
  };

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < questions.length) setCurrentIndex(idx);
  };

  // dropdown navigasi soal (di header)
  const navPanel = (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-4 space-y-3 max-h-64 overflow-y-auto question-nav-panel">
          <div>
        <h2 className="text-sm font-semibold text-slate-900 question-nav-panel-title">Navigasi Soal</h2>
            <p className="text-xs text-slate-400 question-nav-panel-subtitle">Pilih nomor soal</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              // Cek jawaban menggunakan soal_id atau index
              const questionKey = (q as any)?.soal_id ?? idx;
              const answered = answers[questionKey];
              const active = idx === currentIndex;

              return (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium question-nav-number
                    ${
                      active
                        ? "bg-[#EEC0A3] text-[#4B2F1F]"
                        : answered
                        ? "bg-[#D9F99D] text-[#3F6212]"
                        : "bg-slate-100 text-slate-500"
                    }
                  `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 question-nav-legend">
            <span className="inline-flex w-3 h-3 rounded bg-[#EEC0A3]" />{" "}
            Sedang dikerjakan
            <span className="inline-flex w-3 h-3 rounded bg-[#D9F99D]" />{" "}
            Sudah dijawab
            <span className="inline-flex w-3 h-3 rounded bg-slate-200" /> Belum
            dijawab
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 question-page-container">
      {/* KIRI: kartu utama soal */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm p-8 flex flex-col min-h-[70vh] relative question-card-main">
        {/* 1) HEADER: subtest + navigasi; countdown di pojok kanan atas */}
        <div className="mb-5 question-header">
          {/* Countdown absolute di pojok kanan atas */}
          <div className="absolute top-6 right-8 text-right question-countdown">
            <p className="text-[11px] sm:text-xs text-slate-400 question-countdown-label">Sisa waktu</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-wide question-countdown-time">
              {timeString}
            </p>
          </div>

          {/* Judul + tombol navigasi */}
          <div className="flex flex-col gap-2 pr-28 sm:pr-40">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-slate-400 question-subtest-title">
              {subtest.title}
            </p>
            <div>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowMobileNav((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 question-nav-button"
                >
                  Navigasi Soal
                  <span className="text-[9px]">
                    {showMobileNav ? "▲" : "▼"}
                  </span>
                </button>
                {showMobileNav && (
                  <div className="absolute left-0 top-full mt-2 z-20">
                    {navPanel}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2) AREA SOAL: full width, hanya soal yang bisa discroll */}
        <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-900 text-justify question-text-area">
          {/* Teks soal */}
          {currentQuestion?.question ??
            (currentQuestion as any)?.text ??
            "Soal"}
          
          {/* Gambar soal (jika ada) */}
          {(currentQuestion as any)?.question_image && (() => {
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
            const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
            const imageUrl = (currentQuestion as any).question_image;
            
            // Resolve image URL
            let finalImageUrl = imageUrl;
            if (imageUrl && typeof imageUrl === 'string') {
              if (imageUrl.startsWith('/media/')) {
                // Path relatif /media/ -> tambahkan backend origin
                finalImageUrl = `${BACKEND_ORIGIN}${imageUrl}`;
              } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                // URL lengkap -> gunakan langsung
                finalImageUrl = imageUrl;
              } else {
                // Path relatif lainnya -> tambahkan /media/ dan backend origin
                finalImageUrl = `${BACKEND_ORIGIN}/media/${imageUrl}`;
              }
            }
            
            return (
              <div className="mt-4">
                <img
                  src={finalImageUrl}
                  alt="Gambar Soal"
                  className="max-w-full h-auto rounded-lg border border-slate-200 shadow-sm"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    const errorInfo = {
                      finalUrl: finalImageUrl,
                      originalUrl: imageUrl,
                      backendOrigin: BACKEND_ORIGIN,
                      apiBase: API_BASE,
                      timestamp: new Date().toISOString()
                    };
                    console.error('Error loading question image:', errorInfo);
                    
                    // Fallback: coba dengan URL alternatif jika gagal
                    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('/media/')) {
                      // Coba dengan URL yang berbeda jika ada
                      const fallbackUrl = `${BACKEND_ORIGIN}${imageUrl}`;
                      if (fallbackUrl !== finalImageUrl && !img.dataset.fallbackAttempted) {
                        console.log('Trying fallback URL:', fallbackUrl);
                        img.dataset.fallbackAttempted = 'true';
                        img.src = fallbackUrl;
                        return;
                      }
                    }
                    
                    // Jika masih gagal, tampilkan placeholder atau sembunyikan
                    console.warn('Failed to load image after fallback attempts');
                    img.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', finalImageUrl);
                  }}
                />
              </div>
            );
          })()}
          
          <p className="text-xs text-slate-500 mt-4 question-number">
            Nomor soal : {currentIndex + 1} / {questions.length}
          </p>
        </div>

        {/* 3) OPSI + FOOTER: selalu di bawah, tidak ikut scroll */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-6 question-options-container">
          {/* opsi jawaban */}
          <div className="space-y-3">
            {(currentQuestion?.options ??
              (currentQuestion as any)?.choices ??
              []
            ).map((opt: any, i: number) => {
              // support option bentuk string atau objek {label, value}
              const label =
                typeof opt === "string"
                  ? opt
                  : opt?.label ?? opt?.text ?? `Pilihan ${i + 1}`;
              // PASTIKAN value adalah huruf A/B/C/D/E, bukan teks pilihan!
              // Gunakan huruf berdasarkan index (0=A, 1=B, 2=C, 3=D, 4=E)
              const value = String.fromCharCode(65 + i); // 65 = 'A', 66 = 'B', dst.

              // detect apakah label adalah path gambar (mis. "/media/..." atau url yang berakhiran ekstensi gambar)
              const isString = typeof label === "string";
              const looksLikeMediaPath = isString && (label.startsWith("/media/") || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(label) || /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(label));

              // jika path relatif ke /media, gunakan origin backend (NEXT_PUBLIC_API_BASE_URL) supaya browser memuatnya dari Django
              const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
              const getImageSrc = (p: string) => {
                if (!p) return p;
                if (p.startsWith("/media/")) {
                  return `${BACKEND_ORIGIN}${p}`;
                }
                return p;
              };

              // Cek jawaban menggunakan soal_id atau index
              const currentQ = questions[currentIndex] as any;
              const questionKey = currentQ?.soal_id ?? currentIndex;
              const selected = answers[questionKey] === value;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectAnswer(value)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 relative question-option
                    ${
                      selected
                        ? "border-[#FF8268] bg-[#FFB4A2] text-[#3D2E26] shadow-lg shadow-[#FFB4A2]/40 font-semibold ring-2 ring-[#FFB4A2]/20"
                        : "border-slate-200 bg-white text-[#6B5D52] hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm font-normal"
                    }
                  `}
                >
                  {looksLikeMediaPath ? (
                    <img
                      src={getImageSrc(String(label))}
                      alt={`Pilihan ${i + 1}`}
                      className="max-w-full h-auto rounded-md"
                      onError={(e) => {
                        // kalau gagal load, sembunyikan gambar dan tunjukkan teks path sebagai fallback
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    label
                  )}
                </button>
              );
            })}
        </div>

          {/* footer navigasi soal */}
          <div className="flex items-center justify-between question-nav-footer">
            {/* kiri: soal sebelumnya */}
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl border text-[10px] text-slate-700 disabled:opacity-40 question-nav-button-footer"
            >
              Sebelumnya
            </button>

            <p className="text-[11px] text-slate-500 question-nav-info">
              Nomor Soal : {currentIndex + 1} / {questions.length}
            </p>

            {/* kanan: soal berikutnya / kirim jawaban di soal terakhir */}
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-[#EEC0A3] text-[#4B2F1F] text-[10px] font-medium hover:bg-[#D9A684] transition-colors question-submit-button"
              >
                Kirim Jawaban
              </button>
            ) : (
              <button
                onClick={() => goTo(currentIndex + 1)}
                className="px-4 py-2 rounded-xl border text-[10px] text-slate-700 question-nav-button-footer"
              >
                Selanjutnya
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
