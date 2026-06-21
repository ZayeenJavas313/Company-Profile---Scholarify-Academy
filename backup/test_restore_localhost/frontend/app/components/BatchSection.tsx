"use client";

import { useState } from "react";

const batches = [
  { id: 1, name: "Batch 1" },
  { id: 2, name: "Batch 2" },
  { id: 3, name: "Batch 3" },
];

const subtests = [
  "Penalaran Umum",
  "Pengetahuan Kuantitatif",
  "Pemahaman Bacaan",
  "Pengetahuan Umum",
  "Bahasa Inggris",
  "Numerasi",
  "Literasi",
  "Pemecahan Masalah",
  "Logika Verbal",
];

export default function BatchSection() {
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);

  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Pilih Batch Tryout
      </h1>

      {/* BATCH BUTTONS */}
      <div className="flex gap-4 flex-wrap">
        {batches.map((batch) => (
          <button
            key={batch.id}
            onClick={() => setSelectedBatch(batch.id)}
            className={`px-6 py-3 rounded-xl shadow-md transition-all ${
              selectedBatch === batch.id
                ? "bg-[#ff7c00] text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {batch.name}
          </button>
        ))}
      </div>

      {/* SUBTEST SECTION */}
      {selectedBatch && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Pilih Subtest
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {subtests.map((name) => (
              <div
                key={name}
                className="bg-white shadow-md hover:shadow-lg transition-all rounded-xl p-4 text-center cursor-pointer"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
