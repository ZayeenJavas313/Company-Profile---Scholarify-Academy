"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Calculator,
  BookOpen,
  Globe,
  MessageCircle,
  Type,
  Languages,
  Network,
  GitBranch,
} from "lucide-react";

interface Subtest {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function BatchDetailClient({ batchId }: { batchId: string }) {
  const router = useRouter();

  const subtests: Subtest[] = [
    { id: "penalaran-umum", title: "Penalaran Umum", description: "Uji kemampuan logis dan analitis.", icon: <Brain className="w-8 h-8 text-red-500" /> },
    { id: "pengetahuan-umum", title: "Pengetahuan & Pemahaman Umum", description: "Wawasan umum dan pemahaman sosial-budaya.", icon: <Globe className="w-8 h-8 text-green-500" /> },
    { id: "pemahaman-bacaan", title: "Pemahaman Bacaan & Menulis", description: "Mengukur pemahaman terhadap teks dan penulisan.", icon: <BookOpen className="w-8 h-8 text-yellow-500" /> },
    { id: "pengetahuan-kuantitatif", title: "Pengetahuan Kuantitatif", description: "Tes kemampuan numerik dan hitungan dasar.", icon: <Calculator className="w-8 h-8 text-blue-500" /> },
    { id: "literasi-bahasa-indonesia", title: "Literasi Bahasa Indonesia", description: "Kemampuan memahami dan menulis teks bahasa Indonesia.", icon: <Type className="w-8 h-8 text-orange-500" /> },
    { id: "literasi-bahasa-inggris", title: "Literasi Bahasa Inggris", description: "Pemahaman teks akademik dan komunikasi bahasa Inggris.", icon: <Languages className="w-8 h-8 text-teal-500" /> },
    { id: "penalaran-matematika", title: "Penalaran Matematika", description: "Uji kemampuan logika Matematika dan Analisis Matematika.", icon: <Calculator className="w-8 h-8 text-blue-500" /> },
  ];

  const batchLabel = batchId ? batchId.replace("-", " ").toUpperCase() : "BATCH 1";

  return (
    <div className="min-h-screen bg-white px-6 md:px-12 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          TryOut UTBK - <span className="text-red-500">{batchLabel}</span>
        </h1>
        <p className="text-gray-600 mt-2">Pilih salah satu subtest untuk memulai pengerjaan.</p>
      </div>

      {/* Grid Subtest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subtests.map((subtest) => (
          <Card
            key={subtest.id}
            className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-2xl border border-gray-200"
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="mb-4 group-hover:scale-110 transition-transform duration-300">{subtest.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">{subtest.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{subtest.description}</p>
              <Button
                className="mt-5 w-full bg-red-500 hover:bg-red-600 text-white rounded-full"
                onClick={() => router.push(`/tryout/${batchId}/${subtest.id}`)}
              >
                Mulai
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
