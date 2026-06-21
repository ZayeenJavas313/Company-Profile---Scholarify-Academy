# Script Verifikasi Backup - Scholarify Project
# Memverifikasi bahwa semua file penting sudah ter-backup dengan benar

param(
    [string]$BackupPath = ""
)

Write-Host "=== Backup Verification Script ===" -ForegroundColor Cyan
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
Write-Host ""

# Fungsi untuk check file
function Test-BackupFile {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    if (Test-Path $FilePath) {
        $file = Get-Item $FilePath
        Write-Host "  [OK] $Description" -ForegroundColor Green
        Write-Host "       Size: $([math]::Round($file.Length / 1KB, 2)) KB" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "  [MISSING] $Description" -ForegroundColor Red
        Write-Host "       Expected: $FilePath" -ForegroundColor Gray
        return $false
    }
}

# Fungsi untuk check directory
function Test-BackupDirectory {
    param(
        [string]$DirPath,
        [string]$Description
    )
    
    if (Test-Path $DirPath) {
        $fileCount = (Get-ChildItem -Path $DirPath -Recurse -File).Count
        Write-Host "  [OK] $Description" -ForegroundColor Green
        Write-Host "       Files: $fileCount" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "  [MISSING] $Description" -ForegroundColor Red
        return $false
    }
}

$allChecks = @()
$criticalChecks = @()

Write-Host "=== Checking Critical Files ===" -ForegroundColor Yellow
Write-Host ""

# Backend Critical Files
Write-Host "Backend Files:" -ForegroundColor Cyan
$allChecks += Test-BackupFile "$BackupPath\backend\manage.py" "manage.py"
$criticalChecks += Test-BackupFile "$BackupPath\backend\requirements.txt" "requirements.txt"
$allChecks += Test-BackupFile "$BackupPath\backend\runtime.txt" "runtime.txt"
$allChecks += Test-BackupFile "$BackupPath\backend\Procfile" "Procfile"
$allChecks += Test-BackupFile "$BackupPath\backend\scholarify\settings.py" "settings.py"
$allChecks += Test-BackupFile "$BackupPath\backend\scholarify\urls.py" "urls.py"
$allChecks += Test-BackupFile "$BackupPath\backend\scholarify\wsgi.py" "wsgi.py"
$allChecks += Test-BackupFile "$BackupPath\backend\quiz\models.py" "models.py"
$allChecks += Test-BackupFile "$BackupPath\backend\quiz\views.py" "views.py"
$allChecks += Test-BackupFile "$BackupPath\backend\quiz\urls.py" "quiz/urls.py"
Write-Host ""

# Frontend Critical Files
Write-Host "Frontend Files:" -ForegroundColor Cyan
$allChecks += Test-BackupFile "$BackupPath\frontend\package.json" "package.json"
$criticalChecks += Test-BackupFile "$BackupPath\frontend\package-lock.json" "package-lock.json"
$allChecks += Test-BackupFile "$BackupPath\frontend\next.config.js" "next.config.js"
$allChecks += Test-BackupFile "$BackupPath\frontend\tsconfig.json" "tsconfig.json"
$allChecks += Test-BackupFile "$BackupPath\frontend\tailwind.config.js" "tailwind.config.js"
$allChecks += Test-BackupFile "$BackupPath\frontend\app\layout.tsx" "app/layout.tsx"
$allChecks += Test-BackupFile "$BackupPath\frontend\app\page.tsx" "app/page.tsx"
Write-Host ""

# Database
Write-Host "Database:" -ForegroundColor Cyan
$criticalChecks += Test-BackupFile "$BackupPath\database\db.sqlite3" "db.sqlite3"
Write-Host ""

# Media Files
Write-Host "Media Files:" -ForegroundColor Cyan
$allChecks += Test-BackupDirectory "$BackupPath\backend\media" "Media directory"
if (Test-Path "$BackupPath\backend\media\option_images") {
    $imgCount = (Get-ChildItem -Path "$BackupPath\backend\media\option_images" -File).Count
    Write-Host "  [OK] Option images: $imgCount files" -ForegroundColor Green
}
if (Test-Path "$BackupPath\backend\media\soal_images") {
    $soalCount = (Get-ChildItem -Path "$BackupPath\backend\media\soal_images" -Recurse -File).Count
    Write-Host "  [OK] Soal images: $soalCount files" -ForegroundColor Green
}
Write-Host ""

