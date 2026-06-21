"use client";

import { useEffect, useState } from "react";
import DatePicker from "./DatePicker";
import CustomDropdown from "./CustomDropdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Batch {
  id: number;
  batch_id: string;
  title: string;
  date: string;
  date_display: string;
  deadline: string;
  deadline_display: string;
  status: 'available' | 'locked';
  description: string;
  is_visible: boolean;
}

interface BatchListProps {
  onBatchChange?: () => void;
}

export default function BatchList({ onBatchChange }: BatchListProps = {}) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTambahForm, setShowTambahForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    batch_id: '',
    title: '',
    date: '',
    deadline: '',
    status: 'locked' as 'available' | 'locked',
    description: '',
    is_visible: true,
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await sessionRes.json();
      const username = sessionData?.user?.username || "";
      
      if (!username) {
        console.error('Session tidak valid untuk fetch batches');
        setBatches([]);
        setLoading(false);
        return;
      }

      const apiUrl = `${API_BASE_URL}/admin/batches/?username=${encodeURIComponent(username)}`;
      console.log("Fetching batches from:", apiUrl);
      
      let res;
      try {
        res = await fetch(apiUrl, {
          credentials: 'include',
          cache: 'no-store',
        });
      } catch (fetchError: any) {
        // Network error atau backend tidak bisa dijangkau
        console.error("Fetch error:", fetchError);
        const errorMessage = fetchError.message || "Unknown error";
        
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
          console.error(`Backend server tidak dapat dijangkau di ${API_BASE_URL.replace('/api', '')}`);
          console.error("Pastikan backend Django berjalan dan CORS sudah dikonfigurasi");
          alert(`Backend server tidak dapat dijangkau.\n\nPastikan:\n1. Backend Django berjalan di ${API_BASE_URL.replace('/api', '')}\n2. CORS sudah dikonfigurasi dengan benar\n\nError: ${errorMessage}`);
        } else {
          alert(`Gagal menghubungi backend server.\n\nError: ${errorMessage}`);
        }
        setBatches([]);
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Gagal mengambil data batch' };
        }
        throw new Error(errorData?.error || errorData?.detail || 'Gagal mengambil data batch');
      }
      
      const data = await res.json();
      setBatches(data.results || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await sessionRes.json();
      const username = sessionData?.user?.username || "";
      
      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      const url = editingBatch
        ? `${API_BASE_URL}/admin/batches/${editingBatch.id}/?username=${encodeURIComponent(username)}`
        : `${API_BASE_URL}/admin/batches/create/?username=${encodeURIComponent(username)}`;
      
      const method = editingBatch ? 'PUT' : 'POST';
      
      // Ensure is_visible is sent as boolean
      const payload = {
        ...formData,
        is_visible: Boolean(formData.is_visible),
      };
      
      console.log('Submitting batch:', payload);
      
      // Get CSRF token
      const getCsrfToken = () => {
        if (typeof document === 'undefined') return '';
        const cookie = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
      };
      const csrfToken = getCsrfToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = 'Gagal menyimpan batch';
        try {
          const errorData = await res.json();
          console.error('Error response:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log('Success response:', result);

      setShowTambahForm(false);
      setEditingBatch(null);
      setFormData({
        batch_id: '',
        title: '',
        date: '',
        deadline: '',
        status: 'locked',
        description: '',
        is_visible: true,
      });
      fetchBatches();
    } catch (err) {
      console.error('Error saving batch:', err);
      alert(err instanceof Error ? err.message : 'Gagal menyimpan batch');
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      batch_id: batch.batch_id,
      title: batch.title,
      date: batch.date.split('T')[0],
      deadline: batch.deadline.split('T')[0],
      status: batch.status,
      description: batch.description,
      is_visible: batch.is_visible,
    });
    setShowTambahForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus batch ini?')) return;
    
    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await sessionRes.json();
      const username = sessionData?.user?.username || "";
      
      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      const deleteUrl = `${API_BASE_URL}/admin/batches/${id}/delete/?username=${encodeURIComponent(username)}`;
      console.log('Delete batch URL:', deleteUrl);
      console.log('Delete batch username:', username);
      
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      console.log('Delete batch response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = 'Gagal menghapus batch';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Jika bukan JSON, gunakan errorText atau default message
          if (errorText && !errorText.includes('<!DOCTYPE')) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      if (data.success) {
        fetchBatches();
      } else {
        throw new Error('Gagal menghapus batch');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus batch');
    }
  };

  const handleCancel = () => {
    setShowTambahForm(false);
    setEditingBatch(null);
    setFormData({
      batch_id: '',
      title: '',
      date: '',
      deadline: '',
      status: 'locked',
      description: '',
      is_visible: true,
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-xs text-slate-600">Memuat data batch...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Daftar Batch</h3>
          <p className="text-xs text-slate-500 mt-0.5">Atur tampilan batch di dashboard tryout</p>
        </div>
        <button
          onClick={() => setShowTambahForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#EEC0A3] to-[#D9A684] text-[#4B2F1F] text-xs font-medium rounded-xl hover:from-[#D9A684] hover:to-[#c68b65] border border-[#D9A684]/30 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md"
        >
          <span className="text-base">+</span>
          <span>Tambah Batch</span>
        </button>
      </div>

      {showTambahForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">
            {editingBatch ? 'Edit Batch' : 'Tambah Batch Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Batch ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.batch_id}
                  onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white"
                  placeholder="batch-1"
                  required
                  disabled={!!editingBatch}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white"
                  placeholder="TryOut SNBT Batch 1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(value) => setFormData({ ...formData, date: value })}
                  placeholder="Pilih tanggal mulai"
                  minDate={undefined}
                  maxDate={formData.deadline || undefined}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.deadline}
                  onChange={(value) => setFormData({ ...formData, deadline: value })}
                  placeholder="Pilih deadline"
                  minDate={formData.date || undefined}
                  maxDate={undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as 'available' | 'locked' })}
                  options={[
                    { value: 'locked', label: 'Terkunci' },
                    { value: 'available', label: 'Tersedia' },
                  ]}
                  placeholder="Pilih Status"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Tampilkan di Dashboard
                </label>
                <CustomDropdown
                  value={formData.is_visible ? 'true' : 'false'}
                  onChange={(value) => setFormData({ ...formData, is_visible: value === 'true' })}
                  options={[
                    { value: 'true', label: 'Tampilkan' },
                    { value: 'false', label: 'Sembunyikan' },
                  ]}
                  placeholder="Pilih Status Tampilan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white resize-none"
                rows={2}
                placeholder="Deskripsi batch (opsional)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center justify-center h-[32px] px-4 text-xs font-medium leading-[1] text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm whitespace-nowrap"
                style={{ boxSizing: 'border-box' }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center justify-center h-[32px] px-4 text-xs font-medium leading-[1] text-[#4B2F1F] bg-gradient-to-r from-[#EEC0A3] to-[#D9A684] rounded-xl hover:from-[#D9A684] hover:to-[#c68b65] border border-[#D9A684]/30 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                style={{ boxSizing: 'border-box' }}
              >
                {editingBatch ? 'Simpan Perubahan' : 'Simpan Batch'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Batch ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Judul</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tampilkan</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <p className="text-xs text-slate-500">Tidak ada data batch</p>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-900">{batch.batch_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-900">{batch.title}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-600">{batch.date_display}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-medium ${
                        batch.status === 'available' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {batch.status === 'available' ? 'Tersedia' : 'Terkunci'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {batch.is_visible ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Tampil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                          Tersembunyi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(batch)}
                          className="px-2 py-1 text-[10px] font-medium bg-white border border-blue-200 rounded-xl hover:bg-blue-50/50 transition-all duration-200 text-blue-600 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="px-2 py-1 text-[10px] font-medium bg-red-500/90 text-white rounded-xl hover:bg-red-600/90 transition-all duration-200 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

