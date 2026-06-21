# Script untuk fix CORS dan rebuild setelah set environment variable
# Penggunaan: .\fix_cors_and_rebuild.ps1

$VPS_HOST = "72.61.213.33"
$VPS_USER = "root"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Fix CORS dan Rebuild Frontend" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Upload settings.py yang sudah diperbaiki
Write-Host "1. Upload settings.py (dengan CORS fix)..." -ForegroundColor Yellow
scp "backend\scholarify\settings.py" "${VPS_USER}@${VPS_HOST}:/var/www/scholarify/backend/scholarify/settings.py"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ settings.py uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Gagal upload settings.py" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Restart backend
Write-Host "2. Restart backend PM2..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_HOST}" "pm2 restart scholarify-backend"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend restarted" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Gagal restart backend" -ForegroundColor Yellow
}

Write-Host ""

# 3. Rebuild frontend (karena .env.local sudah di-set)
Write-Host "3. Rebuild frontend..." -ForegroundColor Yellow
Write-Host "   Ini akan memakan waktu beberapa menit..." -ForegroundColor White
Write-Host ""

ssh "${VPS_USER}@${VPS_HOST}" "cd /var/www/scholarify/frontend && npm run build"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "4. Restart frontend PM2..." -ForegroundColor Yellow
    ssh "${VPS_USER}@${VPS_HOST}" "pm2 restart scholarify-frontend"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend restarted" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Gagal restart frontend" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "   ❌ Gagal build frontend" -ForegroundColor Red
    Write-Host "   Cek error di VPS dengan SSH manual" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Selesai!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CORS sudah diperbaiki dan frontend sudah di-rebuild." -ForegroundColor Green
Write-Host ""
Write-Host "Test di: https://scholarify.id/admin" -ForegroundColor Yellow
Write-Host ""
