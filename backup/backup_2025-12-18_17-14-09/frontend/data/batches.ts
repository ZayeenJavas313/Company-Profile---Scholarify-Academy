// /data/batches.ts
export interface Batch {
  id: string | number;
  title: string;
  date: string;
  status: "available" | "locked";
  description?: string;
  duration?: number; // durasi dalam menit
}

export const batches: Batch[] = [
  {
    id: "batch-1",
    title: "TryOut UTBK Batch 1",
    date: "10 November 2025",
    status: "available",
    description: "Simulasi UTBK dengan soal terupdate dan pemeringkatan.",
    duration: 90,
  },
  {
    id: "batch-2",
    title: "TryOut UTBK Batch 2",
    date: "20 November 2025",
    status: "locked",
    description: "Akan dibuka pada jadwal yang sudah ditentukan.",
    duration: 90,
  },
  // batch lainnya...
];
