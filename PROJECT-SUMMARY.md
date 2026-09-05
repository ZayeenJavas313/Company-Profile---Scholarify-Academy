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
  ├── GET halaman (index.html, blog.html, berita.html, dll)
  │     └── Read data → fetch Sanity CDN (GROQ query)
  │
  ├── GET /login → halaman login admin dedicated
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
| `index.html` | Halaman utama landing page (hero, tim, program, testimoni, berita, CTA) |
| `login.html` | Halaman login admin (`/login`) — dedicated page dengan password show/hide toggle |
| `blog.html` | Halaman listing blog/berita (`/blog`) — grid featured + card |
| `berita.html` | Halaman detail berita (`/berita?id=xxx`) — rich text rendering (h1-h4, blockquote, lists, alignment) + share buttons |
| `layanan.html` | Halaman Layanan (`/layanan`) |
| `program.html` | Halaman Program (`/program`) — dengan modal detail |
| `tim.html` | Halaman Tim (`/tim`) — fetch dari Sanity |
| `testimoni.html` | Halaman Testimoni (`/testimoni`) — fetch dari Sanity |
| `kontak.html` | Halaman Kontak (`/kontak`) |
| `vercel.json` | Clean URL rewrites config (`cleanUrls: true` + rewrites) |
| `style.css` | Semua styling (termasuk admin actions opacity toggle, login styles) |
| `generate-hash.js` | Utility untuk generate bcrypt hash password admin |
| `package.json` | Dependencies serverless (bcryptjs, jsonwebtoken, busboy) |
| `favicon.ico` | Icon website |
| `.env` | Environment variables lokal (JWT_SECRET, ADMIN_PASSWORD_HASH) |
| `.gitignore` | Git ignore rules |
| `api/` | Serverless functions (Vercel) |
| `api/_lib/` | Library bersama (verify-session.js, sanity.js, rate-limit.js) |
| `api/login.js` | Login admin (POST) — bcrypt compare + JWT cookie |
| `api/logout.js` | Logout admin (POST) — clear cookies |
| `api/verify.js` | Verifikasi session (GET) — verify JWT cookie |
| `api/mentors.js` | Create mentor (POST) |
| `api/mentors/[id].js` | Update/Delete mentor (PATCH/DELETE) |
| `api/testimonials.js` | Create testimonial (POST) |
| `api/testimonials/[id].js` | Update/Delete testimonial (PATCH/DELETE) |
| `api/news.js` | Create berita (POST) — textToBlocks handles JSON + plain text |
| `api/news/[id].js` | Update/Delete berita (PATCH/DELETE) — textToBlocks handles JSON + plain text |
| `api/upload-image.js` | Upload image ke Sanity (POST) |
| `assets/js/sanity.js` | Fetch data dari Sanity & render ke DOM (mentor, testimoni, berita) |
| `assets/js/admin.js` | Admin panel: session check, CRUD modal, Quill rich text editor (H1-H3, alignment, lists, images, links, code block, blockquote) |
| `assets/feat-*.svg` | Icon fitur |
| `assets/program-*.jpg` | Gambar program |

### frontend/ — SISTEM TRYOUT (INDEPENDEN)

> **⚠️ FOLDER INI INDEPENDEN DARI SISTEM SANITY/ADMIN PANEL LANDING PAGE. JANGAN DIHAPUS SAAT MAINTENANCE DI MASA DEPAN.**

| Aspek | Detail |
|---|---|
| **Fungsi** | Platform TryOut online untuk simulasi UTBK |
| **Framework** | Next.js 16 + React 19 + TypeScript |
| **CSS** | Tailwind CSS 3 |
| **Status integrasi** | **Belum terhubung penuh** ke landing page. Landing page menunjuk ke `https://e-ujian.com/Scholarify` untuk TryOut. |
| **Base URL API** | `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api` |
| **Cara run** | `cd frontend && npm install && npm run dev` (butuh Django backend running) |
| **Dependencies utama** | next, react, tailwindcss, gsap, aos, lucide-react, heroicons |

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

## e. Clean URL Routes

`vercel.json` mengaktifkan `cleanUrls: true` dengan rewrites untuk semua halaman:

| URL | File |
|---|---|
| `/` | `index.html` |
| `/login` | `login.html` |
| `/blog` | `blog.html` |
| `/berita` | `berita.html` (query param `?id=xxx`) |
| `/layanan` | `layanan.html` |
| `/program` | `program.html` |
| `/tim` | `tim.html` |
| `/testimoni` | `testimoni.html` |
| `/kontak` | `kontak.html` |

Semua internal link di seluruh halaman sudah menggunakan clean URL (tanpa `.html` extension).

---

## f. Sistem TryOut (frontend/ & backend/)

