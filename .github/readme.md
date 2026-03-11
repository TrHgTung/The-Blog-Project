# Hướng dẫn Setup và Chạy Dự án (The Blog Project)

Tài liệu này hướng dẫn bạn cách thiết lập môi trường và chạy toàn bộ hệ thống microservices một cách nhanh chóng nhất.

## 1. Yêu cầu Hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

- **.NET 9.0 SDK**: [Tải tại đây](https://dotnet.microsoft.com/download/dotnet/9.0)
- **Node.js (v18+) & npm**: Để chạy Front-end (Vite).
- **Docker Desktop**: Cần thiết để chạy Redis và RabbitMQ.
- **MySQL Server (v8.0+)**: Có thể dùng Laragon, XAMPP hoặc cài đặt trực tiếp (Thiết lập cổng mặc định cho MySQL là `3306`).
- **Windows Terminal / PowerShell**: Khuyến khích sử dụng để chạy script khởi động nhiều cửa sổ (Tab).

## 2. Chuẩn bị Hạ tầng (Infrastructure)

Dự án sử dụng Docker để quản lý các thành phần trung gian.

1.  **Chạy Redis & RabbitMQ**:
    Mở terminal tại thư mục gốc và chạy:

    ```bash
    docker-compose -f docker-compose-infra.yml up -d
    ```

    - **RabbitMQ**: Quản lý hàng đợi (Port `5672`, Management UI: `15672`).
    - **Redis Stack**: Quản lý Cache (Port `6379`, Insight UI: `8001`).

2.  **Cấu hình MySQL**:
    Đảm bảo MySQL đang chạy. Database `theblogproject` sẽ tự động được tạo khi các service lần đầu khởi động nhờ vào lệnh `EnsureCreated`.
    - Cấu hình Connection String tại các file `appsettings.json` trong mỗi service:
      ```json
      "ConnectionStrings": {
        "MySqlConnect": "server=localhost;port=3306;database=theblogproject;user=root;password=YOUR_PASSWORD"
      }
      ```

## 3. Khởi động dự án (Cách nhanh nhất)

[Tôi](https://tungth.com) đã chuẩn bị sẵn script PowerShell để bạn khởi động toàn bộ hệ thống chỉ bằng một vài câu lệnh:

1.  Mở PowerShell hoặc Windows Terminal tại thư mục gốc.
2.  Chạy script:

    2.1. Build dự án:

    ```powershell
    ./build-all.ps1
    ```

    2.2. Sau đó, Chạy dự án:

    ```powershell
    ./dev-start.ps1
    ```

    _Script này sẽ tự động: Khởi động Docker Infra -> Build Shared Library -> Mở các cửa sổ terminal riêng biệt cho từng Service & Front-end._

## 4. Khởi động thủ công (Nếu script lỗi)

Nếu bạn muốn chạy từng bước một:

### Bước 1: Build Shared Library

```bash
dotnet build shared/TheBlog.Shared/TheBlog.Shared.csproj
```

### Bước 2: Chạy các Microservices

Mở terminal riêng cho từng thư mục sau và chạy `dotnet run`:

1.  **AuthService**: `services/AuthService` (Port `5230`)
2.  **UserService**: `services/UserService` (Port `5091`)
3.  **ChatService**: `services/ChatService` (Port `5017`)
4.  **RecommendPostService**: `services/RecommendPostService` (Port `5051`)

### Bước 3: Chạy API Gateway (Quan trọng)

Thành phần này điều hướng mọi yêu cầu từ Front-end:

```bash
cd gateway/ApiGateway && dotnet run
```

Gateway chạy tại: `http://localhost:5001`.

### Bước 4: Chạy Front-end

```bash
cd front-end
npm install
npm run dev
```

Giao diện người dùng sẽ chạy tại: `http://localhost:5173`.

## 5. Bản đồ cổng dịch vụ (Port Mapping)

| Service               | Port   | Swagger UI                      |
| :-------------------- | :----- | :------------------------------ |
| **API Gateway**       | `5001` | `http://localhost:5001/swagger` |
| **Auth Service**      | `5230` | `http://localhost:5230/swagger` |
| **User Service**      | `5091` | `http://localhost:5091/swagger` |
| **Chat Service**      | `5017` | `http://localhost:5017/swagger` |
| **Recommend Service** | `5051` | `http://localhost:5051/swagger` |

---

**Lưu ý:** Nếu bạn gặp lỗi liên quan đến `TheBlog.Shared.dll` đang bị sử dụng, hãy chạy script `./dev-stop.ps1` để tắt sạch các tiến trình dotnet cũ trước khi khởi động lại.

<img src="../doc-img/doc.png" alt="Docker Screenshot" width="100%">

## 6. Deployment

- Lệnh Docker Compose để chạy toàn bộ dự án bằng một image Docker (The-Blog-Project): `docker-compose -f docker-compose.yml up -d`

  > Tuy nhiên, cách này yêu cầu phần cứng mạnh mẽ và không phù hợp với hướng Microservice (không có kiến trúc phân tán mà chỉ dồn vào một cục image duy nhất - giống Monolithic).
- Vì thế mà:
  > Tôi đã chuẩn bị sẵn một dự án thay thế cho giải pháp đơn giản hơn, tối ưu chi phí triển khai hơn, ngay [tại đây.](https://github.com/TrHgTung/the-social-project)