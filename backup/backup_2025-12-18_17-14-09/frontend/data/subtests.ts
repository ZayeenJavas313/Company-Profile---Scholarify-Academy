// /data/subtests.ts
export type Subtest = {
  id: string;
  batchId: string;
  title: string;
  description: string;
  duration: number; // menit
  questionCount?: number; // ← jumlah soal
};

export const subtests: Subtest[] = [
  {
    id: "pu",
    batchId: "batch-1",
    title: "Penalaran Umum",
    description: "Mengukur kemampuan logis, analitis, dan kuantitatif dasar.",
    duration: 30,
    // UTBK 2025 dipecah 3x10 soal → kita gabung jadi 30
    questionCount: 30,
  },
  {
    id: "ppu",
    batchId: "batch-1",
    title: "Pengetahuan & Pemahaman Umum",
    description: "Wawasan umum dan pemahaman sosial-budaya.",
    duration: 15,
    questionCount: 20,
  },
  {
    id: "pbm",
    batchId: "batch-1",
    title: "Pemahaman Bacaan & Menulis",
    description: "Mengukur kemampuan memahami teks dan menulis dengan baik.",
    duration: 25,
    questionCount: 20,
  },
  {
    id: "pk",
    batchId: "batch-1",
    title: "Pengetahuan Kuantitatif",
    description: "Tes kemampuan numerik dan hitungan dasar.",
    duration: 20,
    questionCount: 20,
  },
  {
    id: "lbi",
    batchId: "batch-1",
    title: "Literasi Bahasa Indonesia",
    description: "Kemampuan memahami dan menulis teks bahasa Indonesia.",
    duration: 42.5,
    questionCount: 30,
  },
  {
    id: "lbe",
    batchId: "batch-1",
    title: "Literasi Bahasa Inggris",
    description: "Pemahaman teks akademik dan komunikasi dalam bahasa Inggris.",
    duration: 30,
    questionCount: 20,
  },
  {
    id: "pm",
    batchId: "batch-1",
    title: "Penalaran Matematika",
    description: "Mengukur kemampuan penalaran matematis.",
    duration: 42.5,
    questionCount: 20,
  },
];
