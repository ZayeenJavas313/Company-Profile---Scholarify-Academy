"use client";

import { useEffect, useState } from "react";
import BatchList from "./BatchList";
import CustomDropdown from "./CustomDropdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Komponen TambahSoalForm
interface TambahSoalFormProps {
  onClose: () => void;
  onTambahSoal: (data: any) => void;
  batchId?: number | null;
}

const TambahSoalForm = ({ onClose, onTambahSoal, batchId }: TambahSoalFormProps) => {
  const [formData, setFormData] = useState({
    pertanyaan: '',
    pilihan: ['', '', '', '', ''],
    kunci_jawaban: '',
    subtest: 'PU',
  });
  const [soalImage, setSoalImage] = useState<File | null>(null);
  const [optionFiles, setOptionFiles] = useState<Array<File | null>>([null, null, null, null, null]);
  const [error, setError] = useState('');

  const getCsrfToken = () => {
    if (typeof document === 'undefined') return '';
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePilihanChange = (index: number, value: string) => {
    const newPilihan = [...formData.pilihan];
    newPilihan[index] = value;
    setFormData({ ...formData, pilihan: newPilihan });
  };

  const handleSoalImageChange = (file: File | null) => {
    setSoalImage(file);
  };

  const handleOptionFileChange = (index: number, file: File | null) => {
    const newFiles = [...optionFiles];
    newFiles[index] = file;
    setOptionFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.pertanyaan.trim()) {
      setError('Pertanyaan harus diisi');
      return;
    }
    
    const pilihanAktif = formData.pilihan.filter(p => p.trim() !== '');
    if (pilihanAktif.length < 2) {
      setError('Minimal harus ada 2 pilihan jawaban');
      return;
    }
    
    if (!formData.kunci_jawaban) {
      setError('Silakan pilih kunci jawaban');
      return;
    }

    try {
      // Format pilihan menjadi teks dengan format: A. Pilihan A|B. Pilihan B|...
      const pilihanText = pilihanAktif
        .map((p, i) => `${String.fromCharCode(65 + i)}. ${p}`)
        .join('|');

      // Jika ada file yang dipilih, kirim sebagai FormData
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session");
      const sessionData = await sessionRes.json();
      const adminUsername = sessionData?.user?.username || "";
      
      if (!adminUsername) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      let response: Response;
      const hasFiles = soalImage || optionFiles.some(f => f !== null);
      if (hasFiles) {
        const fd = new FormData();
        fd.append('pertanyaan', formData.pertanyaan.trim());
        fd.append('subtest', formData.subtest);
        fd.append('pilihan', pilihanText);
        fd.append('kunci_jawaban', formData.kunci_jawaban);
        fd.append('username', adminUsername);
        if (batchId) fd.append('batch_id', batchId.toString());
        if (soalImage) fd.append('soal_image', soalImage);
        optionFiles.forEach((f, idx) => {
          if (f) fd.append(`option_${String.fromCharCode(97 + idx)}_image`, f);
        });

        response = await fetch(`${API_BASE_URL}/admin/soal/create/?username=${encodeURIComponent(adminUsername)}`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
      } else {
        // Persiapkan JSON payload
        const payload: any = {
          pertanyaan: formData.pertanyaan.trim(),
          subtest: formData.subtest,
          pilihan: pilihanText,
          kunci_jawaban: formData.kunci_jawaban,
          username: adminUsername,
        };
        if (batchId) payload.batch_id = batchId;

        response = await fetch(`${API_BASE_URL}/admin/soal/create/?username=${encodeURIComponent(adminUsername)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      }

      // Dapatkan respon sebagai teks terlebih dahulu
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);
      
      // Coba parse sebagai JSON, jika gagal gunakan teks biasa
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { detail: responseText };
      }
      
      // Periksa jika ada redirect ke halaman login
      if (response.redirected || response.status === 302) {
        window.location.href = '/login';
        return;
      }
      
      // Jika berhasil, tambahkan soal baru ke daftar dan tutup form
      if (response.ok || response.status === 200 || response.status === 201) {
        const newSoal = responseData?.soal || responseData;
        try {
          onTambahSoal(newSoal);
        } catch (e) {
          // ignore if parent doesn't provide handler
        }
        // reset form and close modal
        setFormData({ pertanyaan: '', pilihan: ['', '', '', '', ''], kunci_jawaban: '', subtest: formData.subtest });
        setSoalImage(null);
        setOptionFiles([null, null, null, null, null]);
        setError(''); // Clear error
        onClose();
        return;
      }
      
      // Jika ada error
      let errorMessage = 'Gagal menambahkan soal. ';
      
      if (responseData.detail) {
        errorMessage += responseData.detail;
      } else if (responseData.message) {
        errorMessage += responseData.message;
      } else if (responseData.error) {
        errorMessage += responseData.error;
      } else if (responseData.__all__) {
        errorMessage += responseData.__all__.join(' ');
      } else if (typeof responseData === 'object') {
        errorMessage += JSON.stringify(responseData);
      } else {
        errorMessage += 'Periksa console untuk detail lebih lanjut.';
      }
      
      throw new Error(errorMessage);
      
    } catch (err) {
      console.error('Error saat mengirim soal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan soal. Periksa console untuk detail lebih lanjut.';
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-bold text-slate-900">Tambah Soal Baru</h2>
          <p className="text-xs text-slate-500 mt-0.5">Lengkapi form di bawah untuk menambahkan soal baru</p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {error && (
            <div className="mb-3 bg-red-50 border-l-4 border-red-400 text-red-700 px-3 py-2 rounded-r-lg shadow-sm">
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}
        
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pertanyaan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-900">
                Pertanyaan <span className="text-red-500">*</span>
              </label>
            <textarea
              name="pertanyaan"
              value={formData.pertanyaan}
              onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400 resize-none"
                rows={3}
                placeholder="Masukkan pertanyaan..."
              required
            />
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-slate-600">Unggah gambar (opsional)</label>
                <label className="flex items-center justify-center px-3 py-2 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#EEC0A3] hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleSoalImageChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    className="hidden"
              />
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{soalImage ? soalImage.name : "Pilih gambar"}</span>
                  </div>
                </label>
            </div>
          </div>

            {/* Pilihan Jawaban */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-900">
                Pilihan Jawaban <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
              {formData.pilihan.map((pilihan, index) => (
                  <div key={index} className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#EEC0A3] text-[#4B2F1F] font-bold flex items-center justify-center text-xs">
                        {String.fromCharCode(65 + index)}
                      </span>
                    <input
                      type="text"
                      value={pilihan}
                      onChange={(e) => handlePilihanChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400"
                        placeholder={`Masukkan pilihan ${String.fromCharCode(65 + index)}...`}
                    />
                  </div>
                    <div className="pl-8">
                      <label className="flex items-center justify-center px-2 py-1.5 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#EEC0A3] hover:bg-white transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOptionFileChange(index, e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                          className="hidden"
                        />
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{optionFiles[index] ? optionFiles[index]?.name : "Gambar (opsional)"}</span>
                        </div>
                      </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

            {/* Kunci Jawaban & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">
                  Kunci Jawaban <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  value={formData.kunci_jawaban}
                  onChange={(value) => setFormData({ ...formData, kunci_jawaban: value })}
                  options={formData.pilihan
                    .map((p, index) => {
                      const isImagePath = typeof p === 'string' && (p.startsWith('/media/') || p.startsWith('http'));
                      const hasValue = !isImagePath && p.trim() !== '';
                      return hasValue ? {
                        value: String.fromCharCode(65 + index),
                        label: String.fromCharCode(65 + index)
                      } : null;
                    })
                    .filter((opt): opt is { value: string; label: string } => opt !== null)}
                  placeholder="Pilih Kunci Jawaban"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-900">
                  Subtest <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  value={formData.subtest}
                  onChange={(value) => setFormData({ ...formData, subtest: value })}
                  options={[
                    { value: 'PU', label: 'Penalaran Umum (PU)' },
                    { value: 'PPU', label: 'Pengetahuan & Pemahaman Umum (PPU)' },
                    { value: 'PBM', label: 'Pengetahuan Kuantitatif (PBM)' },
                    { value: 'PK', label: 'Pengetahuan Kuantitatif (PK)' },
                    { value: 'LBI', label: 'Literasi Bahasa Indonesia (LBI)' },
                    { value: 'LBE', label: 'Literasi Bahasa Inggris (LBE)' },
                    { value: 'PM', label: 'Penalaran Matematika (PM)' },
                  ]}
                  placeholder="Pilih Subtest"
                  required
                />
              </div>
          </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
            <button
              type="button"
              onClick={onClose}
                className="inline-flex items-center justify-center h-[32px] px-4 text-xs font-medium leading-[1] text-slate-700 bg-white border border-solid border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm whitespace-nowrap"
              style={{ boxSizing: 'border-box', borderWidth: '1px' }}
            >
              Batal
            </button>
            <button
              type="submit"
                className="inline-flex items-center justify-center h-[32px] px-4 text-xs font-medium leading-[1] text-[#4B2F1F] bg-gradient-to-r from-[#EEC0A3] to-[#D9A684] rounded-xl hover:from-[#D9A684] hover:to-[#c68b65] border border-solid transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
              style={{ boxSizing: 'border-box', borderWidth: '1px', borderColor: 'rgba(217, 166, 132, 0.3)' }}
            >
              Simpan Soal
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

// Komponen EditSoalForm (mirip dengan TambahSoalForm tetapi menerima initialData)
interface EditSoalFormProps {
  initialData: any;
  onClose: () => void;
  onUpdateSoal: (data: any) => void;
}

const EditSoalForm = ({ initialData, onClose, onUpdateSoal }: EditSoalFormProps) => {

  const [formData, setFormData] = useState({
    pertanyaan: initialData?.soal_text || initialData?.pertanyaan || '',
    pilihan: [
      initialData?.option_a || '',
      initialData?.option_b || '',
      initialData?.option_c || '',
      initialData?.option_d || '',
      initialData?.option_e || ''
    ],
    kunci_jawaban: initialData?.correct_answer || initialData?.kunci_jawaban || '',
    subtest: initialData?.subtest_code || initialData?.subtest || 'PU',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePilihanChange = (index: number, value: string) => {
    const newPilihan = [...formData.pilihan];
    newPilihan[index] = value;
    setFormData({ ...formData, pilihan: newPilihan });
  };


  const looksLikeMediaPath = (v: any) => typeof v === 'string' && (v.startsWith('/media/') || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(v) || /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(v));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.pertanyaan.trim()) {
      setError('Pertanyaan harus diisi');
      return;
    }

    const pilihanAktif = formData.pilihan.filter(p => p.trim() !== '');
    if (pilihanAktif.length < 2) {
      setError('Minimal harus ada 2 pilihan jawaban');
      return;
    }

    if (!formData.kunci_jawaban) {
      setError('Silakan pilih kunci jawaban');
      return;
    }

    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session");
      const sessionData = await sessionRes.json();
      const adminUsername = sessionData?.user?.username || "";
      
      if (!adminUsername) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      const pilihanText = pilihanAktif
        .map((p, i) => `${String.fromCharCode(65 + i)}. ${p}`)
        .join('|');

      // Include existing option text so backend can retain image paths
      const payload: any = {
        pertanyaan: formData.pertanyaan.trim(),
        subtest: formData.subtest,
        pilihan: pilihanText,
        kunci_jawaban: formData.kunci_jawaban,
        username: adminUsername,
      };
      
      formData.pilihan.forEach((p, idx) => {
        if (p) payload[`option_${String.fromCharCode(97 + idx)}`] = p;
      });

      const res = await fetch(`${API_BASE_URL}/admin/soal/${initialData.id}/update/?username=${encodeURIComponent(adminUsername)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { detail: text }; }

      if (!res.ok) {
        const msg = data?.error || data?.detail || 'Gagal mengupdate soal';
        throw new Error(msg);
      }

      const updated = data?.soal || data;
      onUpdateSoal(updated);
      onClose();
    } catch (err) {
      console.error('Error updating soal:', err);
      setError(err instanceof Error ? err.message : 'Gagal mengupdate soal');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-bold text-slate-900">Edit Soal</h2>
          <p className="text-xs text-slate-500 mt-0.5">Perbarui informasi soal di bawah ini</p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {error && (
            <div className="mb-3 bg-red-50 border-l-4 border-red-400 text-red-700 px-3 py-2 rounded-r-lg shadow-sm">
              <p className="text-xs font-medium">{error}</p>
                </div>
              )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pertanyaan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-900">
                Pertanyaan <span className="text-red-500">*</span>
              </label>
              <textarea
                name="pertanyaan"
                value={formData.pertanyaan}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400 resize-none"
                rows={3}
                required
              />
                </div>

            {/* Pilihan Jawaban */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-900">
                Pilihan Jawaban <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {formData.pilihan.map((pilihan, index) => {
                  const isImagePath = looksLikeMediaPath(pilihan);
                  const displayText = isImagePath ? '' : pilihan;
                  
                  return (
                    <div key={index} className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#EEC0A3] text-[#4B2F1F] font-bold flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input
                          type="text"
                          value={displayText}
                          onChange={(e) => handlePilihanChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400"
                          placeholder={`Masukkan pilihan ${String.fromCharCode(65 + index)}...`}
                        />
            </div>
                      {/* Info jika opsi adalah gambar */}
                      {isImagePath && (
                        <div className="pl-8 mt-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-600">
                          Opsi ini menggunakan gambar (tidak dapat diubah dari form ini)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kunci Jawaban */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-900">
                Kunci Jawaban <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                value={formData.kunci_jawaban}
                onChange={(value) => setFormData({ ...formData, kunci_jawaban: value })}
                options={formData.pilihan
                  .map((p, index) => {
                    const isImagePath = looksLikeMediaPath(p);
                    const hasValue = !isImagePath && p.trim() !== '';
                    return hasValue ? {
                      value: String.fromCharCode(65 + index),
                      label: String.fromCharCode(65 + index)
                    } : null;
                  })
                  .filter((opt): opt is { value: string; label: string } => opt !== null)}
                placeholder="Pilih Kunci Jawaban"
                required
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
            <button
              type="button"
              onClick={onClose}
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
              Simpan Perubahan
            </button>
          </div>
        </form>
        </div>
      </div>

    </div>
  );
};

export default function SoalList() {
  const [soal, setSoal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [filters, setFilters] = useState({ subtest_code: "", search: "" });
  const [showTambahForm, setShowTambahForm] = useState(false);
  const [editingSoal, setEditingSoal] = useState<any | null>(null);
  const [showSubtestDropdown, setShowSubtestDropdown] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showBatchManagement, setShowBatchManagement] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);

  // Mapping warna untuk setiap subtest - sama dengan SubtestStats untuk konsistensi
  const getSubtestColor = (code: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      'PU': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      'PM': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      'LBE': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
      'LBI': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      'PK': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      'PBM': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      'PPU': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    };
    return colorMap[code] || { bg: 'bg-[#EEC0A3]/20', text: 'text-[#4B2F1F]', border: 'border-[#D9A684]/40' };
  };

  const subtestOptions = [
    { code: "", name: "Semua Subtest" },
    { code: "PU", name: "Penalaran Umum" },
    { code: "PM", name: "Penalaran Matematika" },
    { code: "LBE", name: "Literasi Bahasa Inggris" },
    { code: "LBI", name: "Literasi Bahasa Indonesia" },
    { code: "PK", name: "Pengetahuan Kuantitatif" },
    { code: "PBM", name: "Pemahaman Bacaan & Menulis" },
    { code: "PPU", name: "Pengetahuan & Pemahaman Umum" },
  ];

  const selectedSubtest = subtestOptions.find(opt => opt.code === filters.subtest_code) || subtestOptions[0];

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchSoal();
    }
  }, [page, filters, selectedBatchId]);

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
    }
  };

  const fetchSoal = async () => {

    try {
      setLoading(true);
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
      
      const params = new URLSearchParams({
        username: username,
        page: page.toString(),
        limit: "50",
      });
      if (selectedBatchId) params.append("batch_id", selectedBatchId.toString());
      if (filters.subtest_code) params.append("subtest_code", filters.subtest_code);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`${API_BASE_URL}/admin/soal/?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${res.status}` };
        }
        throw new Error(errorData.error || errorData.detail || `Gagal mengambil data soal (${res.status})`);
      }

      const data = await res.json();
      setSoal(data.results || []);
      setPagination(data.pagination || { 
        total: data.results?.length || 0, 
        has_prev: page > 1,
        has_next: false
      });
    } catch (error) {
      console.error("Error fetching soal:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data soal";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTambahSoal = (soalBaru: any) => {
    setSoal([soalBaru, ...soal]);
    setPagination((prev: any) => ({
      ...prev,
      total: (prev?.total || 0) + 1
    }));
  };

  const handleUpdateSoal = (updated: any) => {
    setSoal(prev => prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s)));
  };

  const handleDeleteSoal = async (id: number) => {
    const ok = confirm('Hapus soal ini? Tindakan ini tidak dapat dikembalikan.');
    if (!ok) return;

    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session");
      const sessionData = await sessionRes.json();
      const adminUsername = sessionData?.user?.username || "";
      
      if (!adminUsername) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/soal/${id}/delete/?username=${encodeURIComponent(adminUsername)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text();
        let data;
        try { data = JSON.parse(txt); } catch { data = { detail: txt }; }
        throw new Error(data?.error || data?.detail || 'Gagal menghapus soal');
      }
      // remove from list
      setSoal(prev => prev.filter(s => s.id !== id));
      setPagination((prev: any) => ({ ...prev, total: Math.max(0, (prev?.total || 1) - 1) }));
    } catch (err) {
      console.error('Error deleting soal:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus soal');
    }
  };

  // Search Icon Component
  const SearchIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );

  // Chevron Down Icon Component
  const ChevronDownIcon = () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Section 1: Kelola Batch TryOut */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kelola Batch TryOut</h2>
                <p className="text-xs text-slate-500 mt-0.5">Atur batch tryout dan kelola bank soal per batch</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowBatchManagement(!showBatchManagement);
                if (!showBatchManagement) {
                  fetchBatches();
                }
              }}
              className="px-4 py-2 h-[38px] text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap min-w-[200px]"
            >
              {showBatchManagement ? 'Sembunyikan Batch TryOut' : 'Tampilkan Batch TryOut'}
            </button>
          </div>
        </div>
        
        {/* Content */}
        {showBatchManagement && (
          <div className="p-5">
            <BatchList onBatchChange={() => fetchBatches()} />
          </div>
        )}
      </div>

      {/* Section 2: Kelola Bank Soal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EEC0A3] to-[#D9A684] flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-[#4B2F1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kelola Bank Soal</h2>
                <p className="text-xs text-slate-500 mt-0.5">Pilih batch untuk mengelola bank soal</p>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                className="px-4 py-2 h-[38px] text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all duration-200 shadow-sm flex items-center gap-2 min-w-[200px] justify-between"
              >
                <span className="text-slate-900 font-medium truncate">
                  {selectedBatchId
                    ? batches.find(b => b.id === selectedBatchId)?.batch_id + ' - ' + batches.find(b => b.id === selectedBatchId)?.title
                    : 'Pilih Batch'}
                </span>
                <div className="flex-shrink-0">
                  <ChevronDownIcon />
                </div>
              </button>
              
              {showBatchDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowBatchDropdown(false)}
                  ></div>
                  <div className="absolute z-20 mt-2 right-0 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden py-1 max-h-60 overflow-y-auto min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBatchId(null);
                        setShowBatchDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                        !selectedBatchId ? 'bg-slate-50' : ''
                      }`}
                    >
                      {!selectedBatchId ? (
                        <svg className="w-4 h-4 text-slate-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0"></div>
                      )}
                      <span className="flex-1">-- Pilih Batch --</span>
                    </button>
                    {batches.map((batch) => (
                      <button
                        key={batch.id}
                        type="button"
                        onClick={() => {
                          setSelectedBatchId(batch.id);
                          setShowBatchDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                          selectedBatchId === batch.id ? 'bg-slate-50' : ''
                        }`}
                      >
                        {selectedBatchId === batch.id ? (
                          <svg className="w-4 h-4 text-slate-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-4 h-4 flex-shrink-0"></div>
                        )}
                        <span className="flex-1 truncate">{batch.batch_id} - {batch.title}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">

          {/* Bank Soal Content - Only show if batch selected */}
          {!selectedBatchId ? (
            <div className="py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Pilih Batch Terlebih Dahulu</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Silakan pilih batch tryout terlebih dahulu untuk mengelola bank soal. Setiap batch memiliki bank soal masing-masing.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Title and Action Section */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bank Soal - {batches.find(b => b.id === selectedBatchId)?.batch_id || 'Batch Terpilih'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Kelola soal untuk batch yang dipilih</p>
                </div>
                <button
                  onClick={() => setShowTambahForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#EEC0A3] to-[#D9A684] text-[#4B2F1F] text-xs font-medium rounded-xl hover:from-[#D9A684] hover:to-[#c68b65] border border-[#D9A684]/30 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  <span className="text-base">+</span>
                  <span>Tambah Soal</span>
                </button>
              </div>
              
                  {/* Search and Filter Section */}
              <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
          <input
            type="text"
            placeholder="Cari soal..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 h-[38px] text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>
          
          
          {/* Subtest Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSubtestDropdown(!showSubtestDropdown)}
              className="w-full pl-3 pr-9 py-2 h-[38px] text-xs border-2 border-slate-400 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-500 transition-all text-slate-900 bg-white text-left flex items-center justify-between min-w-[200px] hover:border-slate-500"
            >
              <span className="text-slate-900 font-medium">{selectedSubtest.name}</span>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDownIcon />
              </div>
            </button>
            
            {showSubtestDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowSubtestDropdown(false)}
                ></div>
                <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden py-1">
                  {subtestOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        setFilters({ ...filters, subtest_code: option.code });
                        setShowSubtestDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                        filters.subtest_code === option.code ? 'bg-slate-50' : ''
                      }`}
                    >
                      {filters.subtest_code === option.code ? (
                        <svg className="w-4 h-4 text-slate-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0"></div>
                      )}
                      <span className="flex-1">{option.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          </div>

              {showTambahForm && (
                <TambahSoalForm
                  onClose={() => setShowTambahForm(false)}
                  onTambahSoal={(newSoal) => {
                    handleTambahSoal(newSoal);
                    fetchSoal(); // Refresh list setelah berhasil
                  }}
                  batchId={selectedBatchId}
                />
              )}
              {editingSoal && (
                <EditSoalForm
                  initialData={editingSoal}
                  onClose={() => setEditingSoal(null)}
                  onUpdateSoal={(data) => { handleUpdateSoal(data); setEditingSoal(null); }}
                />
              )}

              {/* Table Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-xs font-medium text-slate-600">Memuat data soal...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">ID</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">SUBTEST</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">SOAL</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">GAMBAR</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">KUNCI</th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {soal.length > 0 ? (
                        soal.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs font-medium text-slate-900">#{s.id}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {(() => {
                                const code = s.subtest_code || s.subtest;
                                const colors = getSubtestColor(code);
                                return (
                                  <span className={`inline-flex items-center justify-center w-7 h-7 text-[9px] font-bold rounded-xl ${colors.bg} ${colors.text} border ${colors.border} flex-shrink-0 shadow-sm`}>
                                    {code}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-medium max-w-md text-slate-900">
                                {s.soal_text || s.pertanyaan}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs text-slate-600">
                                {s.has_image ? 'Ya' : 'Tidak'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-[10px] font-bold bg-[#EEC0A3] text-[#4B2F1F]">
                                {s.correct_answer || s.kunci_jawaban}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => setEditingSoal(s)} 
                                  className="px-2 py-1 text-[10px] font-medium bg-white border border-blue-200 rounded-xl hover:bg-blue-50/50 transition-all duration-200 text-blue-600 flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteSoal(s.id)} 
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
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center">
                            <p className="text-xs text-slate-500">Tidak ada data soal</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.total > 0 && (
                  <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      Menampilkan <span className="font-semibold text-slate-900">{((page - 1) * 50) + 1}</span> - <span className="font-semibold text-slate-900">{Math.min(page * 50, pagination.total)}</span> dari <span className="font-semibold text-slate-900">{pagination.total}</span>
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!pagination?.has_prev}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all duration-200 text-slate-700"
                      >
                        &lt; Sebelumnya
                      </button>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!pagination?.has_next}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all duration-200 text-slate-700"
                      >
                        Selanjutnya &gt;
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}