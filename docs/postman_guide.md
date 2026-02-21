# Hướng dẫn Test API với Postman

Tài liệu này hướng dẫn cách test các API thông qua Ocelot Gateway.

## 1. Cấu hình Environment trong Postman

Để thuận tiện, hãy tạo một Environment trong Postman với biến:
- `baseUrl`: `https://localhost:5001` (Địa chỉ của API Gateway)

## 2. Luồng Test Cơ bản

### A. Authentication (AuthService)
Trước tiên, bạn cần đăng ký và đăng nhập để lấy JWT Token.

1.  **Đăng ký tài khoản**:
    - Method: `POST`
    - URL: `{{baseUrl}}/api/auth-service/Auth/register`
    - Body (JSON):
      ```json
      {
        "username": "testuser",
        "email": "test@example.com",
        "password": "YourPassword123!"
      }
      ```

2.  **Đăng nhập**:
    - Method: `POST`
    - URL: `{{baseUrl}}/api/auth-service/Auth/login`
    - Body (JSON):
      ```json
      {
        "username": "testuser",
        "password": "YourPassword123!"
      }
      ```
    - **Lưu ý**: Sau khi login thành công, copy `token` trả về.

### B. Sử dụng Token (Authorization)
Trong Postman, chuyển sang tab **Authorization**:
- Type: `Bearer Token`
- Token: Dán token bạn vừa copy vào đây.

### C. Quản lý Post (UserService qua Gateway)
1.  **Lấy danh sách Post theo Topic**:
    - Method: `GET`
    - URL: `{{baseUrl}}/api/user-service/PostTopic/all-posts/{topicId}`

2.  **Tạo bài viết mới**:
    - Method: `POST`
    - URL: `{{baseUrl}}/api/user-service/PostTopic/create-post`
    - Body (JSON):
      ```json
      {
        "postTitle": "Bài viết test",
        "postContent": "Nội dung bài viết...",
        "topicId": "UUID-CỦA-TOPIC"
      }
      ```

### D. Trending Score (RecommendPostService)
Hiện tại `RecommendPostService` chưa được config trong Ocelot (file `ocelot.json`), bạn có thể gọi trực tiếp hoặc thêm vào Ocelot.
- Method: `POST` (Giả định qua RabbitMQ hoặc gọi trực tiếp Helper nếu có Controller)
- URL trực tiếp: `http://localhost:5051/api/...`

> [!IMPORTANT]
> Mọi request đi qua Gateway đều bắt đầu bằng prefix đã định nghĩa trong `ocelot.json` (ví dụ `/api/user-service/`).
