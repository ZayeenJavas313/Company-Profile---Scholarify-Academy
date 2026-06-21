# Backup Documentation - Scholarify Project

## Struktur Backup

Backup ini berisi semua file penting dari proyek Scholarify sebelum deployment ke VPS.

### Folder Structure:
```
backup/
├── backend/          # Backend Django source code
├── frontend/         # Frontend Next.js source code
├── database/         # Database files (SQLite)
├── config/           # Configuration files
└── docs/             # Documentation
```

## File Penting yang Di-backup

### Backend:
- ✅ Source code Django (quiz app, scholarify settings)
- ✅ requirements.txt (dependencies Python)
- ✅ manage.py
- ✅ Migrations files
- ✅ Media files (images, uploads)
- ✅ Static files
- ✅ Procfile (untuk deployment)
- ✅ runtime.txt

### Frontend:
- ✅ Source code Next.js (app/, components/, lib/)
- ✅ package.json & package-lock.json
- ✅ Configuration files (next.config.js, tailwind.config.js, tsconfig.json)
- ✅ Public files (images, landing page)
- ✅ Assets (landing page assets)

### Database:
- ✅ db.sqlite3 (SQLite database)

### Configuration:
- ✅ Environment variables (jika ada .env files)
- ✅ Nginx configuration (jika ada)
- ✅ Docker files (jika ada)

## Cara Restore dari Backup

### 1. Restore Backend:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic
```

### 2. Restore Frontend:
```bash
cd frontend
npm install
npm run build
```

### 3. Restore Database:
```bash
# Copy db.sqlite3 ke lokasi yang sesuai
cp database/db.sqlite3 backend/
```

## Catatan Penting

⚠️ **Jangan commit file sensitif ke Git:**
- .env files
- db.sqlite3 (jika berisi data production)
- API keys
- Secret keys

⚠️ **Sebelum deploy, pastikan:**
- Environment variables sudah di-set di VPS
- Database credentials sudah benar
- Static files sudah di-collect
- Media files sudah di-upload

## Tanggal Backup
Backup dibuat pada: Backup dibuat pada: 2025-12-18 17:14:21

## Versi
- Backend: Django 5.2.8
- Frontend: Next.js 16.0.1
- Node: >=20.9.0
- Python: [Check runtime.txt]


