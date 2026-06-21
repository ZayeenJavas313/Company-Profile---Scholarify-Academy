# Backup Guide - Scholarify Project

**Backup dibuat:** 2025-12-18  
**Status:** ✅ Verified & Tested  
**Ready for Deployment:** ✅ YES

---

## 📁 Struktur Backup

```
backup/
├── backup_YYYY-MM-DD_HH-mm-ss/    # Backup folder dengan timestamp
│   ├── backend/                    # Backend Django source code
│   ├── frontend/                   # Frontend Next.js source code
│   ├── database/                  # Database files (SQLite)
│   ├── config/                    # Configuration files
│   └── docs/                      # Documentation
├── create_backup.ps1              # Script untuk membuat backup
├── verify_backup.ps1              # Script untuk verifikasi backup
└── test_restore_localhost.ps1    # Script untuk test restore
```

---

## 📦 File Penting yang Di-backup

### Backend:
- ✅ Source code Django (quiz app, scholarify settings)
- ✅ requirements.txt (dependencies Python)
- ✅ manage.py, migrations files
- ✅ Media files (images, uploads)
- ✅ Procfile, runtime.txt
- ✅ Static files

### Frontend:
- ✅ Source code Next.js (app/, components/, lib/)
- ✅ package.json & package-lock.json
- ✅ Configuration files (next.config.js, tailwind, tsconfig)
- ✅ Public files (images, landing page)
- ✅ Landing page assets (41 files)

### Database:
- ✅ db.sqlite3 (SQLite database)

### Configuration:
- ✅ Environment variables (.env files)
- ✅ Nginx configuration (jika ada)

---

## 🔧 Cara Membuat Backup

### Menggunakan Script Otomatis:
```powershell
cd backup
powershell -ExecutionPolicy Bypass -File create_backup.ps1
```

Script akan:
- Membuat folder backup dengan timestamp
- Menyalin semua file penting
- Menyimpan database
- Menyimpan configuration files
- Membuat dokumentasi otomatis

---

## ✅ Cara Verifikasi Backup

### 1. Verifikasi File (Recommended):
```powershell
cd backup
powershell -ExecutionPolicy Bypass -File verify_backup.ps1
```

**Expected Output:**
```
=== VERIFICATION PASSED ===
All critical files are present. Backup is ready for deployment.
```

### 2. Test Restore di Localhost:
```powershell
cd backup
powershell -ExecutionPolicy Bypass -File test_restore_localhost.ps1
```

Kemudian test backend dan frontend:
```powershell
# Backend
cd test_restore_localhost\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt  # atau requirements_localhost.txt (tanpa psycopg2)
python manage.py migrate
python manage.py runserver

# Frontend (terminal baru)
cd test_restore_localhost\frontend
npm install
npm run dev
```

---

## 🔄 Cara Restore dari Backup

### 1. Restore Backend:
```bash
# Copy backend files
cp -r backup/backup_YYYY-MM-DD/backend/* /path/to/project/backend/

# Install dependencies
cd /path/to/project/backend
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput
```

### 2. Restore Frontend:
```bash
# Copy frontend files
cp -r backup/backup_YYYY-MM-DD/frontend/* /path/to/project/frontend/

# Install dependencies
cd /path/to/project/frontend
npm install

# Build
npm run build
```

### 3. Restore Database:
```bash
# SQLite
cp backup/backup_YYYY-MM-DD/database/db.sqlite3 /path/to/project/backend/

# PostgreSQL (jika ada dump)
pg_restore -d scholarify_db backup/backup_YYYY-MM-DD/database.dump
```

### 4. Restore Configuration:
```bash
# Environment files (HATI-HATI: contains sensitive data!)
cp backup/backup_YYYY-MM-DD/config/backend.env /path/to/project/backend/.env
cp backup/backup_YYYY-MM-DD/config/frontend.env.local /path/to/project/frontend/.env.local

# Nginx config
cp backup/backup_YYYY-MM-DD/config/nginx/* /etc/nginx/sites-available/scholarify/
```

### 5. Restore Media Files:
```bash
# Copy media files
cp -r backup/backup_YYYY-MM-DD/backend/media/* /path/to/project/backend/media/

# Set permissions
chmod -R 755 /path/to/project/backend/media/
```

---

## 🧪 Test Results

### ✅ Backend Test (PASSED)
- [x] Virtual environment created
- [x] Dependencies installed
- [x] Migrations run successfully
- [x] Server starts without errors
- [x] Server accessible at http://127.0.0.1:8000/
- [x] Admin panel accessible
- [x] CORS configured correctly

### ✅ Frontend Test (PASSED)
- [x] Dependencies installed
- [x] Dev server starts successfully
- [x] Server running at localhost:3000
- [x] Pages load correctly
- [x] API connection works
- [x] Login functionality works

