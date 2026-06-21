# Script untuk deploy fitur Import Excel Users ke VPS
# Penggunaan: .\deploy_import_excel_feature.ps1

$VPS_HOST = "72.61.213.33"
$VPS_USER = "root"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deploy Fitur Import Excel Users ke VPS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Upload backend files
Write-Host "1. Upload file backend..." -ForegroundColor Yellow

# Upload views.py
Write-Host "   Uploading backend/quiz/views.py..." -ForegroundColor White
scp "backend\quiz\views.py" "${VPS_USER}@${VPS_HOST}:/var/www/scholarify/backend/quiz/views.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Gagal upload views.py" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ views.py uploaded" -ForegroundColor Green

# Upload urls.py
Write-Host "   Uploading backend/quiz/urls.py..." -ForegroundColor White
scp "backend\quiz\urls.py" "${VPS_USER}@${VPS_HOST}:/var/www/scholarify/backend/quiz/urls.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Gagal upload urls.py" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ urls.py uploaded" -ForegroundColor Green

Write-Host ""

# 2. Upload frontend files
Write-Host "2. Upload file frontend..." -ForegroundColor Yellow

# Upload UsersList.tsx
Write-Host "   Uploading frontend/app/admin/components/UsersList.tsx..." -ForegroundColor White
scp "frontend\app\admin\components\UsersList.tsx" "${VPS_USER}@${VPS_HOST}:/var/www/scholarify/frontend/app/admin/components/UsersList.tsx"

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Gagal upload UsersList.tsx" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ UsersList.tsx uploaded" -ForegroundColor Green

Write-Host ""

# 3. Restart backend (jika perlu)
Write-Host "3. Restart backend PM2..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_HOST}" "pm2 restart scholarify-backend"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend restarted" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Gagal restart backend (mungkin tidak perlu restart)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Rebuild frontend
Write-Host "4. Rebuild frontend di VPS..." -ForegroundColor Yellow
Write-Host "   Ini akan memakan waktu beberapa menit..." -ForegroundColor White
Write-Host ""

ssh "${VPS_USER}@${VPS_HOST}" "cd /var/www/scholarify/frontend && npm run build"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "5. Restart frontend PM2..." -ForegroundColor Yellow
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
Write-Host "Deploy Selesai!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fitur Import Excel Users sudah di-deploy ke VPS." -ForegroundColor Green
Write-Host ""
Write-Host "Test di: https://scholarify.id/admin" -ForegroundColor Yellow
Write-Host ""
