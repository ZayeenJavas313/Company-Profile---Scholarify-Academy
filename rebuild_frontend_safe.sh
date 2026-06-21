#!/bin/bash
# Script untuk rebuild frontend di VPS (AMAN - tidak terhenti jika SSH terputus)
# Penggunaan: ./rebuild_frontend_safe.sh

LOG_FILE="/var/www/scholarify/frontend/build.log"
FRONTEND_DIR="/var/www/scholarify/frontend"

echo "========================================="
echo "Rebuild Frontend di VPS (Safe Mode)"
echo "========================================="
echo ""

# Navigate to frontend directory
cd "$FRONTEND_DIR" || {
    echo "ERROR: Tidak dapat masuk ke direktori $FRONTEND_DIR"
    exit 1
}

echo "Direktori saat ini: $(pwd)"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json tidak ditemukan!"
    exit 1
fi

# Hapus log lama jika ada
> "$LOG_FILE"

echo "Building frontend..."
echo "⚠️  Catatan: Build akan tetap berjalan meskipun SSH connection terputus"
echo "📝 Log tersimpan di: $LOG_FILE"
echo "👀 Untuk melihat progress: tail -f $LOG_FILE"
echo ""

# Gunakan nohup dengan setsid untuk benar-benar detach dari terminal
setsid npm run build > "$LOG_FILE" 2>&1 &
BUILD_PID=$!

echo "✅ Build process dimulai dengan PID: $BUILD_PID"
echo ""
echo "🔗 Anda bisa menutup SSH connection sekarang, build akan tetap berjalan"
echo ""
echo "Untuk memeriksa status build (di terminal baru):"
echo "  ps aux | grep $BUILD_PID"
echo "  tail -f $LOG_FILE"
echo ""
echo "Menunggu build selesai..."

# Tunggu proses build selesai (atau timeout setelah 10 menit)
TIMEOUT=600  # 10 menit
ELAPSED=0
while kill -0 $BUILD_PID 2>/dev/null; do
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo ""
        echo "⏱️  Timeout setelah 10 menit. Build mungkin masih berjalan."
        echo "   Cek status dengan: ps aux | grep $BUILD_PID"
        echo "   Atau lihat log: tail -f $LOG_FILE"
        exit 1
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    # Tampilkan progress setiap 30 detik
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "⏳ Build masih berjalan... (${ELAPSED}s)"
    fi
done

# Cek exit code
wait $BUILD_PID
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Build berhasil!"
    echo "========================================="
    echo ""
    
    # Restart PM2
    echo "🔄 Restarting PM2 frontend..."
    pm2 restart scholarify-frontend
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================="
        echo "✅ Frontend berhasil di-restart!"
        echo "========================================="
        echo ""
        echo "Status PM2:"
        pm2 status
        echo ""
        echo "📝 Log build tersimpan di: $LOG_FILE"
    else
        echo ""
        echo "❌ ERROR: Gagal restart PM2 frontend"
        exit 1
    fi
else
    echo ""
    echo "❌ ERROR: Build gagal (exit code: $BUILD_EXIT_CODE)!"
    echo "📝 Cek log untuk detail: tail -50 $LOG_FILE"
    exit 1
fi







