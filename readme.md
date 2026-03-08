# Hướng dẫn Setup và Chạy Dự án Dev/Test (The Blog Project)

Tài liệu này hướng dẫn bạn cách thiết lập môi trường và chạy toàn bộ hệ thống microservices.

## 1. Yêu cầu Hệ thống (Prerequisites)

- **Docker Desktop**: để chạy các container nhanh chóng, đã được cấu hình sẵn image trong các file script
- **Postman**: Để test API.
- **Laragon**: cài đặt MySQL trên Windows
- **Windows PowerShell**: Để chạy script
- **NodeJS**: Để chạy frontend
- **.NET SDK**: môi trường để chạy source NET Core

## 2. Lệnh khởi chạy
### 2.1. Nếu máy mạnh (hoặc là VPS production):
> Dùng Windows PowerShell để chạy version dev/test
```bash
.\dockerize-all.ps1
```
=> Lệnh này cũng chính là để đóng gói mọi thứ đem lên chạy production

### 2.2. Nếu máy yếu (là máy dev/tester):
> Dùng Windows PowerShell để chạy version dev/test

- Lệnh build:
```bash
.\build-all.ps1
```
- Lệnh chạy:
```bash
.\dev-start.ps1
```

## 3. Địa chỉ truy cập
- Check URL, các endpoints trong Docker Log, vì tùy trường hợp lựa chọn tại bước 2.1 hoặc 2.2.

<img src="./doc-img/doc.png" alt="Docker Screenshott">
