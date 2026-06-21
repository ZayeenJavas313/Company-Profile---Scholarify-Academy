"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const getCsrfToken = () => {
  if (typeof document === 'undefined') return '';
  const cookie = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='));
  return cookie ? cookie.split('=')[1] : '';
};

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

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [editingPassword, setEditingPassword] = useState<number | null>(null);
  const [revealingPassword, setRevealingPassword] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    checkAdminStatus(); // Debug: cek status admin
  }, []);

  const checkAdminStatus = async () => {
    try {
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionText = await sessionRes.text();
      let sessionData;
      try {
        sessionData = JSON.parse(sessionText);
      } catch {
        console.error('Failed to parse session response:', sessionText);
        return;
      }
      const username = sessionData?.user?.username || "";
      
      if (username) {
        // Cek status admin di backend
        const apiUrl = `${API_BASE_URL}/admin/check-status/?username=${encodeURIComponent(username)}`;
        console.log("Checking admin status from:", apiUrl);
        
        let statusRes;
        try {
          statusRes = await fetch(apiUrl, {
            credentials: "include",
            cache: 'no-store',
          });
        } catch (fetchError: any) {
          // Network error atau backend tidak bisa dijangkau
          console.error("Fetch error in checkAdminStatus:", fetchError);
          const errorMessage = fetchError.message || "Unknown error";
          
          if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
            console.error(`Backend server tidak dapat dijangkau di ${API_BASE_URL.replace('/api', '')}`);
            console.error("Pastikan backend Django berjalan dan CORS sudah dikonfigurasi");
            // Don't show alert here, just log - this is a background check
          }
          // Return default (assume not admin if can't check)
          return;
        }
        
        const statusText = await statusRes.text();
        let statusData;
        try {
          statusData = JSON.parse(statusText);
        } catch {
          // Jika bukan JSON (misalnya HTML error page), skip check
          if (statusText.includes('<!DOCTYPE') || statusText.includes('<html')) {
            console.warn('Backend returned HTML instead of JSON for admin check');
          }
          return;
        }
        console.log('🔍 Admin Status Check:', statusData);
        
        if (!statusData.is_staff) {
          console.error('❌ User bukan admin!', statusData);
          alert(`Peringatan: User "${username}" bukan admin (is_staff=${statusData.is_staff}). Silakan hubungi administrator untuk mengaktifkan akses admin.`);
        } else {
          console.log('✅ User adalah admin');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Ambil username dari session (ikutkan cookie session)
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const username = sessionData?.user?.username || "";
      
      console.log('Session data:', sessionData);
      console.log('Username from session:', username);
      
      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }
      
      const apiUrl = `${API_BASE_URL}/admin/users/?username=${encodeURIComponent(username)}`;
      console.log("Fetching users from:", apiUrl);
      
      let res;
      try {
        res = await fetch(apiUrl, {
          credentials: "include",
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
        setUsers([]);
        return;
      }

      // Baca response sebagai text terlebih dahulu
      const responseText = await res.text();

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // Jika bukan JSON (misalnya HTML error page), extract pesan error
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            errorData = { error: 'Terjadi kesalahan pada server. Periksa console untuk detail.' };
          } else {
            errorData = { error: responseText || 'Failed to fetch users' };
          }
        }
        throw new Error(errorData?.error || errorData?.detail || 'Failed to fetch users');
      }

      // Parse JSON response untuk success case
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse JSON response:', responseText);
        data = [];
      }
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(error instanceof Error ? error.message : 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (payload: any) => {
    try {
      setCreating(true);

      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const username = sessionData?.user?.username || "";

      console.log('Create user - Session data:', sessionData);
      console.log('Create user - Username from session:', username);

      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        setCreating(false);
        return;
      }

      // Tambahkan username admin ke query parameter
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const res = await fetch(`${API_BASE_URL}/admin/users/create/?username=${encodeURIComponent(username)}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      // Baca response sebagai text terlebih dahulu
      const responseText = await res.text();

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // Jika bukan JSON (misalnya HTML error page), extract pesan error
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            errorData = { error: 'Terjadi kesalahan pada server. Periksa console untuk detail.' };
          } else {
            errorData = { error: responseText || 'Gagal membuat user' };
          }
        }
        throw new Error(errorData?.error || errorData?.detail || 'Gagal membuat user');
      }

      // Parse JSON response untuk success case
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }
      if (data.user) {
      // prepend new user
      setUsers(prev => [data.user, ...prev]);
      setShowAddForm(false);
        alert('User berhasil ditambahkan');
      } else {
        // Jika response tidak sesuai, refresh dari server
        await fetchUsers();
        setShowAddForm(false);
        alert('User berhasil ditambahkan');
      }
    } catch (err) {
      console.error('Create user error:', err);
      alert(err instanceof Error ? err.message : 'Gagal membuat user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const username = sessionData?.user?.username || "";

      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      console.log('Deleting user:', id, 'with admin username:', username);

      // Tambahkan username admin ke query parameter
      const url = `${API_BASE_URL}/admin/users/${id}/delete/?username=${encodeURIComponent(username)}`;
      console.log('Delete URL:', url);
      
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      
      console.log('Delete response status:', res.status, res.statusText);
      
      // Baca response sebagai text terlebih dahulu
      const responseText = await res.text();
      
      if (!res.ok) {
        console.error('Delete error response:', responseText);
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          // Jika bukan JSON (misalnya HTML error page), extract pesan error
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            data = { error: 'Terjadi kesalahan pada server. Periksa console untuk detail.' };
          } else {
            data = { error: responseText || 'Gagal menghapus user' };
          }
        }
        const errorMsg = data?.error || data?.detail || 'Gagal menghapus user';
        console.error('Delete error:', errorMsg);
        alert(errorMsg);
        return;
      }
      
      // Parse JSON response untuk success case
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        // Jika bukan JSON, anggap success jika status 200
        result = { success: true, message: 'User berhasil dihapus' };
      }
      console.log('Delete success:', result);
      
      // Update state langsung
      setUsers(prev => prev.filter(u => u.id !== id));
      
      // Juga refresh dari server untuk memastikan data terbaru
      setTimeout(() => {
        fetchUsers();
      }, 100);
      
      // Tampilkan pesan sukses dari response atau default
      alert(result?.message || 'User berhasil dihapus');
    } catch (err) {
      console.error('Delete user error:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus user');
    }
  };

  const toggleShowPassword = (userId: number) => {
    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleRevealPassword = async (id: number) => {
    if (!confirm('Generate password baru untuk user ini? Password lama akan diganti.')) return;
    
    try {
      setRevealingPassword(id);
      
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const username = sessionData?.user?.username || "";

      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reveal-password/?username=${encodeURIComponent(username)}`, {
        method: 'POST',
        headers,
        credentials: 'include',
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
            errorData = { error: responseText || 'Gagal generate password' };
          }
        }
        throw new Error(errorData?.error || errorData?.detail || 'Gagal generate password');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }

      if (data.success && data.password) {
        // Update user password in state
        setUsers(prev => prev.map(u => 
          u.id === id ? { ...u, password: data.password } : u
        ));
        // Show password after reveal
        setShowPassword(prev => ({ ...prev, [id]: true }));
        alert(`Password baru: ${data.password}\n\nPassword telah disimpan dan bisa dilihat di tabel.`);
      } else {
        await fetchUsers();
        alert('Password berhasil di-generate. Silakan refresh untuk melihat.');
      }
    } catch (err) {
      console.error('Reveal password error:', err);
      alert(err instanceof Error ? err.message : 'Gagal generate password');
    } finally {
      setRevealingPassword(null);
    }
  };

  const handleUpdatePassword = async (id: number, newPassword: string) => {
    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const username = sessionData?.user?.username || "";

      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const res = await fetch(`${API_BASE_URL}/admin/users/${id}/update-password/?username=${encodeURIComponent(username)}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
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
            errorData = { error: responseText || 'Gagal update password' };
          }
        }
        throw new Error(errorData?.error || errorData?.detail || 'Gagal update password');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }

      if (data.success) {
        // Update user password in state
        setUsers(prev => prev.map(u => 
          u.id === id ? { ...u, password: data.password } : u
        ));
        // Show password after update
        setShowPassword(prev => ({ ...prev, [id]: true }));
        setEditingPassword(null);
        alert('Password berhasil diupdate.');
      } else {
        await fetchUsers();
        alert('Password berhasil diupdate. Silakan refresh untuk melihat.');
      }
    } catch (err) {
      console.error('Update password error:', err);
      alert(err instanceof Error ? err.message : 'Gagal update password');
    }
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    try {
      // Ambil username admin dari session
      const sessionRes = await fetch("/api/check-session", {
        credentials: 'include',
        cache: 'no-store',
      });
      const sessionData = await safeJsonParse(sessionRes);
      const username = sessionData?.user?.username || "";

      if (!username) {
        alert("Session tidak valid. Silakan login ulang.");
        return;
      }

      console.log('Toggling active for user:', id, 'with admin username:', username);

      // Tambahkan username admin ke query parameter
      const url = `${API_BASE_URL}/admin/users/${id}/toggle-active/?username=${encodeURIComponent(username)}`;
      console.log('Toggle URL:', url);
      
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ is_active: !current }),
      });
      
      console.log('Toggle response status:', res.status, res.statusText);
      
      // Baca response sebagai text terlebih dahulu
      const responseText = await res.text();
      
      if (!res.ok) {
        console.error('Toggle error response:', responseText);
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          // Jika bukan JSON (misalnya HTML error page), extract pesan error
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            data = { error: 'Terjadi kesalahan pada server. Periksa console untuk detail.' };
          } else {
            data = { error: responseText || 'Gagal mengubah status' };
          }
        }
        const errorMsg = data?.error || data?.detail || 'Gagal mengubah status';
        console.error('Toggle error:', errorMsg);
        alert(errorMsg);
        return;
      }
      
      // Parse JSON response untuk success case
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Jika bukan JSON, gunakan nilai default
        data = { success: true, user: { id, is_active: !current } };
      }
      console.log('Toggle success:', data);
      
      if (data.user) {
        // Update state langsung
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: data.user.is_active } : u));
        
        // Juga refresh dari server untuk memastikan data terbaru
        setTimeout(() => {
          fetchUsers();
        }, 100);
        
        alert(`User berhasil ${data.user.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      } else {
        // Fallback: refresh dari server
        await fetchUsers();
        alert(`User berhasil ${!current ? 'diaktifkan' : 'dinonaktifkan'}`);
      }
    } catch (err) {
      console.error('Toggle active error:', err);
      alert(err instanceof Error ? err.message : 'Gagal mengubah status user');
    }
  };

  // Refresh Icon Component
  const RefreshIcon = () => (
    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  // X Circle Icon Component
  const XCircleIcon = () => (
    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  // Trash Icon Component
  const TrashIcon = () => (
    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">Daftar Pengguna</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Kelola akun pengguna dan admin</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchUsers} 
            className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium bg-white border border-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 text-slate-700 flex items-center gap-1 sm:gap-1.5 hover:shadow-sm"
          >
            <RefreshIcon />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="px-2 sm:px-3 py-1.5 bg-[#D9A684] text-[#4B2F1F] text-[10px] sm:text-xs font-medium rounded-lg sm:rounded-xl hover:bg-[#D9A684]/90 border border-[#D9A684]/50 transition-all duration-200 flex items-center gap-1 sm:gap-1.5 hover:shadow-sm"
          >
            <span className="text-xs sm:text-sm font-semibold">+</span>
            <span className="hidden sm:inline">Tambah User</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
      {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-3 border-slate-200 border-t-[#D9A684] mx-auto mb-4"></div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-600">Memuat data pengguna...</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-50/50">
              <tr>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">USERNAME</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">PASSWORD</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">NAMA</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap hidden sm:table-cell">EMAIL</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">ROLE</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">STATUS</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-100 last:border-b-0">
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-900">{user.username}</span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.password && user.password !== '-' ? (
                            <>
                              <span className="text-xs font-mono text-slate-700">
                                {showPassword[user.id] ? user.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => toggleShowPassword(user.id)}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title={showPassword[user.id] ? 'Sembunyikan password' : 'Tampilkan password'}
                              >
                                {showPassword[user.id] ? (
                                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => setEditingPassword(user.id)}
                                className="p-1 hover:bg-blue-50 rounded transition-colors"
                                title="Edit password"
                              >
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-slate-400">-</span>
                              <button
                                onClick={() => handleRevealPassword(user.id)}
                                disabled={revealingPassword === user.id}
                                className="px-2 py-1 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Generate password baru"
                              >
                                {revealingPassword === user.id ? 'Generating...' : 'Reveal'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className="text-[10px] sm:text-xs font-medium text-slate-800">{user.name || user.username}</span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap hidden sm:table-cell">
                        <span className="text-[10px] sm:text-xs text-slate-600">{user.email || "-"}</span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                    <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-medium ${
                        user.is_staff
                              ? "bg-[#D9A684] text-white"
                              : "bg-teal-100 text-teal-800"
                      }`}
                    >
                      {user.is_staff ? "Admin" : "Siswa"}
                    </span>
                  </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-medium ${
                            user.is_active
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.is_active ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                          {user.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <div className="flex justify-end gap-1 sm:gap-1.5">
                          <button 
                            onClick={() => handleToggleActive(user.id, user.is_active)} 
                            className={`px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-medium bg-white border rounded-lg sm:rounded-xl transition-all duration-200 flex items-center gap-0.5 sm:gap-1.5 hover:shadow-sm ${
                              user.is_active
                                ? 'border-red-200 hover:bg-red-50/80 text-red-600 hover:border-red-300'
                                : 'border-green-200 hover:bg-green-50/80 text-green-600 hover:border-green-300'
                            }`}
                          >
                            {user.is_active ? <XCircleIcon /> : (
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            <span className="hidden sm:inline">{user.is_active ? 'Non-aktifkan' : 'Aktifkan'}</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)} 
                            className="px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-medium bg-red-500 text-white rounded-lg sm:rounded-xl hover:bg-red-600 transition-all duration-200 flex items-center gap-0.5 sm:gap-1.5 hover:shadow-sm"
                          >
                            <TrashIcon />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        </div>
                  </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-xs font-medium text-slate-400">Tidak ada data pengguna</p>
                    </div>
                  </td>
                </tr>
                )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {showAddForm && (
        <AddUserForm onClose={() => setShowAddForm(false)} onCreate={handleCreateUser} creating={creating} />
      )}

      {editingPassword && (
        <EditPasswordForm 
          userId={editingPassword}
          currentPassword={users.find(u => u.id === editingPassword)?.password || ''}
          onClose={() => setEditingPassword(null)} 
          onUpdate={handleUpdatePassword} 
        />
      )}
    </div>
  );
}


function EditPasswordForm({ 
  userId, 
  currentPassword, 
  onClose, 
  onUpdate 
}: { 
  userId: number; 
  currentPassword: string;
  onClose: () => void; 
  onUpdate: (id: number, password: string) => void;
}) {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password) {
      setError('Password wajib');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }
    setUpdating(true);
    onUpdate(userId, form.password);
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Edit Password</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Ubah password untuk user ini</p>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto flex-1 px-3 sm:px-4 py-2 sm:py-3">
          {error && (
            <div className="mb-3 bg-red-50 border-l-4 border-red-400 text-red-700 px-3 py-2 rounded-r-lg shadow-sm">
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}
          {currentPassword && currentPassword !== '-' && (
            <div className="mb-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 px-3 py-2 rounded-r-lg shadow-sm">
              <p className="text-xs font-medium">Password saat ini: <span className="font-mono">{currentPassword}</span></p>
            </div>
          )}
        <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-900">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  id="password"
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  value={form.password} 
                  onChange={handleChange} 
                  placeholder="Masukkan password baru" 
                  className="w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-900">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  id="confirmPassword"
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="Konfirmasi password baru" 
                  className="w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="flex items-center justify-center h-[32px] px-4 text-xs font-medium leading-[1] text-slate-700 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm whitespace-nowrap"
                style={{ boxSizing: 'border-box', borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={updating}
                className="flex items-center justify-center h-[32px] px-4 text-xs font-medium leading-[1] text-[#4B2F1F] bg-gradient-to-r from-[#EEC0A3] to-[#D9A684] rounded-xl hover:from-[#D9A684] hover:to-[#c68b65] border border-[#D9A684]/30 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50"
                style={{ boxSizing: 'border-box' }}
              >
                {updating ? 'Menyimpan...' : 'Update'}
              </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onClose, onCreate, creating }: { onClose: () => void; onCreate: (payload: any) => void; creating: boolean }) {
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', is_staff: false });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username dan password wajib');
      return;
    }
    onCreate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Tambah Akun</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Lengkapi form untuk menambahkan akun baru</p>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto flex-1 px-3 sm:px-4 py-2 sm:py-3">
          {error && (
            <div className="mb-2 sm:mb-3 bg-red-50 border-l-4 border-red-400 text-red-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-r-lg shadow-sm">
              <p className="text-[10px] sm:text-xs font-medium">{error}</p>
            </div>
          )}
        <form onSubmit={submit} className="space-y-2 sm:space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-semibold text-slate-900">
                Username <span className="text-red-500">*</span>
              </label>
              <input 
                id="username"
                name="username" 
                value={form.username} 
                onChange={handleChange} 
                placeholder="Masukkan username" 
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400" 
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-900">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  id="password"
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={form.password} 
                  onChange={handleChange} 
                  placeholder="Masukkan password" 
                  className="w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors bg-transparent border-none"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-semibold text-slate-900">
                Nama
              </label>
              <input 
                id="name"
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="Masukkan nama" 
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400" 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-900">
                Email
              </label>
              <input 
                id="email"
                name="email" 
                type="email"
                value={form.email} 
                onChange={handleChange} 
                placeholder="Masukkan email" 
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] transition-all text-slate-900 bg-white placeholder:text-slate-400" 
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="is_staff"
                name="is_staff" 
                checked={form.is_staff} 
                onChange={handleChange}
                className="w-4 h-4 text-[#EEC0A3] border-slate-300 rounded focus:ring-[#EEC0A3]" 
              />
              <label htmlFor="is_staff" className="text-xs font-medium text-slate-900 cursor-pointer">
                Jadikan admin
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 sm:pt-3 border-t border-slate-200 mt-3 sm:mt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="flex items-center justify-center h-[28px] sm:h-[32px] px-3 sm:px-4 text-[10px] sm:text-xs font-medium leading-[1] text-slate-700 bg-white rounded-lg sm:rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm whitespace-nowrap"
                style={{ boxSizing: 'border-box', borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={creating}
                className="flex items-center justify-center h-[28px] sm:h-[32px] px-3 sm:px-4 text-[10px] sm:text-xs font-medium leading-[1] text-[#4B2F1F] bg-gradient-to-r from-[#EEC0A3] to-[#D9A684] rounded-lg sm:rounded-xl hover:from-[#D9A684] hover:to-[#c68b65] border border-[#D9A684]/30 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50"
                style={{ boxSizing: 'border-box' }}
              >
                {creating ? 'Menyimpan...' : 'Buat'}
              </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