# Migrations
Write-Host "Migrations:" -ForegroundColor Cyan
$allChecks += Test-BackupDirectory "$BackupPath\backend\quiz\migrations" "Migrations directory"
$migrationFiles = Get-ChildItem -Path "$BackupPath\backend\quiz\migrations" -Filter "*.py" -File | Where-Object { $_.Name -ne "__init__.py" }
Write-Host "  [OK] Migration files: $($migrationFiles.Count)" -ForegroundColor Green
Write-Host ""

# Landing Page
Write-Host "Landing Page:" -ForegroundColor Cyan
$allChecks += Test-BackupFile "$BackupPath\frontend\public\landing\index.html" "Landing page HTML"
$allChecks += Test-BackupFile "$BackupPath\frontend\public\landing\style.css" "Landing page CSS"
$allChecks += Test-BackupDirectory "$BackupPath\frontend\public\landing\assets" "Landing page assets"
Write-Host ""

# Configuration Files
Write-Host "Configuration:" -ForegroundColor Cyan
if (Test-Path "$BackupPath\config\frontend.env.local") {
    Write-Host "  [OK] frontend.env.local (contains sensitive data!)" -ForegroundColor Yellow
} else {
    Write-Host "  [INFO] frontend.env.local not found (may not exist)" -ForegroundColor Gray
}
Write-Host ""

# Documentation
Write-Host "Documentation:" -ForegroundColor Cyan
$allChecks += Test-BackupFile "$BackupPath\README.md" "Backup README"
Write-Host ""

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Yellow
Write-Host ""

$totalChecks = $allChecks.Count
$passedChecks = ($allChecks | Where-Object { $_ -eq $true }).Count
$failedChecks = $totalChecks - $passedChecks

$criticalPassed = ($criticalChecks | Where-Object { $_ -eq $true }).Count
$criticalFailed = $criticalChecks.Count - $criticalPassed

Write-Host "Total Checks: $totalChecks" -ForegroundColor Cyan
Write-Host "  Passed: $passedChecks" -ForegroundColor Green
Write-Host "  Failed: $failedChecks" -ForegroundColor $(if ($failedChecks -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "Critical Files: $($criticalChecks.Count)" -ForegroundColor Cyan
Write-Host "  Passed: $criticalPassed" -ForegroundColor Green
Write-Host "  Failed: $criticalFailed" -ForegroundColor $(if ($criticalFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

# File size summary
Write-Host "=== Backup Size Summary ===" -ForegroundColor Yellow
$backendSize = (Get-ChildItem -Path "$BackupPath\backend" -Recurse -File -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
$frontendSize = (Get-ChildItem -Path "$BackupPath\frontend" -Recurse -File -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
$dbSize = if (Test-Path "$BackupPath\database\db.sqlite3") {
    (Get-Item "$BackupPath\database\db.sqlite3").Length / 1MB
} else { 0 }
$totalSize = $backendSize + $frontendSize + $dbSize

Write-Host "Backend: $([math]::Round($backendSize, 2)) MB" -ForegroundColor Cyan
Write-Host "Frontend: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor Cyan
Write-Host "Database: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
Write-Host "Total: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Green
Write-Host ""

# Final verdict
if ($criticalFailed -eq 0 -and $failedChecks -eq 0) {
    Write-Host "=== VERIFICATION PASSED ===" -ForegroundColor Green
    Write-Host "All critical files are present. Backup is ready for deployment." -ForegroundColor Green
    exit 0
} elseif ($criticalFailed -eq 0) {
    Write-Host "=== VERIFICATION WARNING ===" -ForegroundColor Yellow
    Write-Host "Critical files are present, but some non-critical files are missing." -ForegroundColor Yellow
    Write-Host "Backup may be usable, but review missing files." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "=== VERIFICATION FAILED ===" -ForegroundColor Red
    Write-Host "Critical files are missing! Do not use this backup for deployment." -ForegroundColor Red
    exit 1
}

