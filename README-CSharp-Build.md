# Hướng dẫn Build C# / .NET cho The-Blog-Project

## 📋 Mục lục
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt .NET SDK](#cài-đặt-net-sdk)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Build cơ bản](#build-cơ-bản)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Entity Framework Migrations](#entity-framework-migrations)
- [Debug với VS Code](#debug-với-vs-code)
- [Commands hữu ích](#commands-hữu-ích)

---

## Yêu cầu hệ thống

- **.NET 9 SDK** (bắt buộc)
- **MySQL 8.0** hoặc cao hơn
- **IDE**: Visual Studio 2022, VS Code, hoặc JetBrains Rider

---

## Cài đặt .NET SDK

### macOS (Homebrew)
```bash
# Cài đặt .NET 9 SDK
brew install dotnet@9

# Hoặc cài phiên bản mới nhất
brew install dotnet

# Kiểm tra cài đặt
dotnet --version
```

### macOS (Installer)
1. Tải từ: https://dotnet.microsoft.com/download/dotnet/9.0
2. Chạy file `.pkg` và làm theo hướng dẫn

### Windows
```powershell
# Sử dụng winget
winget install Microsoft.DotNet.SDK.9

# Hoặc tải installer từ
# https://dotnet.microsoft.com/download/dotnet/9.0
```

### Linux (Ubuntu/Debian)
```bash
# Thêm Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Cài đặt SDK
sudo apt-get update
sudo apt-get install -y dotnet-sdk-9.0
```

### Kiểm tra cài đặt
```bash
# Kiểm tra version
dotnet --version

# Xem thông tin chi tiết
dotnet --info
```

---

## Cấu trúc dự án

```
The-Blog-Project/
├── The-Blog-Project.sln          # Solution file (chứa tất cả projects)
└── services/
    ├── AuthService/              # Service xác thực
    │   ├── AuthService.csproj    # Project file
    │   ├── Program.cs            # Entry point
    │   ├── Controllers/          # API Controllers
    │   ├── Models/               # Entity models
    │   ├── Data/                 # DbContext
    │   ├── Dto/                  # Data Transfer Objects
    │   ├── Helper/               # Helper classes
    │   ├── Migrations/           # EF Core migrations
    │   └── appsettings.json      # Configuration
    ├── PostService/
    ├── NewsFeedService/
    └── UserService/
```

---

## Build cơ bản

### Build toàn bộ Solution
```bash
# Từ thư mục root của project
cd /Users/hungdoan/Documents/The-Blog-Project

# Restore NuGet packages
dotnet restore

# Build solution
dotnet build

# Build với configuration Release
dotnet build -c Release
```

### Build từng Service riêng lẻ
```bash
# Build AuthService
dotnet build services/AuthService/AuthService.csproj

# Build PostService
dotnet build services/PostService/PostService.csproj

# Build với verbose output
dotnet build -v detailed
```

### Clean build artifacts
```bash
# Xóa thư mục bin/ và obj/
dotnet clean

# Xóa và rebuild
dotnet clean && dotnet build
```

---

## Chạy ứng dụng

### Chạy từng Service

```bash
# Chạy AuthService (cổng 4401)
cd services/AuthService
dotnet run

# Chạy với hot reload (tự động restart khi code thay đổi)
dotnet watch run

# Chạy với môi trường cụ thể
dotnet run --environment Development
dotnet run --environment Production
```

### Chạy với port tùy chỉnh
```bash
# Sử dụng biến môi trường
ASPNETCORE_URLS="http://localhost:5000" dotnet run

# Hoặc trong appsettings.json
# "Urls": "http://localhost:5000"
```

### Chạy nhiều services cùng lúc (Terminal tabs)
```bash
# Terminal 1 - AuthService
cd services/AuthService && dotnet run

# Terminal 2 - PostService  
cd services/PostService && dotnet run

# Terminal 3 - UserService
cd services/UserService && dotnet run
```

---

## Entity Framework Migrations

### Cài đặt EF Core Tools (chỉ cần 1 lần)
```bash
# Cài đặt global tool
dotnet tool install --global dotnet-ef

# Cập nhật tool
dotnet tool update --global dotnet-ef

# Kiểm tra version
dotnet ef --version
```

### Tạo Migration mới
```bash
cd services/AuthService

# Tạo migration với tên mô tả
dotnet ef migrations add TenMigration

# Ví dụ: thêm trường mới
dotnet ef migrations add AddPhoneNumberToUser

# Với DbContext cụ thể (nếu có nhiều)
dotnet ef migrations add TenMigration --context DataContext
```

### Áp dụng Migrations
```bash
# Chạy tất cả migrations chưa áp dụng
dotnet ef database update

# Chạy đến migration cụ thể
dotnet ef database update TenMigration

# Rollback về migration trước
dotnet ef database update MigrationTruoc
```

### Xem danh sách Migrations
```bash
# Liệt kê tất cả migrations
dotnet ef migrations list

# Xem SQL sẽ được generate (không chạy)
dotnet ef migrations script
```

### Xóa Migration (chưa áp dụng)
```bash
# Xóa migration cuối cùng
dotnet ef migrations remove
```

### Tạo Database từ đầu
```bash
# Xóa database
dotnet ef database drop

# Tạo lại database và chạy migrations
dotnet ef database update
```

---

## Debug với VS Code

### Cài đặt Extensions cần thiết
1. **C# Dev Kit** (Microsoft)
2. **C#** (Microsoft)
3. **.NET Install Tool** (Microsoft)

### Cấu hình launch.json
Tạo file `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch AuthService",
            "type": "coreclr",
            "request": "launch",
            "preLaunchTask": "build-auth",
            "program": "${workspaceFolder}/services/AuthService/bin/Debug/net9.0/AuthService.dll",
            "args": [],
            "cwd": "${workspaceFolder}/services/AuthService",
            "console": "integratedTerminal",
            "stopAtEntry": false,
            "env": {
                "ASPNETCORE_ENVIRONMENT": "Development"
            }
        },
        {
            "name": "Launch PostService",
            "type": "coreclr",
            "request": "launch",
            "preLaunchTask": "build-post",
            "program": "${workspaceFolder}/services/PostService/bin/Debug/net9.0/PostService.dll",
            "args": [],
            "cwd": "${workspaceFolder}/services/PostService",
            "console": "integratedTerminal",
            "stopAtEntry": false
        }
    ],
    "compounds": [
        {
            "name": "Launch All Services",
            "configurations": ["Launch AuthService", "Launch PostService"]
        }
    ]
}
```

### Cấu hình tasks.json
Tạo file `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "build-auth",
            "command": "dotnet",
            "type": "process",
            "args": [
                "build",
                "${workspaceFolder}/services/AuthService/AuthService.csproj",
                "/property:GenerateFullPaths=true",
                "/consoleloggerparameters:NoSummary"
            ],
            "problemMatcher": "$msCompile"
        },
        {
            "label": "build-post",
            "command": "dotnet",
            "type": "process",
            "args": [
                "build",
                "${workspaceFolder}/services/PostService/PostService.csproj",
                "/property:GenerateFullPaths=true",
                "/consoleloggerparameters:NoSummary"
            ],
            "problemMatcher": "$msCompile"
        },
        {
            "label": "build-all",
            "command": "dotnet",
            "type": "process",
            "args": [
                "build",
                "${workspaceFolder}/The-Blog-Project.sln"
            ],
            "problemMatcher": "$msCompile",
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}
```

---

## Commands hữu ích

### Package Management (NuGet)
```bash
# Thêm package
dotnet add package TenPackage
dotnet add package Microsoft.EntityFrameworkCore --version 9.0.0

# Xóa package
dotnet remove package TenPackage

# Liệt kê packages
dotnet list package

# Cập nhật packages
dotnet restore
```

### Publish (Deploy)
```bash
# Publish cho production
dotnet publish -c Release -o ./publish

# Self-contained (không cần cài .NET runtime)
dotnet publish -c Release -r linux-x64 --self-contained

# Single file executable
dotnet publish -c Release -r linux-x64 --self-contained -p:PublishSingleFile=true
```

### Testing
```bash
# Chạy tests
dotnet test

# Chạy tests với chi tiết
dotnet test -v detailed

# Chạy tests với coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Solution Management
```bash
# Tạo solution mới
dotnet new sln -n MySolution

# Thêm project vào solution
dotnet sln add services/NewProject/NewProject.csproj

# Xóa project khỏi solution
dotnet sln remove services/OldProject/OldProject.csproj

# Liệt kê projects trong solution
dotnet sln list
```

### Tạo Project mới
```bash
# Web API
dotnet new webapi -n MyNewService -o services/MyNewService

# Class Library
dotnet new classlib -n MyLibrary -o libs/MyLibrary

# Console App
dotnet new console -n MyConsoleApp

# Xem tất cả templates
dotnet new list
```

---

## Troubleshooting

### Lỗi "SDK not found"
```bash
# Kiểm tra SDK đã cài
dotnet --list-sdks

# Nếu không có, cài lại
brew reinstall dotnet
```

### Lỗi "Package restore failed"
```bash
# Clear NuGet cache
dotnet nuget locals all --clear

# Restore lại
dotnet restore
```

### Lỗi Database Connection
```bash
# Kiểm tra connection string trong appsettings.json
# Đảm bảo MySQL đang chạy
mysql -u root -p

# Test kết nối
dotnet ef database update --verbose
```

### Lỗi Port đã được sử dụng
```bash
# Tìm process đang dùng port
lsof -i :4401

# Kill process
kill -9 <PID>
```

---

## 🔗 Tài liệu tham khảo

- [.NET Documentation](https://docs.microsoft.com/dotnet)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [.NET CLI Reference](https://docs.microsoft.com/dotnet/core/tools)
