# Script Test Restore di Localhost - Scholarify Project
# Restore backup ke folder temporary dan test apakah bisa dijalankan

param(
    [string]$BackupPath = "",
    [string]$TestPath = "..\test_restore_localhost"
)

Write-Host "=== Test Restore di Localhost ===" -ForegroundColor Cyan
Write-Host ""

# Jika tidak ada path, cari backup terbaru
if ([string]::IsNullOrEmpty($BackupPath)) {
    $latestBackup = Get-ChildItem -Path "." -Directory -Filter "backup_*" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($null -eq $latestBackup) {
        Write-Host "ERROR: No backup found!" -ForegroundColor Red
        exit 1
    }
    
    $BackupPath = $latestBackup.FullName
    Write-Host "Using latest backup: $($latestBackup.Name)" -ForegroundColor Yellow
}

Write-Host "Backup Path: $BackupPath" -ForegroundColor Green
Write-Host "Test Path: $TestPath" -ForegroundColor Green
Write-Host ""

# Warning
Write-Host "WARNING: This will create a test restore in: $TestPath" -ForegroundColor Yellow
Write-Host "This folder will be DELETED if it exists!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

# Cleanup test restore folder
if (Test-Path $TestPath) {
    Write-Host "Removing existing test restore folder..." -ForegroundColor Yellow
    Remove-Item -Path $TestPath -Recurse -Force
}

# Create test restore structure
Write-Host "Creating test restore structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$TestPath\backend" -Force | Out-Null
New-Item -ItemType Directory -Path "$TestPath\frontend" -Force | Out-Null

# Copy files
Write-Host ""
Write-Host "Copying backend files..." -ForegroundColor Yellow
robocopy "$BackupPath\backend" "$TestPath\backend" /E /NFL /NDL /NJH /NJS | Out-Null

Write-Host "Copying frontend files..." -ForegroundColor Yellow
robocopy "$BackupPath\frontend" "$TestPath\frontend" /E /NFL /NDL /NJH /NJS | Out-Null

# Copy database
Write-Host "Copying database..." -ForegroundColor Yellow
if (Test-Path "$BackupPath\database\db.sqlite3") {
    Copy-Item "$BackupPath\database\db.sqlite3" "$TestPath\backend\" -Force
    Write-Host "  [OK] Database copied" -ForegroundColor Green
}

# Copy environment files
Write-Host "Copying environment files..." -ForegroundColor Yellow
if (Test-Path "$BackupPath\config\frontend.env.local") {
    Copy-Item "$BackupPath\config\frontend.env.local" "$TestPath\frontend\.env.local" -Force
    Write-Host "  [OK] Frontend .env.local copied" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Restore Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Test restore location: $TestPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Test Backend:" -ForegroundColor Cyan
Write-Host "   cd $TestPath\backend" -ForegroundColor Gray
Write-Host "   python -m venv venv" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "   python manage.py migrate" -ForegroundColor Gray
Write-Host "   python manage.py runserver" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test Frontend:" -ForegroundColor Cyan
Write-Host "   cd $TestPath\frontend" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. After testing, clean up:" -ForegroundColor Cyan
Write-Host "   Remove-Item -Path '$TestPath' -Recurse -Force" -ForegroundColor Gray
Write-Host ""

