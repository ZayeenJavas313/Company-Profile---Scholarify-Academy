// app/tryout/[batchId]/[subtest]/page.tsx
import QuestionPageClient from "../../components/QuestionPageClient"; // ⬅️ RELATIF, bukan "@/app/..."
import { fetchSubtests, fetchSubtestQuestions } from "@/app/lib/api";
import type { Subtest as SubtestType } from "../../../../data/subtests";
import type { Question as QuestionType } from "../../../../data/questions";

export default async function SubtestPage({
  params,
}: {
  params: Promise<{ batchId: string; subtest: string }>;
}) {
  const { batchId, subtest } = await params;

  // Fetch subtests from backend to find the current one
  let currentSubtest: SubtestType | null = null;
  let subtestQuestions: QuestionType[] = [];

  try {
    const backendSubtests = await fetchSubtests();
    const backendSubtest = backendSubtests.find(
      (s) => s.id.toLowerCase() === subtest.toLowerCase()
    );

    if (backendSubtest) {
      // Map backend subtest to frontend format
      currentSubtest = {
        id: backendSubtest.id,
        batchId: batchId,
        title: backendSubtest.title,
        description: backendSubtest.description,
        duration: backendSubtest.duration,
        questionCount: backendSubtest.questionCount,
        code: backendSubtest.code, // tambahkan code untuk submit jawaban
      } as SubtestType & { code: string };

      // Fetch questions from backend, filtered by batchId
      const backendQuestions = await fetchSubtestQuestions(backendSubtest.code, batchId);
      subtestQuestions = backendQuestions;
    }
  } catch (error) {
    console.error("Error fetching subtest data:", error);
  }

  if (!currentSubtest || subtestQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">
            Subtest tidak ditemukan
          </h1>
          <p className="text-slate-500">
            Pastikan URL benar atau pilih subtest dari halaman sebelumnya.
          </p>
          <a
            href={`/tryout/${batchId}/do`}
            className="inline-flex mt-2 px-4 py-2 rounded-xl bg-[#FFB4A2] text-[#3D2E26] text-sm hover:bg-[#FF9B85] transition-all duration-300 shadow-sm hover:shadow-md"
          >
            ← Kembali
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 md:py-10">
      <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4">
        <QuestionPageClient
          batchId={batchId}
          subtest={currentSubtest}
          questions={subtestQuestions}
        />
      </div>
    </div>
  );
}
