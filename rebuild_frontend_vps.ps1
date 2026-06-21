# Script untuk rebuild frontend di VPS via SSH
# Penggunaan: .\rebuild_frontend_vps.ps1

$VPS_HOST = "72.61.213.33"
$VPS_USER = "root"
$REMOTE_SCRIPT = "/var/www/scholarify/rebuild_frontend.sh"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Rebuild Frontend di VPS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Upload script rebuild jika belum ada
Write-Host "Uploading rebuild script ke VPS..." -ForegroundColor Yellow
scp rebuild_frontend.sh "${VPS_USER}@${VPS_HOST}:${REMOTE_SCRIPT}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gagal upload rebuild script!" -ForegroundColor Red
    exit 1
}

Write-Host "Script uploaded successfully!" -ForegroundColor Green
Write-Host ""

# Buat command untuk membuat script executable dan menjalankannya
$sshCommand = @"
cd /var/www/scholarify
chmod +x rebuild_frontend.sh
./rebuild_frontend.sh
"@

Write-Host "Connecting to VPS dan menjalankan rebuild..." -ForegroundColor Yellow
Write-Host ""

ssh "${VPS_USER}@${VPS_HOST}" $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Rebuild selesai!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Rebuild gagal!" -ForegroundColor Red
    exit 1
}







