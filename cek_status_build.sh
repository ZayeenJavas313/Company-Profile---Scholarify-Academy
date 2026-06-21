#!/bin/bash
# Script untuk memeriksa status build frontend
# Penggunaan: ./cek_status_build.sh

echo "========================================="
echo "Status Build Frontend"
echo "========================================="
echo ""

# Cek apakah proses build masih berjalan
BUILD_PROCESS=$(ps aux | grep -E "npm run build|next build" | grep -v grep)

if [ -z "$BUILD_PROCESS" ]; then
    echo "❌ Build process tidak ditemukan (mungkin sudah selesai atau belum dimulai)"
else
    echo "✅ Build process masih berjalan:"
    echo "$BUILD_PROCESS"
    echo ""
fi

# Cek log file
LOG_FILE="/var/www/scholarify/frontend/build.log"

if [ -f "$LOG_FILE" ]; then
    echo "📝 Log file ditemukan: $LOG_FILE"
    echo ""
    echo "=== 10 baris terakhir dari log ==="
    tail -10 "$LOG_FILE"
    echo ""
    echo "Untuk melihat log real-time: tail -f $LOG_FILE"
else
    echo "⚠️  Log file tidak ditemukan: $LOG_FILE"
fi

# Cek apakah .next folder sudah dibuat
NEXT_DIR="/var/www/scholarify/frontend/.next"

if [ -d "$NEXT_DIR" ]; then
    echo "✅ Folder .next sudah ada"
    echo "   Ukuran: $(du -sh $NEXT_DIR 2>/dev/null | cut -f1)"
else
    echo "❌ Folder .next belum ada (build mungkin belum selesai)"
fi

# Cek PM2 status
echo ""
echo "=== PM2 Status ==="
pm2 status







