# Lệnh chạy tất cả các services và ứng dụng frontend

Write-Host "Starting API Gateway..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "dotnet" -ArgumentList "run --project gateway/ApiGateway"

Write-Host "Starting AuthService..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "dotnet" -ArgumentList "run --project services/AuthService"

Write-Host "Starting UserService..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "dotnet" -ArgumentList "run --project services/UserService"

Write-Host "Starting ChatService..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "dotnet" -ArgumentList "run --project services/ChatService"

Write-Host "Starting RecommendPostService..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "dotnet" -ArgumentList "run --project services/RecommendPostService"

Write-Host "Starting Frontend..." -ForegroundColor Green
Set-Location -Path "front-end"
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev"

Write-Host "All services are starting..." -ForegroundColor Cyan
