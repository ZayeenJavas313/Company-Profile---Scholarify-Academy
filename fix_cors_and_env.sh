#!/bin/bash
# Script untuk fix CORS dan environment variable di VPS
# Penggunaan: ./fix_cors_and_env.sh

echo "========================================="
echo "Fix CORS dan Environment Variable"
echo "========================================="
echo ""

# 1. Upload settings.py yang sudah diperbaiki
echo "1. Upload settings.py ke VPS..."
scp backend/scholarify/settings.py root@72.61.213.33:/var/www/scholarify/backend/scholarify/settings.py

if [ $? -eq 0 ]; then
    echo "   ✅ settings.py uploaded"
else
    echo "   ❌ Gagal upload settings.py"
    exit 1
fi

echo ""

# 2. Cek dan set environment variable di VPS
echo "2. Set environment variable di VPS..."
ssh root@72.61.213.33 << 'EOF'
# Cek apakah .env.local ada di frontend
if [ -f "/var/www/scholarify/frontend/.env.local" ]; then
    echo "   File .env.local sudah ada"
    cat /var/www/scholarify/frontend/.env.local
else
    echo "   Membuat file .env.local..."
    echo "NEXT_PUBLIC_API_BASE_URL=https://api.scholarify.id/api" > /var/www/scholarify/frontend/.env.local
    echo "   ✅ .env.local created"
fi

# Pastikan NEXT_PUBLIC_API_BASE_URL sudah benar
if grep -q "NEXT_PUBLIC_API_BASE_URL" /var/www/scholarify/frontend/.env.local; then
    echo "   ✅ NEXT_PUBLIC_API_BASE_URL sudah ada"
    grep "NEXT_PUBLIC_API_BASE_URL" /var/www/scholarify/frontend/.env.local
else
    echo "   Menambahkan NEXT_PUBLIC_API_BASE_URL..."
    echo "NEXT_PUBLIC_API_BASE_URL=https://api.scholarify.id/api" >> /var/www/scholarify/frontend/.env.local
    echo "   ✅ NEXT_PUBLIC_API_BASE_URL added"
fi
EOF

echo ""

# 3. Restart backend
echo "3. Restart backend PM2..."
ssh root@72.61.213.33 "pm2 restart scholarify-backend"

if [ $? -eq 0 ]; then
    echo "   ✅ Backend restarted"
else
    echo "   ⚠️  Gagal restart backend"
fi

echo ""

# 4. Rebuild frontend (karena .env.local berubah)
echo "4. Rebuild frontend..."
echo "   Ini akan memakan waktu beberapa menit..."
ssh root@72.61.213.33 "cd /var/www/scholarify/frontend && npm run build && pm2 restart scholarify-frontend"

if [ $? -eq 0 ]; then
    echo "   ✅ Frontend rebuilt and restarted"
else
    echo "   ❌ Gagal rebuild frontend"
    exit 1
fi

echo ""
echo "========================================="
echo "Selesai!"
echo "========================================="
echo ""
echo "CORS dan environment variable sudah diperbaiki."
echo "Test di: https://scholarify.id/admin"
echo ""
