import Link from "next/link";
import { batches } from "@/data/batches";
import SubtestListClient from "@/app/components/SubtestListClient";
import { fetchSubtests } from "@/app/lib/api";
import type { Subtest as SubtestType } from "@/data/subtests";

export default async function DoPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  const batch = batches.find(
    (b) =>
      `batch-${String(b.id)}`.toLowerCase() === batchId.toLowerCase() ||
      String(b.id) === batchId
  );

  const title = batch?.title ?? "TryOut";
  
  // Fetch subtests from backend API
  let list: SubtestType[] = [];
  try {
    const backendSubtests = await fetchSubtests();
    // Map backend subtests to frontend format and add batchId
    list = backendSubtests.map((st) => ({
      id: st.id,
      batchId: batchId,
      title: st.title,
      description: st.description,
      duration: st.duration,
      questionCount: st.questionCount,
    }));
  } catch (error) {
    console.error("Error fetching subtests:", error);
    // Fallback to empty list if API fails
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih subtest untuk dikerjakan</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{title}</h1>
          </div>
          <Link
            href={`/tryout/${batchId}`}
            className="text-xs font-medium text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/60 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center gap-1.5 shadow-sm self-start sm:self-auto w-fit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke instruksi
          </Link>
        </div>

        {/* GRID SUBTEST + STATUS SELESAI */}
        <SubtestListClient batchId={batchId} subtests={list} />
      </main>
    </div>
  );
}
