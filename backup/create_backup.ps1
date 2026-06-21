# Script Backup untuk Proyek Scholarify
# Menyalin semua file penting sebelum deployment

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup_$timestamp"

Write-Host "Creating backup directory: $backupDir" -ForegroundColor Green

# Buat struktur folder
New-Item -ItemType Directory -Path "$backupDir\backend" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\frontend" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\database" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\config" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\docs" -Force | Out-Null

Write-Host "Copying backend files..." -ForegroundColor Yellow
# Copy backend (exclude cache, venv, node_modules)
robocopy "..\backend" "$backupDir\backend" /E /XD __pycache__ node_modules venv .git staticfiles /XF *.pyc *.pyo /NFL /NDL /NJH /NJS

Write-Host "Copying frontend files..." -ForegroundColor Yellow
# Copy frontend (exclude node_modules, .next, cache)
robocopy "..\frontend" "$backupDir\frontend" /E /XD node_modules .next .git __pycache__ /XF *.log /NFL /NDL /NJH /NJS

Write-Host "Copying database..." -ForegroundColor Yellow
# Copy database
if (Test-Path "..\backend\db.sqlite3") {
    Copy-Item "..\backend\db.sqlite3" "$backupDir\database\" -Force
    Write-Host "Database copied successfully" -ForegroundColor Green
} else {
    Write-Host "Database file not found" -ForegroundColor Red
}

Write-Host "Copying configuration files..." -ForegroundColor Yellow
# Copy config files
if (Test-Path "..\nginx") {
    robocopy "..\nginx" "$backupDir\config\nginx" /E /NFL /NDL /NJH /NJS
}

# Copy .env files if exist (with warning)
if (Test-Path "..\backend\.env") {
    Copy-Item "..\backend\.env" "$backupDir\config\backend.env" -Force
    Write-Host "Backend .env copied (contains sensitive data!)" -ForegroundColor Yellow
}
if (Test-Path "..\frontend\.env") {
    Copy-Item "..\frontend\.env" "$backupDir\config\frontend.env" -Force
    Write-Host "Frontend .env copied (contains sensitive data!)" -ForegroundColor Yellow
}
if (Test-Path "..\frontend\.env.local") {
    Copy-Item "..\frontend\.env.local" "$backupDir\config\frontend.env.local" -Force
    Write-Host "Frontend .env.local copied (contains sensitive data!)" -ForegroundColor Yellow
}

Write-Host "Copying documentation..." -ForegroundColor Yellow
# Copy README files
if (Test-Path "..\README.md") {
    Copy-Item "..\README.md" "$backupDir\docs\" -Force
}
if (Test-Path "..\frontend\README.md") {
    Copy-Item "..\frontend\README.md" "$backupDir\docs\frontend_README.md" -Force
}

# Copy backup README
Copy-Item "BACKUP_README.md" "$backupDir\README.md" -Force

# Update timestamp in README
$readmeContent = Get-Content "$backupDir\README.md" -Raw
$readmeContent = $readmeContent -replace "\[Akan diisi otomatis saat backup dibuat\]", "Backup dibuat pada: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Set-Content "$backupDir\README.md" -Value $readmeContent

Write-Host "`nBackup completed successfully!" -ForegroundColor Green
Write-Host "Backup location: $backupDir" -ForegroundColor Cyan
Write-Host "`nImportant: Review and secure sensitive files (.env files) before sharing!" -ForegroundColor Yellow

