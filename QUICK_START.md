# 🚀 Hướng Dẫn Khởi Chạy Dự Án The Blog Project

Dự án này là một hệ thống mạng xã hội Blog dựa trên kiến trúc **Microservices** sử dụng .NET 9, React (Vite), MySQL và RabbitMQ.

## 🛠 1. Yêu cầu hệ thống
- **.NET SDK 9.0+**
- **Node.js** (để chạy Frontend)
- **Docker Desktop** (để chạy MySQL và RabbitMQ nhanh chóng)

---

## 🏃 2. Các bước khởi chạy

### Bước 1: Khởi tạo Hạ tầng (Database & Message Broker)
Mở terminal tại thư mục gốc của dự án và chạy lệnh sau để bật MySQL và RabbitMQ:
```bash
docker compose -f docker-compose-infra.yml up -d
```
> *Lưu ý: Đảm bảo Docker Desktop đang chạy.*

### Bước 2: Khởi chạy các Microservices (Backend)
Bạn cần mở các terminal riêng biệt cho mỗi service sau (thứ tự không bắt buộc nhưng nên chạy Gateway cuối cùng):

1. **Auth Service** (Quản lý đăng ký/đăng nhập):
   ```bash
   cd services/AuthService
   dotnet run
   ```
2. **User Service** (Quản lý profile/bài viết):
   ```bash
   cd services/UserService
   dotnet run
   ```
3. **Chat Service** (Tin nhắn real-time):
   ```bash
   cd services/ChatService
   dotnet run
   ```
4. **Recommend Service** (Xử lý trending):
   ```bash
   cd services/RecommendPostService
   dotnet run
   ```
5. **API Gateway** (Cổng kết nối chính - CỰC KỲ QUAN TRỌNG):
   ```bash
   cd gateway/ApiGateway
   dotnet run
   ```

### Bước 3: Khởi chạy Giao diện (Frontend)
Mở một terminal mới:
```bash
cd front-end
npm install   # Nếu chạy lần đầu
npm run dev
```

---

## 🌐 3. Địa chỉ truy cập
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: `https://localhost:5001` (Toàn bộ request từ Frontend sẽ đi qua đây)
- **Swagger Documentation** (Để test API trực tiếp):
  - Auth Service: [http://localhost:5230/swagger](http://localhost:5230/swagger)
  - User Service: [http://localhost:5091/swagger](http://localhost:5091/swagger)

## 📝 4. Tài khoản dùng thử (Nếu đã chạy migration)
- **Username**: `admin`
- **Password**: `Test@123`

---
*Dự án đã được Antigravity kiểm tra lỗi cú pháp và đồng bộ hóa Database.*