### frontend/ — Next.js App
- **Framework:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Fungsi:** Halaman login, dashboard tryout, pengerjaan soal (timer), admin panel tryout
- **Cara menjalankan:**
  ```bash
  cd frontend && npm install && npm run dev
  ```
- **Environment variables:** `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000/api`)
- **Catatan:** Butuh Django backend (backend/) berjalan untuk login dan data. Belum terintegrasi ke landing page utama.

### backend/ — Django REST API
- **Framework:** Django 5.2, Django REST Framework 3.15
- **Fungsi:** API untuk sistem TryOut — autentikasi, CRUD soal/batch/user, scoring
- **Database:** SQLite (development), PostgreSQL (production via `DATABASE_URL`)
- **Cara menjalankan:**
  ```bash
  cd backend
  pip install -r requirements.txt
  python manage.py migrate
  python manage.py seed_subtests
  python manage.py runserver
  ```
- **Environment variables:** `SECRET_KEY`, `DEBUG`, `DATABASE_URL`
- **API endpoints:** 34 endpoint di `/api/*`

---

## g. Admin Panel & Login System

### Login Flow
1. Klik tombol **"Login"** di navbar → redirect ke `/login`
2. Masukkan password admin → `POST /api/login`
3. Backend: bcrypt compare → generate JWT → set cookie `scholarify_session` (HttpOnly, SameSite=Strict, Secure, Path=/, Max-Age=86400)
4. Juga set cookie `scholarify_logged_in` (readable by JS) untuk UI state
5. Redirect ke `/?admin=1` → admin UI muncul (opacity toggle via CSS class `admin-logged-in`)

### Login State Management
- `checkSession()` = source of truth — `GET /api/verify` checks JWT cookie
- `localStorage.scholarify_logged_in` hanya hint untuk avoid flash of wrong UI
- Jika session valid → tambah class `admin-logged-in` ke `<body>` → `.admin-actions` opacity: 1
- Jika tidak valid → hapus class → `.admin-actions` opacity: 0

### Logout Flow
- Klik **"Logout"** → `POST /api/logout` → clear cookies → remove localStorage → reload

### Quill Rich Text Editor (Berita)
Fitur editor:
- **Headings:** H1, H2, H3 (dropdown)
- **Text formatting:** Bold, Italic, Underline, Strikethrough, Code, Link
- **Block formatting:** Blockquote, Code Block, Ordered List, Bullet List
- **Alignment:** Left, Center, Right, Justify (dropdown)
- **Media:** Image upload (via `/api/upload-image` → Sanity asset)
- **Utility:** Clear Formatting

### Admin CRUD Operations
| Action | Method | Endpoint |
|---|---|---|
| Create mentor | POST | `/api/mentors` |
| Update mentor | PATCH | `/api/mentors/[id]` |
| Delete mentor | DELETE | `/api/mentors/[id]` |
| Create testimonial | POST | `/api/testimonials` |
| Update testimonial | PATCH | `/api/testimonials/[id]` |
| Delete testimonial | DELETE | `/api/testimonials/[id]` |
| Create berita | POST | `/api/news` |
| Update berita | PATCH | `/api/news/[id]` |
| Delete berita | DELETE | `/api/news/[id]` |
| Upload image | POST | `/api/upload-image` |

### Admin Button Injection
- `waitForCardsAndInject()` polls (30 attempts × 500ms = 15s) to inject edit/delete buttons after Sanity cards load
- `refreshScholarifyData` wrapper re-injects buttons after data refresh
- Buttons appear on hover for each card

---

## h. Environment Variables

### landing-page/

| Variable | Fungsi |
|---|---|
| `ADMIN_PASSWORD_HASH` | Bcrypt hash password admin |
| `JWT_SECRET` | Secret key untuk JWT token session |
| `SANITY_WRITE_TOKEN` | API token Sanity untuk write operations |

### backend/ (terpisah — TryOut)

| Variable | Fungsi |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Django debug mode |
| `DATABASE_URL` | URL koneksi database |

### frontend/ (terpisah — TryOut)

| Variable | Fungsi |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL Django backend API |

---

## i. Cara Update Konten (untuk Client)

### Login Admin
1. Buka `scholarify.id`
2. Klik **"Login"** di navbar → masuk ke `/login`
3. Masukkan password admin → otomatis redirect ke landing page dengan admin panel aktif

### Setelah Login
- Tombol **"Tambah Mentor"**, **"Tambah Testimoni"**, **"Tambah Berita"** muncul di masing-masing section
- Hover kartu mentor/testimoni/berita untuk melihat tombol **Edit** / **Hapus**

