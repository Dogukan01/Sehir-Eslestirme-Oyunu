#!/bin/bash

echo "Türkiye Plaka - Şehir Eşleştirme Oyunu Başlatılıyor..."

# Backend'i arkaplanda başlat
echo "Backend (Port 5001) başlatılıyor..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Frontend'i arkaplanda başlat
echo "Frontend (Vite) başlatılıyor..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Sunucuların ayağa kalkması için biraz bekle
sleep 2

# Tarayıcı sekmesini otomatik aç (MacOS için open komutu)
echo "Tarayıcı açılıyor: http://localhost:5173"
open http://localhost:5173

echo "Çıkmak ve sunucuları durdurmak için CTRL+C tuşlarına basın."

# Terminal kapatıldığında veya CTRL+C yapıldığında arka plan işlemlerini durdur
trap "echo 'Sunucular durduruluyor...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Scriptin açık kalması için bekle
wait
