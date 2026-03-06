# Script to stop infrastructure containers and .NET services for The Blog Project

Write-Host "Stopping .NET Services & Frontend..." -ForegroundColor Yellow
Stop-Process -Name dotnet -Force -ErrorAction SilentlyContinue 
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

Write-Host "Stopping Docker (Infrastructure)..." -ForegroundColor Cyan
docker-compose -f docker-compose-infra.yml stop

Write-Host "`nEnvironment stopped successfully." -ForegroundColor Green
Write-Host "You can now run '.\dev-start.ps1' to restart everything." -ForegroundColor Gray
