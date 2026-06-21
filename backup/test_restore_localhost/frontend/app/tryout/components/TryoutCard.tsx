// app/tryout/components/TryoutCard.tsx
"use client";

import Link from "next/link";
import { type Batch } from "@/data/batches";

interface TryoutCardProps extends Batch {}

export default function TryoutCard({
  id,
  title,
  date,
  status,
  description,
  duration,
}: TryoutCardProps) {
  // kalau id = 1 → slug = "batch-1"
  const slug = typeof id === "number" ? `batch-${id}` : id;
  const isLocked = status === "locked";

  return (
    <div className="w-[250px] bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 flex items-center gap-2">
          📅 {date}
        </p>
        {description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}

        {duration ? (
          <span className="inline-flex mt-1 bg-emerald-50 text-emerald-600 text-[11px] px-3 py-1 rounded-full">
            Durasi ± {duration} menit
          </span>
        ) : null}

        {isLocked ? (
          <span className="inline-flex mt-1 bg-rose-50 text-rose-500 text-[11px] px-3 py-1 rounded-full">
            Terkunci
          </span>
        ) : (
          <span className="inline-flex mt-1 bg-emerald-50 text-emerald-600 text-[11px] px-3 py-1 rounded-full">
            Tersedia
          </span>
        )}
      </div>

      <div className="mt-6">
        {isLocked ? (
          <button
            disabled
            className="w-full bg-slate-200 text-slate-500 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
          >
            Terkunci
          </button>
        ) : (
          <Link
            href={`/tryout/${slug}`}
            className="w-full inline-flex justify-center items-center gap-2 bg-[#EEC0A3] hover:bg-[#D9A684] text-[#4B2F1F] py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Mulai TryOut →
          </Link>
        )}
      </div>
    </div>
  );
}
