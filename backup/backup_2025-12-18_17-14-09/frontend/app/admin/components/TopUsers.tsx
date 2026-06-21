"use client";

interface TopUsersProps {
  data: Array<{
    username: string;
    name: string;
    avg_skor: number;
    total_pengerjaan: number;
  }>;
}

export default function TopUsers({ data }: TopUsersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
          <span className="text-white text-base">🏆</span>
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Top 10 Pengguna</h2>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Pengguna dengan skor tertinggi</p>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">Belum ada data</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {data.map((user, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-gradient-to-r from-slate-50 to-white rounded-xl hover:from-slate-100 hover:to-slate-50 transition-all duration-200 border border-slate-200/50 hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-md ${
                  idx === 0 
                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' 
                    : idx === 1
                    ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                    : idx === 2
                    ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                    : 'bg-gradient-to-br from-[#EEC0A3] to-[#D9A684] text-[#4B2F1F]'
                }`}>
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">@{user.username}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2.5">
                <p className="text-sm font-bold text-slate-900 leading-none">{Math.round(user.avg_skor)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{user.total_pengerjaan} kali</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

