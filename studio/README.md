# Scholarify CMS — Panduan Client

## 📋 Daftar Isi
1. [Setup Sanity Studio (untuk developer)](#1-setup-sanity-studio-untuk-developer)
2. [Login ke Sanity Studio (untuk client)](#2-login-ke-sanity-studio-untuk-client)
3. [Menambah Data Mentor](#3-menambah-data-mentor)
4. [Menambah Data Testimoni](#4-menambah-data-testimoni)
5. [Menambah Berita / Update](#5-menambah-berita--update)
6. [Mengedit Data yang Sudah Ada](#6-mengedit-data-yang-sudah-ada)
7. [Menghapus Data](#7-menghapus-data)
8. [Upload Foto](#8-upload-foto)
9. [FAQ](#9-faq)

---

## 1. Setup Sanity Studio (untuk Developer)

> **Satu kali saja.** Setelah ini client bisa akses via browser.

### Prasyarat
- Node.js sudah terinstall
- Akun Sanity sudah dibuat di [manage.sanity.io](https://manage.sanity.io)

### Langkah-langkah

```bash
# 1. Pindah ke folder studio
cd studio

# 2. Install dependencies
npm install

# 3. Login ke Sanity (buka browser untuk auth)
npx sanity login

# 4. Init project — pilih "Create new project"
#    - Name: "Scholarify CMS"
#    - Dataset: "production"
#    - Output path: [enter] (default)
#    - Project ID akan otomatis terisi di sanity.config.js dan sanity.cli.js
npx sanity init

# 5. Deploy Studio ke URL publik
npx sanity deploy
#    - Pilih hostname: "scholarify-cms" → https://scholarify-cms.sanity.studio
```

### Update sanity.config.js

Setelah `sanity init`, pastikan `sanity.config.js` sudah punya Project ID yang benar.
Buka file `studio/sanity.config.js` dan `studio/sanity.cli.js` — ganti `YOUR_PROJECT_ID` dengan Project ID yang muncul setelah init.

### CORS Settings

Agar website bisa fetch data dari Sanity:

1. Buka [manage.sanity.io](https://manage.sanity.io) → pilih project
2. Settings → API → CORS origins
3. Tambahkan:
   - `https://scholarify-academy.vercel.app` (production)
   - `http://localhost:3000` (development)
   - Allow credentials: **tidak perlu dicentang**

---

## 2. Login ke Sanity Studio (untuk Client)

> Setelah developer deploy Studio, client bisa akses kapan saja.

1. Buka browser → **https://scholarify-cms.sanity.studio**
2. Login dengan akun Google yang sudah diinvite ke project Sanity
3. Setelah login, kamu akan melihat dashboard seperti ini:

```
┌─────────────────────────────────────────────┐
│  🔵 Scholarify CMS                          │
│  ─────────────────────────────────────────── │
│  [Mentor] ● 14 items                        │
│  [Testimoni] ● 3 items                      │
│  [Berita/Update] ● 1 item                   │
└─────────────────────────────────────────────┘
```

---

## 3. Menambah Data Mentor

1. Klik **Mentor** di menu kiri
2. Klik tombol **＋** atau **"Create new Mentor"**
3. Isi form:

| Field | Contoh | Wajib? |
|-------|--------|--------|
| Nama | Fahreza | ✅ |
| Jabatan | Kepala Tentor | ✅ |
| Kampus / Universitas | UGM | ✅ |
| Logo Kampus | Upload logo UNY/UGM (opsional) | ❌ |
| Foto | Upload foto profil | ✅ |
| Kategori | Pilih "Tim Inti" atau "Tim Mentor" | ✅ |
| Urutan Tampil | 1 (semakin kecil, semakin dulu tampil) | ❌ |

4. Klik **Publish** (tombol merah di atas)

> **Urutan Tim Inti:** Commercial → Co-Founder → Founder → Co-Founder → Digital Media
> **Tips:** Beri urutan 1-5 untuk tim inti, 1-9 untuk tim mentor

---

## 4. Menambah Data Testimoni

1. Klik **Testimoni** di menu kiri
2. Klik **"Create new Testimoni"**
3. Isi form:

| Field | Contoh | Wajib? |
|-------|--------|--------|
| Nama | Aurelia Aisya Rachma | ✅ |
| Asal Kampus | Telkom University | ✅ |
| Isi Testimoni | "Belajar di Scholarify sangat membantu..." | ✅ |
| Rating | Pilih 1-5 bintang | ✅ |
| Foto | Upload foto profil (opsional) | ❌ |

4. Klik **Publish**

---

## 5. Menambah Berita / Update

1. Klik **Berita/Update** di menu kiri
2. Klik **"Create new Berita/Update"**
3. Isi form:

| Field | Contoh | Wajib? |
|-------|--------|--------|
| Judul Berita | TryOut UTBK Batch 2 Telah Dibuka | ✅ |
| Tanggal | Pilih tanggal dari kalender | ✅ |
| Ringkasan | Naskah singkat 1-2 kalimat yang muncul di card | ✅ |
| Isi Lengkap | Teks panjang + bisa pakai gambar (rich text) | ❌ |
| Gambar | Upload foto utama berita | ❌ |
| Urutan Tampil | 1 untuk berita paling atas | ❌ |

4. Klik **Publish**

---

## 6. Mengedit Data yang Sudah Ada

1. Klik menu (Mentor / Testimoni / Berita) di panel kiri
2. Klik item yang ingin diedit
3. Ubah field yang diperlukan
4. Klik **Publish** untuk menyimpan perubahan

---

## 7. Menghapus Data

1. Buka item yang ingin dihapus
2. Klik menu ⋮ (titik tiga) di pojok kanan atas
3. Pilih **Delete**
4. Konfirmasi dengan klik **Delete now**

---

## 8. Upload Foto

Cara upload foto di Sanity Studio:
- Saat mengisi data, klik area **Foto** / **Gambar**
- Pilih **Upload** → pilih file dari komputer
- Sanity akan otomatis mengoptimalkan gambar (resize, compress)
- Foto akan terhosting di CDN Sanity, tidak perlu commit ke repo

**Rekomendasi ukuran:**
- Foto profil mentor: 300×300 px (square)
- Foto testimoni: 100×100 px (square)
- Gambar berita: 1200×630 px (landscape)

---

## 9. FAQ

### Q: Berapa lama perubahan muncul di website?
A: Seketika (real-time). Setelah klik **Publish**, refresh website untuk melihat perubahan.

### Q: Apakah perlu install sesuatu untuk edit data?
A: Tidak. Cukup browser dan akun Google yang sudah diinvite.

### Q: Bisakah multiple admin?
A: Ya. Invite tim lain via [manage.sanity.io](https://manage.sanity.io) → Project → Invite members.

### Q: Apa yang terjadi kalau foto tidak diupload?
A: Mentor wajib upload foto (field required). Testimoni dan berita bisa tanpa foto, akan muncul placeholder.

### Q: Bagaimana cara mengubah urutan tampil?
A: Gunakan field **Urutan Tampil** (angka). Semakin kecil angka, semakin atas/awal posisinya.
