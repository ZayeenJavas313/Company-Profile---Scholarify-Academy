# Project Scholarify — Summary Dokumentasi

## a. Overview

**Scholarify** adalah platform bimbingan belajar untuk persiapan UTBK/SBMPTN dan pemahaman materi sekolah/kuliah. Live di **[scholarify.id](https://scholarify.id)**.

**Tech Stack:**
- **Frontend Landing Page:** HTML/CSS/JS statis (tanpa framework) — di-*serve* sebagai halaman statis
- **CMS:** Sanity.io (headless CMS) untuk konten Mentor, Testimoni, & Berita
- **Backend API (Admin CRUD):** Vercel Serverless Functions (`/api/*`) — Node.js + bcryptjs + JWT
- **Hosting:** Vercel (Hobby plan)
- **Domain:** scholarify.id (Hostinger — A record & CNAME ke Vercel)

---

## b. Arsitektur

```
User Browser → scholarify.id
  │
  ├── GET landing page (index.html, style.css, assets/*)
  │     └── Read data → fetch Sanity CDN (GROQ query)
  │
  └── POST/PATCH/DELETE (admin) → /api/* (Vercel Serverless)
        └── Write data → Sanity Mutate API (dengan write token)
```

- **Read:** Landing page fetch langsung dari Sanity CDN (public, read-only)
- **Write:** Semua operasi admin (login, CRUD mentor/testimoni/berita, upload image) melalui serverless function di `/api/*`, yang diverifikasi dengan JWT session cookie

---

## c. Struktur File

### Root Project

| Path | Fungsi |
|---|---|
| `landing-page/` | Landing page utama (HTML/CSS/JS statis + API serverless) |
| `frontend/` | **⚠️ SISTEM TRYOUT — LIHAT CATATAN DI BAWAH** |
| `backend/` | **⚠️ SISTEM TRYOUT — LIHAT CATATAN DI BAWAH** |
| `studio/` | Konfigurasi Sanity Studio (skema, CLI) |
| `nginx/` | (kosong) Bekas konfigurasi reverse proxy |
| `venv/` | Python virtual environment untuk backend |
| `seed.html` | Tools seed data awal ke Sanity (mentor, testimoni, berita) |
| `SMABU.xlsx` | Data tryout (soal) — referensi |
| `PROJECT-SUMMARY.md` | File ini |

### landing-page/

| Path | Fungsi |
|---|---|
| `index.html` | Halaman utama landing page |
| `berita.html` | Halaman detail berita (single page) |
| `style.css` | Semua styling (5448 baris) |
| `generate-hash.js` | Utility untuk generate bcrypt hash password admin |
| `package.json` | Dependencies serverless (bcryptjs, jsonwebtoken, busboy) |
| `favicon.ico` | Icon website |
| `.env` | Environment variables lokal (JWT_SECRET, ADMIN_PASSWORD_HASH) |
| `.gitignore` | Git ignore rules |
| `api/` | Serverless functions (Vercel) |
| `api/_lib/` | Library bersama (verify-session.js, sanity.js, rate-limit.js) |
| `api/login.js` | Login admin (POST) |
| `api/logout.js` | Logout admin (POST) |
| `api/verify.js` | Verifikasi session (GET) |
| `api/mentors.js` | Create mentor (POST) |
| `api/mentors/[id].js` | Update/Delete mentor (PATCH/DELETE) |
| `api/testimonials.js` | Create testimonial (POST) |
| `api/testimonials/[id].js` | Update/Delete testimonial (PATCH/DELETE) |
| `api/news.js` | Create berita (POST) |
| `api/news/[id].js` | Update/Delete berita (PATCH/DELETE) |
| `api/upload-image.js` | Upload image ke Sanity (POST) |
| `assets/` | Gambar & JS statis |
| `assets/js/sanity.js` | Fetch data dari Sanity & render ke DOM |
| `assets/js/admin.js` | Admin panel (login, CRUD modal, UI) |
| `assets/feat-*.svg` | Icon fitur (digunakan di index.html) |
| `assets/program-*.jpg` | Gambar program (digunakan di modal program) |

### frontend/ — SISTEM TRYOUT (INDEPENDEN)

> **⚠️ FOLDER INI INDEPENDEN DARI SISTEM SANITY/ADMIN PANEL LANDING PAGE. JANGAN DIHAPUS SAAT MAINTENANCE DI MASA DEPAN.**

| Aspek | Detail |
|---|---|
| **Fungsi** | Platform TryOut online untuk simulasi UTBK |
| **Framework** | Next.js 16 + React 19 + TypeScript |
| **CSS** | Tailwind CSS 3 |
| **Status integrasi** | **Belum terhubung penuh** ke landing page. Landing page menunjuk ke `https://e-ujian.com/Scholarify` untuk TryOut. Sistem ini berdiri sendiri dengan backend Django-nya. |
| **Base URL API** | `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api` |
| **Cara run** | `cd frontend && npm install && npm run dev` (butuh Django backend running) |
| **Dependencies utama** | next, react, tailwindcss, gsap, aos, lucide-react, heroicons |
| **Catatan** | Memiliki login sendiri (student/admin), sistem batch, subtest, timer, scoring, dan admin dashboard. Belum diintegrasikan ke landing page utama. |

### backend/ — SISTEM TRYOUT (INDEPENDEN)

> **⚠️ FOLDER INI INDEPENDEN DARI SISTEM SANITY/ADMIN PANEL LANDING PAGE. JANGAN DIHAPUS SAAT MAINTENANCE DI MASA DEPAN.**

| Aspek | Detail |
|---|---|
| **Fungsi** | REST API Django untuk sistem TryOut |
| **Framework** | Django 5.2 + Django REST Framework 3.15 |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Status integrasi** | **Berdiri sendiri**, backend untuk frontend/ (Next.js TryOut). Belum terintegrasi ke landing page. |
| **Cara run** | `cd backend && pip install -r requirements.txt && python manage.py runserver` |
| **Env vars** | `SECRET_KEY`, `DEBUG`, `DATABASE_URL` |
| **Dependencies** | Django, djangorestframework, django-cors-headers, gunicorn, psycopg2, openpyxl, Pillow |
| **Catatan** | API endpoint di `/api/*` (34 endpoint) untuk login, CRUD soal, batch, user, hasil tryout. Ada management commands: `seed_subtests`, `import_soal_excel`. |

---

## d. Sanity Setup

| Parameter | Nilai |
|---|---|
| **Project ID** | `gbwew0c6` |
| **Dataset** | `production` |
| **API Version** | `2024-01-01` |
| **Token** | `SANITY_WRITE_TOKEN` (via env var, di Vercel) |
| **Studio URL** | `https://gbwew0c6.sanity.studio` |

### Schema

#### mentor
| Field | Type |
|---|---|
| `nama` | string |
| `jabatan` | string |
| `kampus` | string |
| `kategori` | string ("tim-inti" / "tim-mentor") |
| `urutan` | number |
| `foto` | image |
| `logoKampus` | image |

#### testimonial
| Field | Type |
|---|---|
| `nama` | string |
| `asalKampus` | string |
| `isi` | text |
| `rating` | number (1-5) |
| `foto` | image |

#### news
| Field | Type |
|---|---|
| `judul` | string |
| `ringkasan` | text |
| `isiLengkap` | block content (rich text) |
| `tanggal` | date |
| `urutan` | number |
| `gambar` | image |

---

## e. Sistem TryOut (frontend/ & backend/)

### frontend/ — Next.js App
- **Framework:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Fungsi:** Halaman login, dashboard tryout, pengerjaan soal (timer), admin panel tryout
- **Dependencies:** next, react, tailwindcss, gsap, aos, lucide-react, heroicons, clsx, class-variance-authority
- **Cara menjalankan:**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Environment variables:** `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000/api`)
- **Catatan:** Butuh Django backend (backend/) berjalan untuk login dan data. Saat ini belum terintegrasi ke landing page utama scholarify.id.

