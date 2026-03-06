# Script to run services locally (Optimizing for low-resource environments)
# 1. Microservices & Gateway: Running via 'dotnet run' in separate windows
# 2. Infrastructure (Redis, RabbitMQ): Running via Docker
# 3. MySQL: Managed via Laragon (Localhost:3306)

$root = Get-Location
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   THE BLOG PROJECT - DEV STARTUP SCRIPT   " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Start Infrastructure (RabbitMQ & Redis only)
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Docker is not installed. Please install Docker for Redis/RabbitMQ." -ForegroundColor Red
} else {
    Write-Host "`n[1/3] Starting RabbitMQ and Redis (Infrastructure)..." -ForegroundColor Yellow
    docker-compose -f docker-compose-infra.yml up -d
}

# 2. Wait for infrastructure to stabilize
Write-Host "`n[2/3] Waiting for infrastructure to initialize (5s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Start Each Service in a new terminal window
# This way you don't overwhelm your CPU/RAM with Docker building, and you can see logs easily.
function Start-ServiceWindow {
    param($RelativePath, $Name)
    $fullPath = Join-Path $root $RelativePath
    Write-Host "[-] Launching $Name..." -ForegroundColor Green
    
    # Try using Windows Terminal (wt) first for a better UX, fallback to standard PowerShell
    if (Get-Command wt -ErrorAction SilentlyContinue) {
        # Using Windows Terminal with a title
        Start-Process wt -ArgumentList "-d `"$fullPath`" powershell -NoExit -Command `"Write-Host '--- $Name ---' -ForegroundColor Cyan; dotnet run`""
    } else {
        # Fallback to standard PowerShell windows
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$fullPath`"; Write-Host '--- $Name ---' -ForegroundColor Cyan; dotnet run"
    }
}

Write-Host "`n[3/3] Starting .NET Microservices & Gateway..." -ForegroundColor Yellow
Start-ServiceWindow "services\AuthService" "AuthService"
Start-ServiceWindow "services\UserService" "UserService"
Start-ServiceWindow "services\ChatService" "ChatService"
Start-ServiceWindow "services\RecommendPostService" "RecommendPostService"
Start-ServiceWindow "gateway\ApiGateway" "ApiGateway"

# 4. Starting Frontend (Vite)
Write-Host "[-] Launching Frontend..." -ForegroundColor Green
$fePath = Join-Path $root "front-end"
if (Get-Command wt -ErrorAction SilentlyContinue) {
    Start-Process wt -ArgumentList "-d `"$fePath`" powershell -NoExit -Command `"Write-Host '--- Front-end (Vite) ---' -ForegroundColor Cyan; npm run dev`""
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$fePath`"; Write-Host '--- Front-end (Vite) ---' -ForegroundColor Cyan; npm run dev"
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host " ALL SERVICES ARE STARTING IN SEPARATE WINDOWS " -ForegroundColor Green
Write-Host " - Infrastructure: Redis & RabbitMQ (Docker)" -ForegroundColor White
Write-Host " - Database: MySQL (Laragon - Should be running!)" -ForegroundColor White
Write-Host " - Frontend UI: http://localhost:5173 (usually)" -ForegroundColor White
Write-Host " - API Gateway: http://localhost:5001" -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Enjoy coding! You can close individual windows to stop a service." -ForegroundColor Gray
