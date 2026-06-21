"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import type { Subtest } from "@/data/subtests";
import { fetchRiwayatNilai } from "@/app/lib/api";

type Props = {
  batchId: string;
  subtests: Subtest[];
};

interface ScoreData {
  subtest_code: string;
  skor: number;
}

export default function SubtestListClient({ batchId, subtests }: Props) {
  const [doneMap, setDoneMap] = useState<Record<string, "done" | undefined>>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [username, setUsername] = useState<string>("guest");

  useEffect(() => {
    const loadProgress = async () => {
    try {
        // ambil user yang sedang login
        const res = await fetch("/api/check-session");
        const data = await res.json();

        const user =
          data?.user?.username && typeof data.user.username === "string"
            ? data.user.username
            : "guest";

        setUsername(user);
        const key = `tryout_progress_${user}_${batchId}`;
        setStorageKey(key);

        if (typeof window === "undefined") {
          setDoneMap({});
          return;
        }

      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as Record<string, "done">) : {};
      setDoneMap(parsed || {});

      // Fetch scores untuk subtest yang sudah dikerjakan
      if (user !== "guest") {
        try {
          const riwayat = await fetchRiwayatNilai(user);
          const scoreMap: Record<string, number> = {};
          
          // Normalisasi batchId untuk matching
          const normalizeBatchId = (id: string) => {
            const normalized = String(id || '').toLowerCase().trim();
            return {
              original: normalized,
              withoutPrefix: normalized.replace(/^batch-/, ''),
              withPrefix: normalized.startsWith('batch-') ? normalized : `batch-${normalized}`
            };
          };
          
          const currentBatch = normalizeBatchId(batchId);
          
          // Filter dan map riwayat untuk batch yang sesuai
          const batchResults: Array<{ subtestCode: string; skor: number; id: number; waktuSelesai?: string }> = [];
          
          riwayat.forEach((item: any) => {
            const itemBatch = normalizeBatchId(item.batch_id || '');
            
            // Match jika batch_id sama (dengan atau tanpa prefix "batch-")
            const isMatch = 
              itemBatch.original === currentBatch.original ||
              itemBatch.withoutPrefix === currentBatch.withoutPrefix ||
              itemBatch.withPrefix === currentBatch.withPrefix ||
              itemBatch.original === currentBatch.withPrefix ||
              itemBatch.withPrefix === currentBatch.original;
            
            if (isMatch && item.subtest_code) {
              // Pastikan skor valid dalam range 0-100 (sama seperti HistoryTable)
              let skor = typeof item.skor === 'number' ? item.skor : 0;
              if (isNaN(skor) || skor < 0) skor = 0;
              if (skor > 100) skor = 100;
              
              batchResults.push({
                subtestCode: String(item.subtest_code).toLowerCase(),
                skor: Math.round(skor),
                id: item.id || 0,
                waktuSelesai: item.waktu_selesai || null
              });
            }
          });
          
          // Map hasil ke subtest (ambil yang terbaru jika ada duplikasi)
          subtests.forEach((st) => {
            const stCode = String((st as any).code || st.id || '').toLowerCase();
            const stId = String(st.id || '').toLowerCase();
            
            // Cari semua hasil untuk subtest ini
            const matchedResults = batchResults.filter((r) => {
              return r.subtestCode === stCode || r.subtestCode === stId;
            });
            
            if (matchedResults.length > 0) {
              // Sort by waktu_selesai (terbaru dulu) atau id (terbesar dulu) jika waktu_selesai tidak ada
              matchedResults.sort((a, b) => {
                if (a.waktuSelesai && b.waktuSelesai) {
                  return new Date(b.waktuSelesai).getTime() - new Date(a.waktuSelesai).getTime();
                }
                return b.id - a.id; // id lebih besar = lebih baru
              });
              
              // Ambil skor dari hasil terbaru
              scoreMap[st.id] = matchedResults[0].skor;
            }
          });
          
          setScores(scoreMap);
        } catch (error) {
          console.error("Error fetching scores:", error);
        }
      }
    } catch {
      setDoneMap({});
    }
    };

    loadProgress();
  }, [batchId, subtests]);

  const isDone = (id: string) => doneMap[id] === "done";
  const getScore = (id: string) => scores[id] ?? 0;

  // Helper untuk mendapatkan code dari subtest
  const getSubtestCode = (st: Subtest) => {
    return (st as any).code || st.id || '';
  };

  // Fungsi untuk mendapatkan ikon berdasarkan subtest
  const getSubtestIcon = (code: string, title: string) => {
    const codeLower = code?.toLowerCase() || '';
    const titleLower = title?.toLowerCase() || '';

    // Literasi Bahasa Inggris
    if (codeLower.includes('lbe') || titleLower.includes('bahasa inggris') || titleLower.includes('english')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    // Literasi Bahasa Indonesia
    if (codeLower.includes('lbi') || titleLower.includes('bahasa indonesia')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    }
    // Pemahaman Bacaan & Menulis / PBM
    if (codeLower.includes('pbm') || titleLower.includes('bacaan') || titleLower.includes('menulis')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    }
    // Pengetahuan Kuantitatif / PK
    if (codeLower.includes('pk') || titleLower.includes('kuantitatif')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    // Penalaran Matematika / PM
    if (codeLower.includes('pm') || titleLower.includes('penalaran matematika')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    // Pengetahuan & Pemahaman Umum / PPU
    if (codeLower.includes('ppu') || titleLower.includes('pengetahuan') || titleLower.includes('pemahaman umum')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    }
    // Penalaran Umum / PU (default fallback)
    if (codeLower.includes('pu') || titleLower.includes('penalaran umum')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    // Default icon (document/book)
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getSubtestIconColor = (code: string, title: string) => {
    const codeLower = code?.toLowerCase() || '';
    const titleLower = title?.toLowerCase() || '';

    if (codeLower.includes('lbe') || titleLower.includes('bahasa inggris')) return 'text-blue-600';
    if (codeLower.includes('lbi') || titleLower.includes('bahasa indonesia')) return 'text-orange-600';
    if (codeLower.includes('pbm') || titleLower.includes('bacaan')) return 'text-yellow-600';
    if (codeLower.includes('pk') || titleLower.includes('kuantitatif')) return 'text-rose-600';
    if (codeLower.includes('pm') || titleLower.includes('penalaran matematika')) return 'text-indigo-600';
    if (codeLower.includes('ppu') || titleLower.includes('pengetahuan')) return 'text-violet-600';
    if (codeLower.includes('pu') || titleLower.includes('penalaran umum')) return 'text-emerald-600';
    return 'text-slate-600';
  };

  const getSubtestIconBg = (code: string, title: string) => {
    const codeLower = code?.toLowerCase() || '';
    const titleLower = title?.toLowerCase() || '';

    if (codeLower.includes('lbe') || titleLower.includes('bahasa inggris')) return 'bg-blue-50';
    if (codeLower.includes('lbi') || titleLower.includes('bahasa indonesia')) return 'bg-orange-50';
    if (codeLower.includes('pbm') || titleLower.includes('bacaan')) return 'bg-yellow-50';
    if (codeLower.includes('pk') || titleLower.includes('kuantitatif')) return 'bg-rose-50';
    if (codeLower.includes('pm') || titleLower.includes('penalaran matematika')) return 'bg-indigo-50';
    if (codeLower.includes('ppu') || titleLower.includes('pengetahuan')) return 'bg-violet-50';
    if (codeLower.includes('pu') || titleLower.includes('penalaran umum')) return 'bg-emerald-50';
    return 'bg-slate-50';
  };

  const Card = ({ st }: { st: Subtest }) => {
    const selesai = isDone(st.id);
    const skor = getScore(st.id);

    // support questionCount & totalQuestions
    const questions =
      (st as any).questionCount ??
      (st as any).totalQuestions ??
      undefined;

    // kelas kartu dengan animasi halus untuk yang aktif saja
    const cardClass =
      `relative rounded-xl border bg-white px-6 py-6 
       shadow-sm transition-all duration-200
       ${selesai 
         ? "border-slate-200/60"
         : "border-slate-200/60 hover:shadow-md hover:-translate-y-1 hover:border-slate-300"}`;

    return (
      <div className={cardClass} role="article">
        <div className="text-center">
          {/* Icon atau Score untuk subtest */}
          <div className="flex justify-center mb-3">
            {selesai ? (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider leading-tight">SKOR</p>
                  <p className="text-xl font-bold text-blue-900 leading-none">{skor}</p>
                </div>
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-xl ${getSubtestIconBg(getSubtestCode(st), st.title)} flex items-center justify-center border border-slate-200/60 shadow-sm`}>
                <div className={getSubtestIconColor(getSubtestCode(st), st.title)}>
                  {getSubtestIcon(getSubtestCode(st), st.title)}
                </div>
          </div>
        )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-tight mb-3">
            {st.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto mb-5">
            {st.description}
          </p>

          {/* badges - abu-abu untuk yang sudah selesai */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${
              selesai 
                ? "bg-slate-50 text-slate-500 border-slate-200/60"
                : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Durasi: {st.duration ?? 0} menit
            </span>
            {typeof questions === "number" && (
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${
                selesai 
                  ? "bg-slate-50 text-slate-500 border-slate-200/60"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200/60"
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {questions} soal
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6">
            {selesai ? (
              <button
                disabled
                aria-disabled="true"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed shadow-sm"
                title="Subtest ini sudah dikerjakan dan terkunci."
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z" />
                </svg>
                Sudah dikerjakan
              </button>
            ) : (
              <Link
                href={`/tryout/${batchId}/${st.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EEC0A3] to-[#D9A684] hover:from-[#D9A684] hover:to-[#c68b65] px-4 py-3 text-sm font-bold text-[#4B2F1F] transition-all duration-200 shadow-sm hover:shadow-md border border-[#D9A684]/30"
              >
                Mulai Subtest
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            )}
          </div>
        </div>
        {/* ring halus saat selesai */}
        {selesai && (
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-emerald-200/50" />
        )}
      </div>
    );
  };

  const list = useMemo(
    () => subtests.map((st) => <Card key={`${st.batchId}-${st.id}`} st={st} />),
    [subtests, doneMap]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mb-20">
      {list}
    </div>
  );
}