### backend/ — Django REST API
- **Framework:** Django 5.2, Django REST Framework 3.15
- **Fungsi:** API untuk sistem TryOut — autentikasi, CRUD soal/batch/user, scoring
- **Database:** SQLite (development), PostgreSQL (production via `DATABASE_URL`)
- **Dependencies:** Django, djangorestframework, django-cors-headers, gunicorn, psycopg2-binary, openpyxl, Pillow, python-dotenv
- **Cara menjalankan:**
  ```bash
  cd backend
  pip install -r requirements.txt
  python manage.py migrate
  python manage.py seed_subtests
  python manage.py runserver
  ```
- **Environment variables:** `SECRET_KEY`, `DEBUG`, `DATABASE_URL`
- **API endpoints:** 34 endpoint di `/api/*` (login, batches, subtests, questions, submit jawaban, admin dashboard)

---

## f. Environment Variables

### Root (landing-page/)

| Variable | Fungsi |
|---|---|
| `ADMIN_PASSWORD_HASH` | Bcrypt hash password admin (disimpan di Vercel env) |
| `JWT_SECRET` | Secret key untuk JWT token session admin |
| `SANITY_WRITE_TOKEN` | API token Sanity untuk write operations (via image upload & CRUD) |

### backend/ (terpisah)

| Variable | Fungsi |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Django debug mode |
| `DATABASE_URL` | URL koneksi database (PostgreSQL untuk production) |

### frontend/ (terpisah)

| Variable | Fungsi |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL Django backend API |

---

## g. Cara Update Konten (untuk Client)

