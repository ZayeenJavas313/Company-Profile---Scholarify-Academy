// app/tryout/data/questions.ts

export type QuestionSection =
  | "induktif"
  | "deduktif"
  | "kuantitatif"
  | "umum"
  | "bacaan"
  | "lbi"
  | "lbe"
  | "pm";

type QuestionOption = {
  key: string;
  text: string;
};

export type Question = {
  id: string;
  soal_id?: number;
  subtestId: string; // "pu", "ppu", "pbm", ...
  section?: QuestionSection;
  question: string;
  options: QuestionOption[];
  answer: string;
  explanation?: string;
};

export const questions: Question[] = [
  // =========================
  // 1. PENALARAN UMUM (PU) – digabung 3 komponen
  // =========================
  {
    id: "pu-1",
    subtestId: "pu",
    section: "induktif",
    question:
      "Perhatikan pola berikut: 2, 4, 8, 16, ... Bilangan selanjutnya adalah ...",
    options: [
      { key: "A", text: "18" },
      { key: "B", text: "24" },
      { key: "C", text: "32" },
      { key: "D", text: "36" },
    ],
    answer: "C",
    explanation: "Setiap bilangan dikali 2.",
  },
  {
    id: "pu-2",
    subtestId: "pu",
    section: "induktif",
    question: "Semua mahasiswa Prodi A lulus LKMM. Rani mahasiswa Prodi A. Maka ...",
    options: [
      { key: "A", text: "Rani tidak ikut LKMM" },
      { key: "B", text: "Rani lulus LKMM" },
      { key: "C", text: "Rani panitia LKMM" },
      { key: "D", text: "Tidak dapat ditarik kesimpulan" },
    ],
    answer: "B",
  },
  {
    id: "pu-3",
    subtestId: "pu",
    section: "deduktif",
    question:
      "Jika semua kegiatan organisasi harus punya proposal, dan LKMM-TD adalah kegiatan organisasi, maka ...",
    options: [
      { key: "A", text: "LKMM-TD tidak perlu proposal" },
      { key: "B", text: "LKMM-TD harus punya proposal" },
      { key: "C", text: "Proposal hanya untuk seminar" },
      { key: "D", text: "LKMM-TD bukan kegiatan organisasi" },
    ],
    answer: "B",
  },
  {
    id: "pu-4",
    subtestId: "pu",
    section: "deduktif",
    question: "Semua dosen hadir rapat. Beberapa yang hadir membawa laptop. Maka ...",
    options: [
      { key: "A", text: "Semua dosen membawa laptop" },
      { key: "B", text: "Tidak ada dosen membawa laptop" },
      { key: "C", text: "Sebagian dosen membawa laptop" },
      { key: "D", text: "Dosen tidak wajib hadir" },
    ],
    answer: "C",
  },
  {
    id: "pu-5",
    subtestId: "pu",
    section: "kuantitatif",
    question: "Hasil dari 25% × 240 adalah ...",
    options: [
      { key: "A", text: "40" },
      { key: "B", text: "50" },
      { key: "C", text: "55" },
      { key: "D", text: "60" },
    ],
    answer: "D",
  },
  {
    id: "pu-6",
    subtestId: "pu",
    section: "kuantitatif",
    question:
      "Rata-rata 4 bilangan adalah 12. Jika satu bilangan ditambah 8, rata-ratanya menjadi ...",
    options: [
      { key: "A", text: "13" },
      { key: "B", text: "14" },
      { key: "C", text: "15" },
      { key: "D", text: "16" },
    ],
    answer: "B",
    explanation:
      "Total awal 4×12=48. Ditambah 8 jadi 56. 56÷4=14. Jadi jawabannya B.",
  },

  // =========================
  // 2. PPU – Pengetahuan & Pemahaman Umum
  // =========================
  {
    id: "ppu-1",
    subtestId: "ppu",
    question: "Lembaga yang bertugas mengelola data kependudukan nasional adalah ...",
    options: [
      { key: "A", text: "KPK" },
      { key: "B", text: "BPS" },
      { key: "C", text: "BKN" },
      { key: "D", text: "Kementerian Dalam Negeri" },
    ],
    answer: "D",
  },
  {
    id: "ppu-2",
    subtestId: "ppu",
    question: "Sumpah Pemuda diikrarkan pada tanggal ...",
    options: [
      { key: "A", text: "28 Oktober 1928" },
      { key: "B", text: "17 Agustus 1945" },
      { key: "C", text: "1 Juni 1945" },
      { key: "D", text: "20 Mei 1908" },
    ],
    answer: "A",
  },

  // =========================
  // 3. PBM – Pemahaman Bacaan & Menulis
  // =========================
  {
    id: "pbm-1",
    subtestId: "pbm",
    question:
      "Bacalah paragraf berikut. Gagasan utama paragraf tersebut adalah ...",
    options: [
      { key: "A", text: "Menjelaskan definisi manajemen waktu" },
      { key: "B", text: "Menjelaskan pentingnya disiplin dalam organisasi" },
      { key: "C", text: "Menjelaskan fungsi komunikasi" },
      { key: "D", text: "Menjelaskan pengertian proposal" },
    ],
    answer: "B",
  },

  // =========================
  // 4. PK – Pengetahuan Kuantitatif
  // =========================
  {
    id: "pk-1",
    subtestId: "pk",
    question: "Hasil dari 15% × 240 adalah ...",
    options: [
      { key: "A", text: "24" },
      { key: "B", text: "30" },
      { key: "C", text: "36" },
      { key: "D", text: "40" },
    ],
    answer: "C",
  },

  // =========================
  // 5. LBI – Literasi Bahasa Indonesia
  // =========================
  {
    id: "lbi-1",
    subtestId: "lbi",
    question: "Kalimat manakah yang menggunakan ejaan yang benar sesuai PUEBI?",
    options: [
      { key: "A", text: "Mahasiswa diwajibkan mengikuti LKMM-TD." },
      { key: "B", text: "Mahasiswa di wajibkan mengikuti LKMM-TD." },
      { key: "C", text: "Mahasiswa di wajibkan mengikuti L K M M - T D." },
      { key: "D", text: "Mahasiswa di wajibkan mengikuti L K M M." },
    ],
    answer: "A",
  },

  // =========================
  // 6. LBE – Literasi Bahasa Inggris
  // =========================
  {
    id: "lbe-1",
    subtestId: "lbe",
    question: "Choose the correct option to complete the sentence:",
    options: [
      { key: "A", text: "She don’t likes studying." },
      { key: "B", text: "She doesn’t like studying." },
      { key: "C", text: "She doesn’t likes studying." },
      { key: "D", text: "She don’t like studying." },
    ],
    answer: "B",
  },

  // =========================
  // 7. PM – Penalaran Matematika
  // =========================
  {
    id: "pm-1",
    subtestId: "pm",
    question: "Jika f(x) = 2x + 3 dan g(x) = x - 4, maka f(g(5)) adalah ...",
    options: [
      { key: "A", text: "3" },
      { key: "B", text: "5" },
      { key: "C", text: "7" },
      { key: "D", text: "9" },
    ],
    answer: "C",
  },
];
