"use client";

import { useEffect, useState } from "react";
import CustomDropdown from "./CustomDropdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Helper function untuk membaca JSON response dengan aman
const safeJsonParse = async (response: Response): Promise<any> => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // Jika bukan JSON (misalnya HTML error page)
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error('Server mengembalikan HTML instead of JSON. Periksa console untuk detail.');
    }
    throw new Error(`Failed to parse JSON: ${text.substring(0, 100)}`);
  }
};

export default function HasilList() {
  const [hasil, setHasil] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [filters, setFilters] = useState({ username: "", subtest_code: "" });
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchHasil();
  }, [page, filters]);

  const handleShowDetail = async (hasilId: number) => {
    try {
      setLoadingDetail(true);
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const adminUsername = sessionData?.user?.username || "";
      
      if (!adminUsername) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/hasil/${hasilId}/detail/?username=${encodeURIComponent(adminUsername)}`, {
        credentials: "include",
      });

      const responseText = await res.text();

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            errorData = { error: 'Terjadi kesalahan pada server. Periksa console untuk detail.' };
          } else {
            errorData = { error: responseText || 'Gagal mengambil detail jawaban' };
          }
        }
        throw new Error(errorData?.error || errorData?.detail || 'Gagal mengambil detail jawaban');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Gagal memparse response dari server');
      }

      setSelectedDetail(data);
    } catch (error) {
      console.error("Error fetching detail jawaban:", error);
      alert(error instanceof Error ? error.message : 'Gagal mengambil detail jawaban');
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchHasil = async () => {
    try {
      setLoading(true);
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const adminUsername = sessionData?.user?.username || "";
      
      if (!adminUsername) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }
      
      const params = new URLSearchParams({
        username: adminUsername,
        page: page.toString(),
        limit: "50",
      });
      if (filters.username) params.append("search_username", filters.username);
      if (filters.subtest_code) params.append("subtest_code", filters.subtest_code);

      const res = await fetch(`${API_BASE_URL}/admin/hasil/?${params}`, {
        credentials: "include",
      });

      // Baca response sebagai text terlebih dahulu
      const responseText = await res.text();

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            errorData = { error: 'Terjadi kesalahan pada server. Periksa console untuk detail.' };
          } else {
            errorData = { error: responseText || 'Failed to fetch hasil' };
          }
        }
        throw new Error(errorData?.error || errorData?.detail || 'Gagal mengambil data hasil tryout');
      }

      // Parse JSON response untuk success case
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse JSON response:', responseText);
        data = { results: [], pagination: null };
      }
      setHasil(data.results || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Error fetching hasil:", error);
      alert(error instanceof Error ? error.message : 'Gagal mengambil data hasil tryout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Hasil Tryout</h1>
          <p className="text-xs text-slate-500 mt-0.5">Lihat hasil tryout semua pengguna</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Cari username..."
            value={filters.username}
            onChange={(e) => setFilters({ ...filters, username: e.target.value })}
            className="flex-[5] px-4 py-2 h-[38px] text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400"
          />
        <div className="flex-[1]">
          <CustomDropdown
            value={filters.subtest_code}
            onChange={(value) => setFilters({ ...filters, subtest_code: value })}
            options={[
              { value: '', label: 'Semua Subtest' },
              { value: 'PU', label: 'PU' },
              { value: 'PPU', label: 'PPU' },
              { value: 'PBM', label: 'PBM' },
              { value: 'PK', label: 'PK' },
              { value: 'LBI', label: 'LBI' },
              { value: 'LBE', label: 'LBE' },
              { value: 'PM', label: 'PM' },
            ]}
            placeholder="Semua Subtest"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">

      {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-200 border-t-[#D9A684] mx-auto mb-4"></div>
            <p className="text-xs font-medium text-slate-600">Memuat data hasil tryout...</p>
        </div>
        ) : hasil.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">USER</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">SUBTEST</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">BATCH</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">BENAR</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">SALAH</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">KOSONG</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">SKOR</th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">AKSI</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {hasil.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-900">{h.user_name}</div>
                      <div className="text-[10px] text-slate-500">@{h.username}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700">{h.subtest_code}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-600">{h.batch_id}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-green-600">{h.jumlah_benar}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-red-600">{h.jumlah_salah}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-500">{h.jumlah_kosong}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-xs font-bold text-slate-900">{Math.round(h.skor)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleShowDetail(h.id)}
                        className="px-2.5 py-1.5 text-[10px] font-medium bg-[#D9A684] text-[#4B2F1F] rounded-xl hover:bg-[#D9A684]/90 transition-all duration-200 flex items-center gap-1.5 hover:shadow-sm mx-auto"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs font-medium text-slate-400">Tidak ada data hasil tryout</p>
            </div>
          </div>
        )}

        {pagination && hasil.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <p className="text-xs text-slate-600">
                Menampilkan {((page - 1) * 50) + 1} - {Math.min(page * 50, pagination.total)} dari {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.has_prev}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-sm"
                style={{ borderWidth: '1px', borderStyle: 'solid' }}
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.has_next}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 hover:shadow-sm"
                style={{ borderWidth: '1px', borderStyle: 'solid' }}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Detail Jawaban Modal */}
      {selectedDetail && (
        <DetailJawabanModal
          data={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          loading={loadingDetail}
        />
      )}
    </div>
  );
}

// Komponen Modal Detail Jawaban
function DetailJawabanModal({ data, onClose, loading }: { data: any; onClose: () => void; loading: boolean }) {
  const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Detail Jawaban</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {data.user_name} (@{data.username}) - {data.subtest_nama} ({data.subtest_code}) - Batch {data.batch_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-700">Skor:</span>
              <span className="font-bold text-slate-900">{Math.round(data.skor)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-green-600 font-medium">Benar: {data.jumlah_benar}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-red-600 font-medium">Salah: {data.jumlah_salah}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-slate-500 font-medium">Kosong: {data.jumlah_kosong}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-[#D9A684] mx-auto mb-3"></div>
              <p className="text-xs font-medium text-slate-600">Memuat detail jawaban...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.detail_jawaban?.map((item: any) => (
                <div
                  key={item.soal_id}
                  className={`p-3 rounded-xl border-2 ${
                    item.is_benar
                      ? 'bg-green-50 border-green-200'
                      : item.status === 'salah'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      item.is_benar
                        ? 'bg-green-500 text-white'
                        : item.status === 'salah'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-400 text-white'
                    }`}>
                      {item.nomor}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          item.is_benar
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'salah'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status === 'benar' ? '✓ Benar' : item.status === 'salah' ? '✗ Salah' : '○ Kosong'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Jawaban User: <span className="font-semibold">{item.jawaban_user || '-'}</span> | 
                          Jawaban Benar: <span className="font-semibold">{item.jawaban_benar}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 mb-2 whitespace-pre-wrap">{item.pertanyaan}</p>
                      {item.soal_image && (
                        <div className="mb-2">
                          <img
                            src={item.soal_image.startsWith('/media/') ? `${BACKEND_ORIGIN}${item.soal_image}` : item.soal_image}
                            alt="Soal"
                            className="max-w-full max-h-48 rounded-lg border border-slate-200"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                          <div
                            key={opt}
                            className={`p-2 rounded-lg text-xs border ${
                              item.jawaban_user === opt
                                ? item.is_benar
                                  ? 'bg-green-100 border-green-300'
                                  : 'bg-red-100 border-red-300'
                                : item.jawaban_benar === opt
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`font-bold ${
                                item.jawaban_user === opt
                                  ? item.is_benar
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                  : item.jawaban_benar === opt
                                  ? 'text-blue-700'
                                  : 'text-slate-600'
                              }`}>
                                {opt}.
                              </span>
                              {item.jawaban_user === opt && (
                                <span className="text-[10px] font-semibold text-slate-600">(Jawaban User)</span>
                              )}
                              {item.jawaban_benar === opt && item.jawaban_user !== opt && (
                                <span className="text-[10px] font-semibold text-blue-600">(Jawaban Benar)</span>
                              )}
                            </div>
                            {item.pilihan[opt] !== null && (
                              <p className="text-slate-700">{item.pilihan[opt]}</p>
                            )}
                            {item.option_images?.[opt] && (
                              <img
                                src={item.option_images[opt].startsWith('/media/') ? `${BACKEND_ORIGIN}${item.option_images[opt]}` : item.option_images[opt]}
                                alt={`Opsi ${opt}`}
                                className="mt-1 max-w-full max-h-24 rounded border border-slate-200"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 h-[32px] text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center shadow-sm"
            style={{ borderWidth: '1px', borderStyle: 'solid' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}