### ✅ Integration Test (PASSED)
- [x] Frontend can connect to backend
- [x] CORS working correctly
- [x] API calls successful
- [x] Admin panel accessible from frontend

**Test Date:** 2025-12-18  
**Test Location:** backup/test_restore_localhost  
**Status:** ✅ ALL TESTS PASSED

---

## 🚀 Deployment Checklist

### Pre-Deployment:
- [x] Backup semua source code
- [x] Backup database
- [x] Backup configuration files
- [x] Backup media files
- [x] Verifikasi backup
- [x] Test restore di localhost

### Backend Preparation:
- [ ] Install Python 3.11+ di VPS
- [ ] Install PostgreSQL
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Set environment variables (SECRET_KEY, DEBUG, ALLOWED_HOSTS, DATABASE_URL)
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic --noinput`
- [ ] Setup Gunicorn dan systemd service
- [ ] Configure Nginx sebagai reverse proxy
- [ ] Setup SSL certificate

### Frontend Preparation:
- [ ] Install Node.js 20.9.0+ di VPS
- [ ] Install dependencies: `npm install`
- [ ] Build production: `npm run build`
- [ ] Set environment variables (NEXT_PUBLIC_API_BASE_URL)
- [ ] Setup PM2 atau systemd untuk Next.js
- [ ] Configure Nginx untuk serve Next.js

### Database:
- [ ] Install PostgreSQL di VPS
- [ ] Create database dan user
- [ ] Export data dari SQLite (jika perlu)
- [ ] Import ke PostgreSQL
- [ ] Update DATABASE_URL di environment variables

### Security:
- [ ] Change default admin password
- [ ] Set strong SECRET_KEY
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set secure cookie flags
- [ ] Review and remove debug information
- [ ] Setup rate limiting
- [ ] Configure firewall rules

---

## ⚠️ Troubleshooting

### Error: "Backend server tidak dapat dijangkau"

**Penyebab:**
- Django server tidak berjalan
- CORS tidak dikonfigurasi
- Port berbeda

**Solusi:**
1. Pastikan Django server berjalan: `python manage.py runserver`
2. Cek CORS settings di `settings.py`:
   ```python
   CORS_ALLOW_ALL_ORIGINS = True  # Untuk test
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://localhost:3001",
   ]
   ```
3. Restart server setelah update settings
4. Test backend langsung: `http://127.0.0.1:8000/admin`

### Error: psycopg2-binary installation failed

**Penyebab:**
- PostgreSQL development tools tidak terinstall
- Tidak diperlukan untuk SQLite

**Solusi:**
- Untuk test localhost: Gunakan `requirements_localhost.txt` (tanpa psycopg2)
- Untuk production: Install PostgreSQL dan psycopg2-binary

### Error: Module not found

**Solusi:**
```powershell
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### Error: Database locked

**Solusi:**
- Pastikan tidak ada process lain yang menggunakan database
- Atau copy database baru dari backup

---

## 📝 Catatan Penting

### Security:
- ⚠️ Jangan commit .env files ke Git
- ⚠️ Change all passwords after restore
- ⚠️ Verify file permissions

### Database:
- ⚠️ Backup database sebelum restore
- ⚠️ Verify data integrity setelah restore

### Dependencies:
- ⚠️ Pastikan Python dan Node.js versions sesuai
- ⚠️ Install dependencies fresh untuk menghindari conflicts

### Production Notes:
- `CORS_ALLOW_ALL_ORIGINS = True` hanya untuk test (ubah ke False untuk production)
- `psycopg2-binary` diperlukan untuk PostgreSQL di production
- Test restore menggunakan SQLite (production akan menggunakan PostgreSQL)

---

## 📊 Backup Statistics

**Latest Backup:** backup_2025-12-18_17-14-09

- **Backend Files:** 6,323 files
- **Frontend Files:** 120 files
- **Total Size:** ~86.73 MB
- **Database:** db.sqlite3 (684 KB)
- **Media Files:** 19 files

---

## 🔗 Quick Commands

```powershell
# Create backup
cd backup
.\create_backup.ps1

# Verify backup
.\verify_backup.ps1

# Test restore
.\test_restore_localhost.ps1
```

---

## ✅ Conclusion

**Backup Status:** ✅ VERIFIED & TESTED  
**Restore Status:** ✅ SUCCESSFUL  
**Ready for Deployment:** ✅ YES

Semua file penting sudah ter-backup, terverifikasi, dan berhasil di-test restore. Backup siap untuk deployment ke VPS.

---

**Last Updated:** 2025-12-18  
**Version:** Django 5.2.8, Next.js 16.0.1