### Tambah Berita (dengan Rich Text Editor)
1. Klik **"+ Tambah Berita"**
2. Isi judul, ringkasan, tanggal, urutan
3. Gunakan editor rich text (Quill) untuk isi lengkap:
   - Format teks: Bold, Italic, Underline, Strikethrough, Code
   - Headings: pilih H1/H2/H3 dari dropdown
   - Alignment: pilih Left/Center/Right/Justify dari dropdown
   - Lists: Ordered atau Bullet
   - Blockquote, Code Block
   - Insert link atau upload gambar
4. Upload gambar sampul (opsional)
5. Klik **"Tambah"**

### Edit/Hapus Konten
- **Edit:** Hover kartu → klik "✎ Edit" → ubah field → klik "Update"
- **Hapus:** Hover kartu → klik "✕ Hapus" → konfirmasi "Ya, Hapus"

### Catatan
- Gambar diupload langsung ke Sanity asset library
- Data yang sudah dihapus tidak bisa dikembalikan
- Perubahan tampil langsung (delay ~1-2 detik untuk refresh)

---

## j. Cara Ganti Password Admin

1. **Generate hash baru:**
   ```bash
   cd landing-page
   node generate-hash.js "password_baru_anda"
   ```
2. **Update di Vercel:**
   - Buka Vercel → project Scholarify → Settings → Environment Variables
   - Update `ADMIN_PASSWORD_HASH` dengan hash baru
3. **Redeploy:**
   - Push commit baru atau trigger manual redeploy di Vercel dashboard

---

## k. Domain & Hosting

- **Domain:** `scholarify.id` — registrasi di Hostinger
- **DNS:**
  - A record → IP Vercel (76.76.21.21)
  - CNAME `www` → `cname.vercel-dns.com`
- **Hosting:** Vercel Hobby (gratis)
  - 100 GB bandwidth, 600 build minutes/bulan
  - Serverless Functions: 10 detik timeout, 500 MB memory
- **Deploy:** Auto-deploy dari git (push ke branch main)

### Vercel Settings
- **Deployment Protection:** Harus **DISABLED** agar `/api/*` routes bisa diakses dari browser
- **Clean URLs:** Aktif via `vercel.json` (`cleanUrls: true`)

---

## l. Known Issues / Technical Debt

1. **Sistem TryOut (frontend/ + backend/) belum terintegrasi**
   - Landing page menunjuk ke `https://e-ujian.com/Scholarify` untuk TryOut
   - **To-do:** Integrasi ke scholarify.id dengan SSO atau redirect

2. **Password admin terbatas (single user)**
   - Hanya satu password admin global, no multi-admin, no roles

3. **Rate limiter in-memory**
   - Rate limiter login menggunakan Map di memori — reset saat cold start

4. **No dark mode toggle active**
   - CSS dark mode variables ada (`.dark`) tapi belum ada toggle UI

5. **Sisa legacy CSS**
   - `style.css` mengandung banyak class legacy yang tidak terpakai (dihapus untuk hindari risiko)

6. **Vercel Deployment Protection**
   - Harus disabled manual di dashboard untuk allow API calls dari browser

---

## m. Changelog

| Tanggal | Perubahan |
|---|---|
| 2025-12 | Project awal — landing page statis + sistem TryOut |
| 2026 | Integrasi Sanity CMS untuk Mentor, Testimoni |
| 2026 | Penambahan CRUD API (serverless functions) |
| 2026 | Penambahan schema & section Berita |
| 2026 | Custom admin panel (modal login + CRUD) |
| 2026 | Custom domain scholarify.id |
| 2026 | Redesign hero, navbar, footer, CTA |
| 2026-07 | Final cleanup: hapus asset lama, dokumentasi |
| 2026-09 | **Separate section pages** — layanan, program, tim, testimoni, kontak jadi halaman terpisah |
| 2026-09 | **Blog/berita pages** — blog.html (listing), berita.html (detail) dengan rich text rendering |
| 2026-09 | **Clean URLs** — vercel.json `cleanUrls: true` + rewrites untuk semua halaman, semua internal link updated |
| 2026-09 | **Dedicated login page** — login.html di `/login` dengan password show/hide toggle |
| 2026-09 | **Admin state management fix** — `checkSession()` = source of truth, localStorage hanya hint, admin panel via CSS opacity toggle |
| 2026-09 | **Quill rich text editor** — headings (H1-H3), alignment (center/right/justify), ordered/bullet lists, blockquote, code block, image upload, links, clear formatting |
| 2026-09 | **Admin CRUD fixes** — `waitForCardsAndInject()` polling, `refreshScholarifyData` wrapper, fix `continue` → `return` syntax error |
| 2026-09 | **textToBlocks fix** — handles JSON array from Quill OR plain text input |
| 2026-09 | **berita.html rendering** — h1-h4 support, proper ol/ul list rendering, alignment rendering (`block.data.alignment`) |
| 2026-09 | **Vercel Deployment Protection** — disabled in dashboard to allow `/api/*` routes |
