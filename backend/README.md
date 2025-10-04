# Backend Shop Quần Áo

## Yêu cầu hệ thống
- Node.js
- Docker (PostgreSQL và MinIO chạy trên Docker)

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
File `.env` đã được cấu hình sẵn với các thông số mặc định.

## Chạy dự án

**Lưu ý:** Trước khi chạy dự án, cần khởi động container MinIO và PostgreSQL

```bash
# Khởi động containers
docker-compose up -d

# Chạy backend
npm run dev
```

## Thông tin server
- Port: `3001`
- URL: `http://localhost:3001`

## Scripts có sẵn
- `npm start` - Chạy server production
- `npm run dev` - Chạy server development với nodemon
- `npm test` - Chạy tests (chưa cấu hình)

## API Endpoints

### 1. Đăng ký tài khoản
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "123456",
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC, TP.HCM"
  }'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "123456"
  }'
```

### 3. Lấy danh sách tin tức ngành sơn (có phân trang)
```bash
# Lấy 10 tin tức đầu tiên
curl http://localhost:3001/api/news

# Lấy trang 2, mỗi trang 5 tin tức
curl "http://localhost:3001/api/news?page=2&limit=5"
```

### 4. Lấy chi tiết tin tức ngành sơn
```bash
# Sử dụng ID bất kỳ từ danh sách tin tức
curl http://localhost:3001/api/news/{id}

# Ví dụ:
curl http://localhost:3001/api/news/news_1_0
curl http://localhost:3001/api/news/news_2_4
curl http://localhost:3001/api/news/fallback_1
```

### 5. Test kết nối database
```bash
curl http://localhost:3001/api/test
```

### 6. Lấy danh sách sản phẩm
```bash
curl http://localhost:3001/api/products
```

### 7. Lấy sản phẩm theo ID
```bash
curl http://localhost:3001/api/products/1
```

### 8. Lấy danh sách danh mục
```bash
curl http://localhost:3001/api/categories
```

### 9. Thêm sản phẩm mới
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Áo thun nam",
    "price": 150000,
    "image": "http://localhost:9000/shopquanao/image.jpg",
    "category": "Áo nam",
    "description": "Áo thun cotton cao cấp"
  }'
```

### 10. Cập nhật sản phẩm
```bash
curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Áo thun nam updated",
    "price": 180000,
    "image": "http://localhost:9000/shopquanao/image.jpg",
    "category": "Áo nam",
    "description": "Áo thun cotton cao cấp updated"
  }'
```

### 11. Xóa sản phẩm
```bash
curl -X DELETE http://localhost:3001/api/products/1
```

### 12. Upload hình ảnh
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "image=@/path/to/your/image.jpg"
```

### 13. Tạo đơn hàng
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "address": "123 Đường ABC, TP.HCM",
      "note": "Giao hàng buổi sáng"
    },
    "items": [
      {
        "id": 1,
        "name": "Áo thun nam",
        "price": 150000,
        "quantity": 2
      }
    ],
    "total": 300000,
    "orderDate": "2024-01-15T10:30:00Z"
  }'
```