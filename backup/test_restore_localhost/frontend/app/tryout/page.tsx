"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LayoutTryout from "./components/LayoutTryout";
import HistoryTable from "./components/HistoryTable";
import { fetchBatches, fetchSubtests } from "@/app/lib/api";
import "./styles/tryout.css";

// Ikon panah & kunci (tanpa lucide-react)
function ArrowRight({ size = 18, className = "" }: { size?: number; className?: string }) {
  const s = size;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function LockIcon({ size = 18 }: { size?: number }) {
  const s = size;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

interface Batch {
  id: string;
  title: string;
  date: string;
  deadline: string;
  status: string;
  locked: boolean;
  subtests_info?: Array<{ code: string; title: string }>;
}

export default function TryoutPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [subtests, setSubtests] = useState<any[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await fetch("/api/check-session");
        const data = await res.json();
        const name = data?.user?.name || data?.user?.username || null;
        setUserName(name);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const data = await fetchBatches();
        // Transform data dan sort by batch_id
        const transformed = data.map((batch: any) => ({
          id: batch.batch_id,
          title: batch.title,
          date: batch.date_display,
          deadline: batch.deadline_display || batch.deadline || batch.date,
          status: batch.status === "available" ? "Tersedia" : "Terkunci",
          locked: batch.status === "locked",
          description: batch.description,
          duration: batch.duration || 90, // Use duration from API or default to 90
          subtests_info: batch.subtests_info || [], // Include subtests_info
        })).sort((a, b) => {
          // Extract number from batch_id (e.g., "batch-1" -> 1)
          const getBatchNumber = (batchId: string) => {
            const match = batchId.match(/\d+/);
            return match ? parseInt(match[0], 10) : Infinity;
          };
          return getBatchNumber(a.id) - getBatchNumber(b.id);
        });
        console.log("Loaded batches:", transformed.length, transformed);
        setBatches(transformed);
      } catch (error) {
        console.error("Error loading batches:", error);
        // Fallback: jika API error, set empty array (styling tetap terlihat)
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    
    const loadSubtests = async () => {
      try {
        const data = await fetchSubtests();
        setSubtests(data);
      } catch (error) {
        console.error("Error loading subtests:", error);
        setSubtests([]);
      }
    };
    
    loadBatches();
    loadSubtests();
  }, []);

  return (
    <LayoutTryout>
      {/* ====== Hero Section (harus di dalam LayoutTryout) ====== */}
      <section className="tryout-hero text-center">
        <p className="hero-tag">Simulasi UTBK Premium</p>
        <h1 className="hero-title">
          {userName ? (
            <>
              <span className="block mb-1">Halo, <span className="font-extrabold">{userName}</span>! 👋</span>
              <span className="block" style={{ color: 'var(--tryout-text-strong)' }}>TryOut UTBK 2025 Scholarify</span>
            </>
          ) : (
            'TryOut UTBK 2025 Scholarify'
          )}
        </h1>
        <p className="hero-subtitle">
          Latihan terstruktur dengan analitik real-time untuk memaksimalkan potensi dan strategi ujianmu.
        </p>
      </section>

      {/* ====== Section Pilih Batch ====== */}
      <section className="tryout-wrapper">
        <h2 className="tryout-heading">Pilih Batch TryOut</h2>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#EEC0A3] border-t-[#D9A684] mb-3"></div>
            <p className="text-slate-500 font-medium text-sm">Memuat batch tryout...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-3">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold text-sm mb-1">Belum ada batch tryout yang tersedia</p>
            <p className="text-slate-500 text-xs">Silakan cek kembali nanti</p>
          </div>
        ) : (
        <div className="tryout-batch-container">
            {batches.map((batch) => (
            <div
              key={batch.id}
              className={`batch-card ${batch.locked ? "locked" : "available"}`}
            >
              <div className="batch-content">
                {/* Header with icon */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="batch-icon-wrapper">
                    <svg className="batch-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="batch-title">{batch.title}</h3>
                  </div>
                </div>

                {/* Dates section - Single line */}
                <div className="batch-dates-wrapper">
                  <div className="batch-date-item-single">
                    <div className="batch-date-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="batch-date-content-single">
                      <span className="batch-date-label">Waktu Pengerjaan</span>
                      <span className="batch-date-value">{batch.date} - {batch.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Subtest info - Format List */}
                {batch.subtests_info && batch.subtests_info.length > 0 ? (
                  <div className="batch-subtests-list-wrapper">
                    {batch.subtests_info
                      .sort((a: { code: string; title: string }, b: { code: string; title: string }) => {
                        // Urutkan: PU, PM, LBE, LBI, PK, PBM, PPU
                        const order: Record<string, number> = {
                          'pu': 1, 'pm': 2, 'lbe': 3, 'lbi': 4, 
                          'pk': 5, 'pbm': 6, 'ppu': 7
                        };
                        const codeA = (a.code || '').toLowerCase();
                        const codeB = (b.code || '').toLowerCase();
                        return (order[codeA] || 99) - (order[codeB] || 99);
                      })
                      .map((subtest: { code: string; title: string }) => {
                        // Mapping warna untuk setiap subtest code sesuai gambar
                        const getSubtestColor = (code: string) => {
                          const codeLower = code?.toLowerCase() || '';
                          if (codeLower.includes('lbi')) return 'bg-amber-100';
                          if (codeLower.includes('pbm')) return 'bg-blue-100';
                          if (codeLower.includes('ppu')) return 'bg-sky-100';
                          if (codeLower.includes('pk')) return 'bg-pink-100';
                          if (codeLower.includes('pm')) return 'bg-emerald-100';
                          if (codeLower.includes('pu')) return 'bg-indigo-100';
                          if (codeLower.includes('lbe')) return 'bg-violet-100';
                          return 'bg-slate-100';
                        };
                        
                        const bgColor = getSubtestColor(subtest.code || '');
                        
                        return (
                          <div 
                            key={subtest.code}
                            className="flex items-center gap-2 py-1.5 border-b border-slate-200/40 last:border-b-0"
                          >
                            {/* Indicator warna di kiri */}
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full ${bgColor}`} />
                            
                            {/* Konten */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                {subtest.title}
                              </h4>
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                {/* Jumlah soal akan diambil dari subtests jika ada */}
                                {(() => {
                                  const matchedSubtest = subtests.find(
                                    st => (st.code || st.id || '').toLowerCase() === (subtest.code || '').toLowerCase()
                                  );
                                  const questionCount = matchedSubtest?.questionCount || matchedSubtest?.totalQuestions || 0;
                                  return questionCount > 0 ? `${questionCount} soal` : '';
                                })()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : subtests.length > 0 ? (
                  <div className="batch-subtests-list-wrapper">
                    {subtests
                      .sort((a, b) => {
                        const order: Record<string, number> = {
                          'pu': 1, 'pm': 2, 'lbe': 3, 'lbi': 4, 
                          'pk': 5, 'pbm': 6, 'ppu': 7
                        };
                        const codeA = (a.code || a.id || '').toLowerCase();
                        const codeB = (b.code || b.id || '').toLowerCase();
                        return (order[codeA] || 99) - (order[codeB] || 99);
                      })
                      .slice(0, 7)
                      .map((subtest) => {
                        const getSubtestColor = (code: string) => {
                          const codeLower = code?.toLowerCase() || '';
                          if (codeLower.includes('lbi')) return 'bg-amber-100';
                          if (codeLower.includes('pbm')) return 'bg-blue-100';
                          if (codeLower.includes('ppu')) return 'bg-sky-100';
                          if (codeLower.includes('pk')) return 'bg-pink-100';
                          if (codeLower.includes('pm')) return 'bg-emerald-100';
                          if (codeLower.includes('pu')) return 'bg-indigo-100';
                          if (codeLower.includes('lbe')) return 'bg-violet-100';
                          return 'bg-slate-100';
                        };
                        
                        const bgColor = getSubtestColor(subtest.code || subtest.id || '');
                        const questionCount = (subtest as any).questionCount || (subtest as any).totalQuestions || 0;
                        
                        return (
                          <div 
                            key={subtest.id || subtest.code}
                            className="flex items-center gap-2 py-1.5 border-b border-slate-200/40 last:border-b-0"
                          >
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full ${bgColor}`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                {subtest.title}
                              </h4>
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                {questionCount > 0 ? `${questionCount} soal` : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : null}

                {/* Status badge - Centered */}
                <div className="batch-status-wrapper flex justify-center">
                  <span
                    className={`status-badge ${
                      batch.locked ? "locked-badge" : "available-badge"
                    }`}
                  >
                    {batch.locked ? (
                      <>
                        <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {batch.status}
                      </>
                    ) : (
                      <>
                        <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {batch.status}
                      </>
                    )}
                  </span>
                </div>

                {/* Action button */}
                {batch.locked ? (
                  <button className="start-button disabled" disabled>
                    <LockIcon size={18} /> Terkunci
                  </button>
                ) : (
                  <button
                    className="start-button"
                    onClick={() => router.push(`/tryout/${batch.id}`)}
                  >
                    <span>Mulai TryOut</span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* ====== Section Riwayat & Nilai ====== */}
      <section className="tryout-wrapper" style={{ paddingTop: '3rem' }}>
        <h2 className="tryout-subheading">
          Riwayat Pengerjaan & Nilai TryOut
        </h2>

        {/* Komponen tabel riwayat */}
        <HistoryTable />
      </section>
    </LayoutTryout>
  );
}

