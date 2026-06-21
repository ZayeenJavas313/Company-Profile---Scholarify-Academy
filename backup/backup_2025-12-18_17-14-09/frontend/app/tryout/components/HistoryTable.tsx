"use client";
import { useEffect, useState, useMemo } from "react";
import "../styles/HistoryTable.css";
import { fetchRiwayatNilai } from "@/app/lib/clientApi";

type TooltipData = {
  x: number;
  y: number;
  content: React.ReactNode;
} | null;

type HistoryItem = {
  batch: string;
  date: string;
  subtest: string;
  subtestCode: string;
  score: number;
  jumlahBenar: number;
  jumlahSalah: number;
  jumlahKosong: number;
  status: "Selesai" | "Belum";
};

export default function HistoryTable() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // ambil username dari session
        const res = await fetch("/api/check-session");
        const data = await res.json();
        
        const user = data?.user?.username && typeof data.user.username === "string"
          ? data.user.username
          : null;
        
        setUsername(user);
        
        if (!user) {
          // fallback ke localStorage jika belum login
    const stored = localStorage.getItem("tryout_history");
    const parsed: HistoryItem[] = stored ? JSON.parse(stored) : [];
          parsed.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setHistory(parsed);
          setLoading(false);
          return;
        }
        
        // ambil dari API Django
        try {
          const riwayat = await fetchRiwayatNilai(user);
          console.log("Riwayat dari API untuk user", user, ":", riwayat);
          
          // fetchRiwayatNilai sekarang return empty array jika error, jadi tidak perlu throw
          if (!riwayat || !Array.isArray(riwayat) || riwayat.length === 0) {
            console.log("Tidak ada riwayat dari API, mungkin belum ada data yang tersubmit atau backend tidak dapat dijangkau");
            setHistory([]);
            setLoading(false);
            return;
          }
        
        // Convert setiap item menjadi HistoryItem terpisah (tidak di-group)
        const historyItems: HistoryItem[] = riwayat.map((item: any) => {
          // Pastikan skor valid dalam range 0-100
          let skor = typeof item.skor === 'number' ? item.skor : 0;
          if (isNaN(skor) || skor < 0) skor = 0;
          if (skor > 100) skor = 100;
          
          return {
            batch: item.batch_id,
            date: item.tanggal,
            subtest: item.subtest_nama,
            subtestCode: item.subtest_code,
            score: Math.round(skor),
            jumlahBenar: item.jumlah_benar || 0,
            jumlahSalah: item.jumlah_salah || 0,
            jumlahKosong: item.jumlah_kosong || 0,
            status: "Selesai" as const,
          };
        });

        // urutkan dari terbaru ke lama, kemudian by batch, kemudian by subtest code
        historyItems.sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          
          const batchCompare = a.batch.localeCompare(b.batch);
          if (batchCompare !== 0) return batchCompare;
          
          return a.subtestCode.localeCompare(b.subtestCode);
        });
        
          setHistory(historyItems);
        } catch (apiError) {
          // fetchRiwayatNilai tidak akan throw error lagi, tapi tetap handle untuk safety
          console.error("Error fetching from API:", apiError);
          // Tidak perlu throw, langsung fallback ke localStorage
          const stored = localStorage.getItem("tryout_history");
          const parsed: HistoryItem[] = stored ? JSON.parse(stored) : [];
          parsed.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setHistory(parsed);
        }
      } catch (error) {
        console.error("Error loading history:", error);
        // fallback ke localStorage
        const stored = localStorage.getItem("tryout_history");
        const parsed: HistoryItem[] = stored ? JSON.parse(stored) : [];
    parsed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setHistory(parsed);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Calculate statistics for charts - MUST be before any conditional returns
  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        totalTryOut: 0,
        totalSubtest: 0,
        averageScore: 0,
        topSubtests: [],
        distribution: [0, 0, 0, 0, 0],
        trendData: []
      };
    }

    const totalTryOut = new Set(history.map(item => `${item.batch}-${item.date}`)).size;
    const totalSubtest = history.length;
    const averageScore = history.length > 0 
      ? Math.round(history.reduce((sum, item) => sum + (typeof item.score === 'number' && !isNaN(item.score) ? item.score : 0), 0) / history.length)
      : 0;
    
    // Group by subtest for chart
    const subtestScores = history.reduce((acc, item) => {
      const code = item.subtestCode || item.subtest || 'unknown';
      if (!acc[code]) {
        acc[code] = { name: item.subtest || 'Unknown', scores: [], avg: 0 };
      }
      acc[code].scores.push(item.score);
      return acc;
    }, {} as Record<string, { name: string; scores: number[]; avg: number }>);
    
    Object.keys(subtestScores).forEach(key => {
      const scores = subtestScores[key].scores;
      if (scores.length > 0) {
        subtestScores[key].avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    });
    
    // Get top 5 subtests by average score
    const topSubtests = Object.entries(subtestScores)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
    
    // Score distribution (0-20, 21-40, 41-60, 61-80, 81-100)
    const distribution = [0, 0, 0, 0, 0];
    history.forEach(item => {
      const score = typeof item.score === 'number' && !isNaN(item.score) ? item.score : 0;
      if (score <= 20) distribution[0]++;
      else if (score <= 40) distribution[1]++;
      else if (score <= 60) distribution[2]++;
      else if (score <= 80) distribution[3]++;
      else distribution[4]++;
    });
    
    // Score trend (last 10 attempts, sorted by date)
    const sortedByDate = [...history].sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } catch {
        return 0;
      }
    });
    const trendData = sortedByDate.slice(-10).map((item, index) => ({
      label: `#${index + 1}`,
      value: typeof item.score === 'number' && !isNaN(item.score) ? item.score : 0
    }));
    
    return { totalTryOut, totalSubtest, averageScore, topSubtests, distribution, trendData };
  }, [history]);

  // Tooltip Component
  const Tooltip = ({ data }: { data: TooltipData }) => {
    if (!data || typeof window === 'undefined') return null;
    
    // Calculate position to keep tooltip in viewport
    const tooltipWidth = 200; // Approximate width
    const tooltipHeight = 120; // Approximate height
    const padding = 10;
    
    let left = data.x - tooltipWidth / 2;
    let top = data.y - tooltipHeight - padding;
    
    // Adjust if tooltip goes off screen
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (top < padding) {
      top = data.y + padding + 20; // Show below instead
    }
    
    return (
      <div
        className="fixed z-50 text-xs rounded-2xl shadow-xl p-3 pointer-events-none animate-in fade-in duration-200 border border-[#EEC0A3]/40"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          maxWidth: '250px',
          background: 'linear-gradient(135deg, #F5E6D3 0%, #F0D9C4 100%)',
          color: '#1F2937',
        }}
      >
        <div className="relative">
          {data.content}
          {top < data.y ? (
            <div 
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
              style={{ borderTopColor: '#F5E6D3' }}
            ></div>
          ) : (
            <div 
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent"
              style={{ borderBottomColor: '#F5E6D3' }}
            ></div>
          )}
        </div>
      </div>
    );
  };

  // Chart Components - defined before conditional returns
  // Simple Bar Chart Component with Tooltip
  const BarChart = ({ data, maxValue, height = 120, fullData }: { data: Array<{ label: string; value: number }>; maxValue: number; height?: number; fullData?: Array<{ name: string; avg: number; code: string }> }) => {
    const dataLength = Math.max(data.length, 1);
    const barWidth = 100 / dataLength;
    const gradientId = `barGradient-${Math.random().toString(36).substring(2, 11)}`;
    
    if (data.length === 0) {
      return <p className="text-xs text-slate-500 text-center py-8">Belum ada data</p>;
    }
    
    const handleBarHover = (e: React.MouseEvent<SVGRectElement>, item: { label: string; value: number }, index: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const fullItem = fullData?.[index];
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top,
        content: (
          <div className="space-y-1">
            <div className="font-bold text-slate-900">{fullItem?.name || item.label}</div>
            <div className="text-slate-700">Skor: <span className="font-semibold text-slate-900">{item.value}</span></div>
            {fullItem && (
              <div className="text-slate-700">Kode: <span className="font-semibold text-slate-900">{fullItem.code}</span></div>
            )}
            <div className="text-slate-700">Persentase: <span className="font-semibold text-slate-900">{((item.value / maxValue) * 100).toFixed(1)}%</span></div>
          </div>
        )
      });
    };

    const handleBarLeave = () => {
      setTooltip(null);
    };
    
    return (
      <div className="relative" style={{ height: `${height}px` }} onMouseLeave={handleBarLeave}>
        <svg width="100%" height={height} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={(y / 100) * height}
              x2="100%"
              y2={(y / 100) * height}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * height * 0.9 : 0;
            const x = (index * barWidth) + (barWidth * 0.1);
            const width = barWidth * 0.8;
            return (
              <g key={index}>
                <rect
                  x={`${x}%`}
                  y={height - barHeight}
                  width={`${width}%`}
                  height={barHeight}
                  fill={`url(#${gradientId})`}
                  rx="4"
                  className="transition-all duration-300 cursor-pointer hover:opacity-80"
                  onMouseEnter={(e) => handleBarHover(e, item, index)}
                  onMouseLeave={handleBarLeave}
                />
                <text
                  x={`${x + width / 2}%`}
                  y={height - barHeight - 5}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-700 pointer-events-none"
                >
                  {item.value}
                </text>
                <text
                  x={`${x + width / 2}%`}
                  y={height + 15}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-600 pointer-events-none"
                >
                  {item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label}
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EEC0A3" />
              <stop offset="100%" stopColor="#D9A684" />
            </linearGradient>
          </defs>
        </svg>
        <Tooltip data={tooltip} />
      </div>
    );
  };

  // Line Chart Component for Score Trend with Tooltip
  const LineChart = ({ data }: { data: Array<{ label: string; value: number }> }) => {
    const gradientId = `lineGradient-${Math.random().toString(36).substring(2, 11)}`;
    const height = 120;
    
    if (data.length === 0) {
      return <p className="text-xs text-slate-500 text-center py-8">Belum ada data</p>;
    }
    
    const maxValue = Math.max(...data.map(d => d.value), 100);
    const dataLength = Math.max(data.length - 1, 1);
    
    const points = data.map((item, index) => {
      const x = (index / dataLength) * 100;
      const y = 100 - (item.value / maxValue) * 90;
      return `${x},${y}`;
    }).join(' ');
    
    const areaPoints = `0,100 ${points} 100,100`;

    const handlePointHover = (e: React.MouseEvent<SVGCircleElement>, item: { label: string; value: number }, index: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const trend = index > 0 ? (item.value - data[index - 1].value) : 0;
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top,
        content: (
          <div className="space-y-1">
            <div className="font-bold text-slate-900">Pengerjaan {item.label}</div>
            <div className="text-slate-700">Skor: <span className="font-semibold text-slate-900">{item.value}</span></div>
            {index > 0 && (
              <div className="text-slate-700">
                Perubahan: <span className={`font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {trend >= 0 ? '+' : ''}{trend}
                </span>
              </div>
            )}
            <div className="text-slate-700">Peringkat: <span className="font-semibold text-slate-900">{index + 1}/{data.length}</span></div>
          </div>
        )
      });
    };

    const handlePointLeave = () => {
      setTooltip(null);
    };
    
    return (
      <div className="relative" style={{ height: `${height}px` }} onMouseLeave={handlePointLeave}>
        <svg width="100%" height={height} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={(y / 100) * height}
              x2="100%"
              y2={(y / 100) * height}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          {/* Area under line */}
          {data.length > 1 && (
            <polygon
              points={areaPoints}
              fill={`url(#${gradientId})`}
              opacity="0.2"
            />
          )}
          {/* Line */}
          {data.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="#D9A684"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / dataLength) * 100;
            const y = 100 - (item.value / maxValue) * 90;
            return (
              <g key={index}>
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill="#D9A684"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-300 hover:r-6 hover:fill-[#EEC0A3]"
                  onMouseEnter={(e) => handlePointHover(e, item, index)}
                  onMouseLeave={handlePointLeave}
                />
                <text
                  x={`${x}%`}
                  y={`${y}%`}
                  dy="-10"
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-slate-700 pointer-events-none"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EEC0A3" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D9A684" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
        <Tooltip data={tooltip} />
      </div>
    );
  };

  // Distribution Chart Component with Tooltip
  const DistributionChart = ({ data }: { data: number[] }) => {
    const labels = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const maxValue = Math.max(...data, 1);
    const total = data.reduce((a, b) => a + b, 0);
    
    const handleBarHover = (e: React.MouseEvent<HTMLDivElement>, value: number, index: number, percentage: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top,
        content: (
          <div className="space-y-1">
            <div className="font-bold text-slate-900">Rentang Skor: {labels[index]}</div>
            <div className="text-slate-700">Jumlah: <span className="font-semibold text-slate-900">{value}</span> subtest</div>
            <div className="text-slate-700">Persentase: <span className="font-semibold text-slate-900">{percentage.toFixed(1)}%</span></div>
            {total > 0 && (
              <div className="text-slate-700">Dari total: <span className="font-semibold text-slate-900">{total}</span> subtest</div>
            )}
          </div>
        )
      });
    };

    const handleBarLeave = () => {
      setTooltip(null);
    };
    
    return (
      <div className="space-y-2" onMouseLeave={handleBarLeave}>
        {data.map((value, index) => {
          const percentage = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={index} className="flex items-center gap-3 group">
              <div className="w-12 text-[10px] font-semibold text-slate-600">{labels[index]}</div>
              <div 
                className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden cursor-pointer relative"
                onMouseEnter={(e) => handleBarHover(e, value, index, percentage)}
                onMouseLeave={handleBarLeave}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#FFB4A2] to-[#B5E2D4] rounded-full transition-all duration-700 flex items-center justify-end pr-2 group-hover:shadow-lg group-hover:scale-105"
                  style={{ width: `${percentage}%` }}
                >
                  {value > 0 && (
                    <span className="text-[9px] font-bold text-[#3D2E26]">{value}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <Tooltip data={tooltip} />
      </div>
    );
  };

  // Conditional returns AFTER all hooks
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#EEC0A3] border-t-[#D9A684] mb-3"></div>
        <p className="text-slate-500 font-medium text-sm">Memuat riwayat...</p>
      </div>
    );
  }

  // Don't return early - always show the dashboard even with empty data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Statistics Cards with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center">
        {/* Total TryOut Card */}
        <div 
          className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 hover:shadow-lg hover:border-blue-300/60 transition-all duration-300 group cursor-pointer relative overflow-hidden w-full max-w-sm"
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              content: (
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Total TryOut</div>
                  <div className="text-slate-700">Jumlah batch tryout yang telah dikerjakan</div>
                  <div className="text-slate-700">Total: <span className="font-semibold text-slate-900">{stats.totalTryOut}</span> batch</div>
                </div>
              )
            });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-all duration-300"></div>
          <div className="relative flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mb-1 relative">Total TryOut</p>
          <p className="text-2xl font-bold text-slate-900 relative">{stats.totalTryOut}</p>
        </div>

        {/* Total Subtest Card */}
        <div 
          className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 hover:shadow-lg hover:border-emerald-300/60 transition-all duration-300 group cursor-pointer relative overflow-hidden w-full max-w-sm"
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              content: (
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Total Subtest</div>
                  <div className="text-slate-700">Jumlah total subtest yang telah dikerjakan</div>
                  <div className="text-slate-700">Total: <span className="font-semibold text-slate-900">{stats.totalSubtest}</span> subtest</div>
                  <div className="text-slate-700">Rata-rata per batch: <span className="font-semibold text-slate-900">{stats.totalTryOut > 0 ? (stats.totalSubtest / stats.totalTryOut).toFixed(1) : 0}</span></div>
                </div>
              )
            });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50 transition-all duration-300"></div>
          <div className="relative flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mb-1 relative">Total Subtest</p>
          <p className="text-2xl font-bold text-slate-900 relative">{stats.totalSubtest}</p>
        </div>

        {/* Average Score Card */}
        <div 
          className="bg-gradient-to-br from-[#FFB4A2] to-[#D4C2FC] rounded-2xl border border-[#FFB4A2]/30 shadow-md p-4 hover:shadow-xl hover:scale-105 transition-all duration-300 group cursor-pointer relative overflow-hidden w-full max-w-sm backdrop-blur-sm"
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const maxScore = history.length > 0 ? Math.max(...history.map(h => h.score), 0) : 0;
            const minScore = history.length > 0 ? Math.min(...history.map(h => h.score), 100) : 0;
            setTooltip({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              content: (
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Rata-rata Skor</div>
                  <div className="text-slate-700">Skor rata-rata dari semua subtest</div>
                  <div className="text-slate-700">Rata-rata: <span className="font-semibold text-slate-900">{stats.averageScore}</span></div>
                  <div className="text-slate-700">Tertinggi: <span className="font-semibold text-emerald-600">{maxScore}</span></div>
                  <div className="text-slate-700">Terendah: <span className="font-semibold text-red-600">{minScore}</span></div>
                </div>
              )
            });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
          <div className="relative flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/40 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-[#3D2E26]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-[#3D2E26]/80 font-medium mb-1 relative">Rata-rata Skor</p>
          <p className="text-2xl font-bold text-[#3D2E26] relative">{stats.averageScore}</p>
        </div>
        </div>
        <Tooltip data={tooltip} />

        {/* Charts Section - Always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 justify-items-center">
          {/* Top Subtests Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 hover:shadow-lg hover:border-[#D9A684]/40 transition-all duration-300 w-full max-w-md">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D9A684]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Top 5 Subtest Berdasarkan Skor
            </h4>
            {stats.topSubtests.length > 0 ? (
              <BarChart
                data={stats.topSubtests.map(st => ({
                  label: st.name.length > 15 ? st.name.substring(0, 15) + '...' : st.name,
                  value: st.avg
                }))}
                maxValue={100}
                height={140}
                fullData={stats.topSubtests}
              />
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Belum ada data</p>
            )}
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 hover:shadow-lg hover:border-[#D9A684]/40 transition-all duration-300 w-full max-w-md">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D9A684]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Distribusi Skor
            </h4>
            <DistributionChart data={stats.distribution} />
          </div>

          {/* Score Trend Chart */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 hover:shadow-lg hover:border-[#D9A684]/40 transition-all duration-300 w-full max-w-md">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D9A684]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Trend Skor (10 Terakhir)
            </h4>
            {stats.trendData.length > 0 ? (
              <LineChart data={stats.trendData} />
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Belum ada data</p>
            )}
          </div>
        </div>

        {/* History Table - Always visible */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden w-full">
        {/* Table Header */}
        <div className="bg-slate-50/50 border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Riwayat Pengerjaan</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Total: {history.length} subtest</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {history.length > 0 ? (
      <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
          <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-wider">Subtest</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Skor</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
              <tbody className="divide-y divide-slate-100">
            {history.map((item, idx) => (
              <tr
                key={`${item.batch}-${item.subtestCode}-${idx}`}
                    className="hover:bg-slate-50/50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        <span className="font-semibold text-slate-900 text-xs">{item.batch}</span>
                      </div>
                </td>
                    <td className="px-4 py-3 text-slate-600 font-medium text-xs whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs">{item.subtest}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-[48px] px-2.5 py-1 rounded-xl font-bold text-[#3D2E26] bg-gradient-to-br from-[#FFB4A2] to-[#B5E2D4] text-xs shadow-sm">
                        {typeof item.score === 'number' && !isNaN(item.score) ? Math.max(0, Math.min(100, Math.round(item.score))) : 0}
                      </span>
                </td>
                <td className="px-4 py-3">
                  {item.status === "Selesai" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 whitespace-nowrap">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                      {item.status}
                    </span>
                  ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 whitespace-nowrap">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                      {item.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-3">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold text-sm mb-1">Belum ada riwayat pengerjaan</p>
            <p className="text-slate-500 text-xs">Mulai tryout untuk melihat riwayat di sini</p>
        </div>
        )}
        </div>
      </div>
    </div>
  );
}
