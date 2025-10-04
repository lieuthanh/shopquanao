# Shop Quần Áo

Ứng dụng shop quần áo với React 18 (Vite) và Node.js (Express)

## Cấu trúc dự án

```
demo_shopquanao/
├── backend/          # Node.js + Express API
├── frontend/         # React 18 + Vite
└── README.md
```

## Khởi chạy ứng dụng

### Backend (Port 3001)
```bash
cd backend
npm run dev
```

### Frontend (Port 5173)
```bash
cd frontend  
npm run dev
```

## Tính năng

- Hiển thị danh sách sản phẩm quần áo
- Lọc sản phẩm theo danh mục
- Thêm sản phẩm vào giỏ hàng
- Giao diện responsive

## API Endpoints

### Products
```bash
# Lấy danh sách sản phẩm
curl -X GET http://localhost:3001/api/products

# Lấy chi tiết sản phẩm
curl -X GET http://localhost:3001/api/products/1

# Thêm sản phẩm mới
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Áo thun mới",
    "price": 350000,
    "image": "https://example.com/image.jpg",
    "category": "ao-nam",
    "description": "Áo thun chất lượng cao"
  }'

# Cập nhật sản phẩm
curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Áo thun đã sửa",
    "price": 400000,
    "image": "https://example.com/new-image.jpg",
    "category": "ao-nam",
    "description": "Mô tả đã cập nhật"
  }'

# Xóa sản phẩm
curl -X DELETE http://localhost:3001/api/products/1
```

### Categories
```bash
# Lấy danh sách danh mục
curl -X GET http://localhost:3001/api/categories
```

### Upload Image
```bash
# Upload hình ảnh
curl -X POST http://localhost:3001/api/upload \
  -F "image=@/path/to/your/image.jpg"
```

### Orders
```bash
# Tạo đơn hàng
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "note": "Giao hàng buổi sáng"
    },
    "items": [
      {
        "id": 1,
        "name": "Áo thun nam",
        "price": 299000,
        "quantity": 2
      }
    ],
    "total": 598000,
    "orderDate": "2024-01-01T10:00:00.000Z"
  }'
```

### Test Connection
```bash
# Kiểm tra kết nối database
curl -X GET http://localhost:3001/api/test
```

## Khởi chạy nhanh

```bash
# Chạy cả backend và frontend cùng lúc
./start.sh
```

## Database

- PostgreSQL (Docker): `localhost:5432`
- Database: `dbshop`
- MinIO (Object Storage): `localhost:9000`
- MinIO Console: `localhost:9001`