1. **Login Admin:**
   - Buka scholarify.id
   - Klik ikon user di pojok kanan atas navbar → "Login Admin"
   - Masukkan password admin

2. **Setelah login:**
   - Tombol "Tambah Mentor", "Tambah Testimoni", "Tambah Berita" akan muncul di masing-masing section
   - Arahkan mouse ke kartu mentor/testimoni/berita untuk melihat tombol Edit/Hapus

3. **Tambah Mentor:**
   - Klik "+ Tambah Mentor" atau "+ Tambah Tim Inti" di section Tim
   - Isi: Nama, Jabatan, Kampus, Kategori (Tim Inti/Tim Mentor)
   - Upload foto mentor dan logo kampus (opsional)
   - Klik "Tambah"

4. **Edit/Hapus Mentor:**
   - Hover kartu mentor → klik "✎ Edit" atau "✕ Hapus"
   - Edit: ubah field yang perlu, upload foto baru jika ingin ganti
   - Hapus: konfirmasi dengan klik "Ya, Hapus"

5. **Testimoni & Berita:** Sama seperti Mentor, gunakan tombol yang muncul setelah login admin

6. **Catatan:**
   - Gambar diupload langsung ke Sanity asset library
   - Data mentor/testimoni/berita yang sudah dihapus tidak bisa dikembalikan
   - Perubahan akan tampil langsung di halaman (ada delay ~1-2 detik untuk refresh)

---

## h. Cara Ganti Password Admin

1. **Generate hash baru:**
   ```bash
   cd landing-page
   node generate-hash.js "password_baru_anda"
   ```
2. **Output:** Akan muncul `ADMIN_PASSWORD_HASH: $2a$12$...`
3. **Update di Vercel:**
   - Buka [vercel.com](https://vercel.com) → project Scholarify → Settings → Environment Variables
   - Update `ADMIN_PASSWORD_HASH` dengan hash baru
   - Hapus yang lama, simpan
4. **Redeploy:**
   - Di Vercel dashboard → Deployments → trigger redeploy (atau push commit baru)
5. **Selesai.** Password lama tidak akan bisa digunakan lagi.

---

## i. Domain & Hosting

- **Domain:** `scholarify.id` — registrasi di Hostinger
- **DNS Configuration:**
  - A record →指向 IP Vercel (76.76.21.21)
  - CNAME `www` → `cname.vercel-dns.com`
- **Hosting:** Vercel Hobby (gratis)
  - **Kuota:** 100 GB bandwidth, 600 build minutes per bulan
  - **ToS:** Hobby plan untuk project non-komersial / personal
  - **Serverless Functions:** 10 detik execution timeout, 500 MB memory
- **Deploy:** Auto-deploy dari git (push ke branch main)

---

## j. Known Issues / Technical Debt

1. **Sistem TryOut (frontend/ + backend/) belum terintegrasi**
   - Landing page saat ini menunjuk ke `https://e-ujian.com/Scholarify` untuk TryOut
   - frontend/ (Next.js + Django backend) adalah sistem TryOut terpisah yang belum diintegrasikan
   - **To-do:** Integrasi frontend/backend TryOut ke scholarify.id dengan SSO atau redirect system

2. **Admin panel in-browser (no dedicated admin page)**
   - Admin login dan CRUD dilakukan via modal di landing page
   - Tidak ada halaman admin terpisah

3. **Password admin terbatas (single user)**
   - Hanya satu password admin global, no multi-admin, no roles

4. **Rate limiter in-memory**
   - Rate limiter login menggunakan Map di memori — akan reset jika serverless function cold start

5. **No dark mode toggle active**
   - CSS dark mode variables sudah ada (`.dark`) tapi belum ada toggle UI aktif

6. **Sisa legacy CSS**
   - `style.css` masih mengandung banyak class legacy yang tidak terpakai (program-tile, modal versi lama, testimonial desain lama). Tidak dihapus untuk menghindari risiko.

7. **Folder nginx/ kosong**
   - Tidak ada konfigurasi di dalamnya.

---

## k. Changelog

| Tanggal | Perubahan |
|---|---|
| 2025-12 (perkiraan) | Project awal — landing page statis + sistem TryOut (frontend Next.js + Django backend) |
| 2026 | Integrasi Sanity CMS untuk konten Mentor, Testimoni |
| 2026 | Penambahan CRUD API (serverless functions) untuk admin panel |
| 2026 | Penambahan schema & section Berita |
| 2026 | Custom admin panel (in-browser modal login + CRUD) |
| 2026 | Custom domain scholarify.id (Hostinger → Vercel) |
| 2026 | Redesign hero, navbar, footer cinematic, CTA section |
| 2026-07 | Final cleanup: hapus asset gambar lama (foto mentor pre-Sanity, SVG/icons tidak terpakai), dokumentasi PROJECT-SUMMARY.md |
