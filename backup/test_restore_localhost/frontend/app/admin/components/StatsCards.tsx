"use client";

interface StatsCardsProps {
  stats: {
    users: { total: number; students: number; admins: number };
    subtests: { total: number; total_soal: number };
    hasil_tryout: { total: number; dengan_skor: number; avg_skor: number };
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Pengguna",
      value: stats.users.total,
      subtitle: `${stats.users.students} siswa, ${stats.users.admins} admin`,
      icon: "👥",
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "Total Subtest",
      value: stats.subtests.total,
      subtitle: `${stats.subtests.total_soal} soal`,
      icon: "📚",
      gradientFrom: "from-emerald-500",
      gradientTo: "to-emerald-600",
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      textColor: "text-emerald-600",
    },
    {
      title: "Total Pengerjaan",
      value: stats.hasil_tryout.total,
      subtitle: `${stats.hasil_tryout.dengan_skor} dengan skor`,
      icon: "📝",
      gradientFrom: "from-violet-500",
      gradientTo: "to-violet-600",
      bgColor: "bg-violet-50",
      iconBg: "bg-violet-100",
      textColor: "text-violet-600",
    },
    {
      title: "Rata-rata Skor",
      value: Math.round(stats.hasil_tryout.avg_skor),
      subtitle: "Dari semua pengerjaan",
      icon: "📈",
      gradientFrom: "from-amber-500",
      gradientTo: "to-amber-600",
      bgColor: "bg-amber-50",
      iconBg: "bg-amber-100",
      textColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="group bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                {card.title}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-0.5 leading-none">
                {card.value}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{card.subtitle}</p>
            </div>
            <div className={`${card.bgColor} w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ml-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <span className="text-base sm:text-lg">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

