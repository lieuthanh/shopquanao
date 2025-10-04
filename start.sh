#!/bin/bash

echo "🚀 Khởi chạy Shop Quần Áo..."

# Khởi chạy backend
echo "📦 Khởi chạy Backend (Port 3001)..."
cd backend && npm run dev &

# Đợi 2 giây
sleep 2

# Khởi chạy frontend  
echo "🎨 Khởi chạy Frontend (Port 5173)..."
cd frontend && npm run dev &

echo "✅ Ứng dụng đã khởi chạy!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"

wait