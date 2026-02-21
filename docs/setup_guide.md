# Hướng dẫn Setup và Chạy Dự án (The Blog Project)

Tài liệu này hướng dẫn bạn cách thiết lập môi trường và chạy toàn bộ hệ thống microservices.

## 1. Yêu cầu Hệ thống (Prerequisites)

- **.NET SDK 9.0**: Cài đặt bản mới nhất.
- **MySQL Server**: Chạy trên cổng `3306`.
- **RabbitMQ**: Chạy trên cổng `5672` (Dùng cho `RecommendPostService`).
- **Postman**: Để test API.

## 2. Chuẩn bị Cơ sở dữ liệu

Đảm bảo bạn đã cấu hình đúng Connection String trong các file `appsettings.json` của mỗi service:
- `AuthService`
- `UserService`
- `RecommendPostService`

**Lưu ý:** Bạn cần tạo database (ví dụ: `theblogproject`) trong MySQL trước khi chạy migration.

## 3. Thứ tự Chạy các Thành phần (Run Order)

Để hệ thống hoạt động ổn định, hãy chạy theo thứ tự sau:

### Bước 1: Build Shared Library
Mở terminal tại thư mục gốc và chạy:
```bash
dotnet build shared/TheBlog.Shared/TheBlog.Shared.csproj
```

### Bước 2: Chạy các Microservices
Mở các terminal riêng biệt cho mỗi service và chạy lệnh `dotnet run`:
1.  **AuthService**: `cd services/AuthService && dotnet run` (Port 5230)
2.  **UserService**: `cd services/UserService && dotnet run` (Port 5091)
3.  **ChatService**: `cd services/ChatService && dotnet run` (Port 5262)
4.  **RecommendPostService**: `cd services/RecommendPostService && dotnet run` (Port 5051)

### Bước 3: Chạy API Gateway
Đây là thành phần cuối cùng để điều hướng request:
```bash
cd gateway/ApiGateway && dotnet run
```
Gateway sẽ chạy tại: `https://localhost:5001`.

## 4. Kiểm tra trạng thái
Sau khi chạy xong, bạn có thể truy cập Swagger của các service để kiểm tra:
- **AuthService**: `http://localhost:5230/swagger`
- **UserService**: `http://localhost:5091/swagger`
