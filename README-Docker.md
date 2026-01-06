# The-Blog-Project - Docker Setup

## 🐳 Môi trường Docker

### Yêu cầu
- Docker Desktop đã được cài đặt
- Docker Compose v2+

### Các Services

| Service | Port | URL |
|---------|------|-----|
| **MySQL** | 3307 | localhost:3307 |
| **AuthService** | 4401 | http://localhost:4401 |
| **PostService** | 4402 | http://localhost:4402 |
| **NewsFeedService** | 4403 | http://localhost:4403 |
| **UserService** | 4404 | http://localhost:4404 |

### MySQL Credentials
- **Host**: localhost (hoặc `mysql` trong Docker network)
- **Port**: 3307
- **Database**: theblog
- **Username**: root
- **Password**: root123

---

## 🚀 Khởi chạy

### Chạy tất cả services
```bash
docker-compose up --build
```

### Chạy ở background (detached mode)
```bash
docker-compose up --build -d
```

### Xem logs
```bash
# Tất cả services
docker-compose logs -f

# Service cụ thể
docker-compose logs -f auth-service
```

### Dừng services
```bash
docker-compose down
```

### Dừng và xóa data (volumes)
```bash
docker-compose down -v
```

---

## 🔍 API Endpoints

### AuthService (Port 4401)

#### Đăng ký
```bash
curl -X POST http://localhost:4401/api/auth-service/Auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "avatarImage": "",
    "coverImage": ""
  }'
```

#### Đăng nhập
```bash
curl -X POST http://localhost:4401/api/auth-service/Auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123"
  }'
```

#### Lấy Profile (cần JWT token)
```bash
curl -X GET http://localhost:4401/api/auth-service/Auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Troubleshooting

### Lỗi kết nối MySQL
Đợi MySQL container khởi động hoàn toàn (khoảng 30 giây) trước khi các service khác kết nối.

### Rebuild image sau khi sửa code
```bash
docker-compose up --build
```

### Xóa cache và rebuild hoàn toàn
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build
```
