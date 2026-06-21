"use client";

interface SubtestStatsProps {
  data: Array<{
    code: string;
    nama: string;
    jumlah_soal: number;
    total_pengerjaan: number;
    avg_skor: number;
  }>;
}

export default function SubtestStats({ data }: SubtestStatsProps) {
  // Mapping warna untuk setiap subtest berdasarkan tema Scholarify
  const getSubtestColor = (code: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      'PU': { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200' 
      },
      'PM': { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200' 
      },
      'LBE': { 
        bg: 'bg-violet-50', 
        text: 'text-violet-700', 
        border: 'border-violet-200' 
      },
      'LBI': { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200' 
      },
      'PK': { 
        bg: 'bg-rose-50', 
        text: 'text-rose-700', 
        border: 'border-rose-200' 
      },
      'PBM': { 
        bg: 'bg-indigo-50', 
        text: 'text-indigo-700', 
        border: 'border-indigo-200' 
      },
      'PPU': { 
        bg: 'bg-orange-50', 
        text: 'text-orange-700', 
        border: 'border-orange-200' 
      },
    };
    
    // Default color untuk subtest yang tidak terdaftar (menggunakan tema Scholarify)
    return colorMap[code] || { 
      bg: 'bg-[#EEC0A3]/20', 
      text: 'text-[#4B2F1F]', 
      border: 'border-[#D9A684]/40' 
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-2 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">📊</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Statistik Per Subtest</h2>
            <p className="text-[9px] text-slate-500 font-medium">Ringkasan performa per subtest</p>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {data.map((item, idx) => {
          const colors = getSubtestColor(item.code);
  return (
            <div
              key={idx}
              className="flex items-center justify-between p-1.5 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors duration-200 border border-slate-200/50"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className={`inline-flex items-center justify-center w-7 h-7 text-[9px] font-bold rounded-xl ${colors.bg} ${colors.text} border ${colors.border} flex-shrink-0 shadow-sm`}>
                  {item.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-900 truncate">{item.nama}</p>
                  <p className="text-[9px] text-slate-500">{item.jumlah_soal} soal</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 mb-0.5">Pengerjaan</p>
                  <p className={`text-[11px] font-bold ${item.total_pengerjaan > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {item.total_pengerjaan}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 mb-0.5">Rata-rata</p>
                  <p className="text-[11px] font-bold text-slate-900">
                    {Math.round(item.avg_skor)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

