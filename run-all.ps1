# Lệnh chạy tất cả các services và ứng dụng frontend cho The Blog Project

Write-Host "Developed Running Script" -ForegroundColor Cyan

# 1. Build toàn bộ projects để đảm bảo không có lỗi biên dịch
Write-Host "`n[1/4] Compiling project..." -ForegroundColor Yellow
dotnet build --nologo -v q
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error while building" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Đảm bảo Infrastructure (Redis, RabbitMQ) đang chạy bằng Docker
Write-Host "`n[2/4] Checking infrastructure (Redis, RabbitMQ)..." -ForegroundColor Yellow
docker-compose -f docker-compose-infra.yml up -d

# 3. Hàm để chạy service trong cửa sổ cmd mới (giúp dễ xem log riêng biệt)
function Start-ServiceWindow {
    param (
        [string]$Name,
        [string]$Path
    )
    Write-Host "Running $Name..." -ForegroundColor Green
    # "/k" giữ cửa sổ mở sau khi chạy xong để xem log nếu có lỗi
    Start-Process cmd -ArgumentList "/k title $Name && cd $Path && dotnet run --no-build"
}

# 4. Khởi chạy các API Services
Write-Host "`n[3/4] Starting all micro-services..." -ForegroundColor Yellow
Start-ServiceWindow "API Gateway" "gateway/ApiGateway"
Start-ServiceWindow "AuthService" "services/AuthService"
Start-ServiceWindow "UserService" "services/UserService"
Start-ServiceWindow "ChatService" "services/ChatService"
Start-ServiceWindow "RecommendPostService" "services/RecommendPostService"

# 5. Khởi chạy Frontend
Write-Host "`n[4/4] Starting Frontend UI..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k title Frontend && cd front-end && npm run dev"

Write-Host "`nEverything is runnign" -ForegroundColor Cyan
Write-Host "Make sure Laragon MySQL is running on port 3306" -ForegroundColor Magenta
