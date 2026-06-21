import Link from "next/link";
import { fetchBatches } from "@/app/lib/api";

// ambil angka dari "batch-3" → 3
function extractNumber(slug: string): number | null {
  const m = slug.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isNaN(n) ? null : n;
}

// cari batch dari API data
function findBatchFromAPI(batches: any[], param: string) {
  if (!batches || batches.length === 0) return null;
  
  const lower = param.toLowerCase();
  const num = extractNumber(lower);

  for (const b of batches) {
    const batchIdLower = (b.batch_id || '').toLowerCase();
    const idStr = b.id?.toString() || '';
    const slug = `batch-${idStr}`.toLowerCase();

    // Match by batch_id (e.g., "batch-2")
    if (lower === batchIdLower) return b;
    // Match by slug (e.g., "batch-2")
    if (lower === slug) return b;
    // Match by id number (e.g., "2")
    if (lower === idStr) return b;
    // Match by extracted number
    if (num !== null && b.id === num) return b;
    // Match by batch_id number (extract from batch_id)
    const batchIdNum = extractNumber(batchIdLower);
    if (num !== null && batchIdNum !== null && batchIdNum === num) return b;
  }

  return null;
}

// fallback kalau slug gak ketemu di data
function makeFallback(param: string) {
  const num = extractNumber(param);
  return {
    id: num ?? 0,
    batch_id: num ? `batch-${num}` : "batch-0",
    title: num ? `TryOut Batch ${num}` : "TryOut",
    date: "–",
    date_display: "–",
    deadline: "–",
    deadline_display: "–",
    status: "locked" as 'available' | 'locked',
    description: "",
    duration: 90,
  };
}

// ⬇️ Next.js 16: params itu Promise → harus di-await
export default async function TryoutInstructionPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params; // misal "batch-1" atau "batch-2"
  
  // Fetch batches from API backend
  let batches = [];
  let batch = null;
  
  try {
    batches = await fetchBatches();
    // Find batch from API data
    batch = findBatchFromAPI(batches, batchId);
  } catch (error) {
    console.error("Error fetching batches from API:", error);
  }

  // Fallback jika batch tidak ditemukan
  if (!batch) {
    batch = makeFallback(batchId);
  }

  // kita bikin slug canonical biar tombolnya konsisten
  const canonicalBatchId = batch.batch_id || `batch-${batch.id}`;

  // Determine locked status from API data
  const isLocked = batch.status === "locked";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[10px] font-semibold text-slate-600 bg-white inline-flex px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm uppercase tracking-wider">
            TryOut • {batch.date_display || batch.date || "–"}
          </p>
          <Link
            href="/tryout"
            className="text-xs font-medium text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/60 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke daftar
          </Link>
        </div>

        {/* judul */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{batch.title}</h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Baca instruksi singkat berikut sebelum memulai tryout.
          </p>
        </div>

        {/* info ringkas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/80 shadow-md p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</p>
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/60">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Terkunci
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#B5E2D4] to-[#9DD4C2] text-[#3D2E26] text-xs font-bold border border-[#B5E2D4]/40 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tersedia
              </span>
            )}
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/80 shadow-md p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Batch</p>
            <p className="text-sm font-bold text-slate-900">
              {canonicalBatchId}
            </p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/80 shadow-md p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Perkiraan durasi</p>
            <p className="text-sm font-bold text-slate-900">
              ± {batch.duration || 90} menit
            </p>
          </div>
        </div>

        {/* instruksi */}
        <section className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/80 shadow-md p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">
              Instruksi pengerjaan
            </h2>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                <svg className="w-5 h-5 text-[#EEC0A3] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Pastikan koneksi internet stabil.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                <svg className="w-5 h-5 text-[#EEC0A3] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Waktu berjalan setelah kamu menekan tombol "Mulai TryOut".</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                <svg className="w-5 h-5 text-[#EEC0A3] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Jangan tutup / refresh browser selama pengerjaan.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                <svg className="w-5 h-5 text-[#EEC0A3] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Nilai akan dihitung otomatis.</span>
              </li>
            </ul>
          </div>

          {/* permintaan client: sekali pengerjaan */}
          <div className="bg-gradient-to-r from-[#D4C2FC]/20 to-[#FFB4A2]/20 border border-[#D4C2FC]/40 rounded-2xl px-4 py-3.5 text-sm flex gap-3 shadow-sm backdrop-blur-sm">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="font-bold text-amber-900">Penting:</p>
              <p className="text-amber-800 leading-relaxed">
                Setiap <strong>subtest</strong> hanya dapat dikerjakan{" "}
                <strong>1 kali</strong>. Jika waktu berakhir atau kamu
                menyelesaikan subtest, akses ke subtest tersebut akan{" "}
                <strong>dikunci</strong> dan tidak bisa dibuka kembali.
              </p>
              <p className="text-xs text-amber-700/90 leading-relaxed pt-1">
                Jika terjadi kendala (listrik, jaringan, atau perangkat), silakan
                hubungi admin/panitia untuk pembukaan ulang oleh sistem.
              </p>
            </div>
          </div>
        </section>

        {/* tombol */}
        <div className="flex justify-end">
          {isLocked ? (
            <div className="bg-gradient-to-r from-[#fee2e2] to-[#fecaca] border border-rose-200/60 text-rose-700 rounded-2xl px-5 py-3 text-sm flex items-center gap-4 shadow-md backdrop-blur-sm">
              <p className="font-medium">Batch ini belum dibuka.</p>
              <Link
                href="/tryout"
                className="text-xs px-3 py-1.5 rounded-lg bg-white/70 border border-rose-200/60 text-rose-700 font-medium hover:bg-white transition-colors"
              >
                Pilih batch lain
              </Link>
            </div>
          ) : (
            <Link
              href={`/tryout/${canonicalBatchId}/do`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFB4A2] to-[#FF9B85] hover:from-[#FF9B85] hover:to-[#FF8268] text-[#3D2E26] px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg border border-[#FFB4A2]/30 backdrop-blur-sm"
            >
              Mulai TryOut sekarang
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

