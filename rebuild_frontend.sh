#!/bin/bash
# Script untuk rebuild frontend di VPS
# Penggunaan: ./rebuild_frontend.sh
# Catatan: Script ini menggunakan nohup untuk memastikan build tetap berjalan meskipun SSH terputus

echo "========================================="
echo "Rebuild Frontend di VPS"
echo "========================================="
echo ""

# Navigate to frontend directory
cd /var/www/scholarify/frontend || {
    echo "ERROR: Tidak dapat masuk ke direktori /var/www/scholarify/frontend"
    exit 1
}

echo "Direktori saat ini: $(pwd)"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json tidak ditemukan!"
    exit 1
fi

# Build frontend dengan nohup agar tetap berjalan meskipun SSH terputus
echo "Building frontend..."
echo "Catatan: Build akan tetap berjalan meskipun SSH connection terputus"
echo "Log akan tersimpan di: /var/www/scholarify/frontend/build.log"
echo ""

# Gunakan nohup untuk memastikan proses tetap berjalan
nohup npm run build > build.log 2>&1 &
BUILD_PID=$!

echo "Build process dimulai dengan PID: $BUILD_PID"
echo ""
echo "Untuk melihat progress build (tanpa menunggu):"
echo "  tail -f /var/www/scholarify/frontend/build.log"
echo ""
echo "Untuk menunggu build selesai, tekan Ctrl+C tidak akan menghentikan build"
echo ""

# Tunggu proses build selesai
wait $BUILD_PID
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "Build berhasil!"
    echo "========================================="
    echo ""
    
    # Restart PM2
    echo "Restarting PM2 frontend..."
    pm2 restart scholarify-frontend
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================="
        echo "Frontend berhasil di-restart!"
        echo "========================================="
        echo ""
        echo "Status PM2:"
        pm2 status
        echo ""
        echo "Log build tersimpan di: /var/www/scholarify/frontend/build.log"
    else
        echo ""
        echo "ERROR: Gagal restart PM2 frontend"
        exit 1
    fi
else
    echo ""
    echo "ERROR: Build gagal!"
    echo "Cek log untuk detail: tail -50 /var/www/scholarify/frontend/build.log"
    exit 1
fi

