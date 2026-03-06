# Script duy nhất để khởi chạy toàn bộ hệ thống (Infrastructure + Microservices + Frontend)
# Sử dụng Docker Compose để đảm bảo môi trường đồng nhất và ổn định

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   THE BLOG PROJECT RUNNING SCRIPT   " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Kiểm tra Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Please install and run Docker before running this script" -ForegroundColor Red
    exit 1
}

# 2. Dừng các container cũ nếu đang chạy (tránh xung đột)
Write-Host "`n[1/3] Cleaning up old containers..." -ForegroundColor Yellow
docker-compose down

# 3. Khởi động hệ thống (Build và chạy ngầm)
# Lệnh này sẽ tự động:
# - Build Dockerfile cho 4 Microservices, 1 Gateway và Frontend
# - Khởi tạo MySQL, Redis, RabbitMQ với cấu hình đã thiết lập
Write-Host "`n[2/3] Building and starting all services (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose up --build -d

# 4. Kiểm tra trạng thái
Write-Host "`n[3/3] System Status:" -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host " SYSTEM IS ON:" -ForegroundColor Green
Write-Host " - Frontend UI      : http://localhost:80" -ForegroundColor White
Write-Host " - API Gateway      : http://localhost:5001" -ForegroundColor White
Write-Host " - Swagger UI       : http://localhost:5001/swagger" -ForegroundColor White
Write-Host " - RabbitMQ         : http://localhost:15672 (guest/guest)" -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Type 'docker-compose logs -f' to view real-time logs of the services." -ForegroundColor Gray
