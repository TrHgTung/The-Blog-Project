# Script to stop infrastructure containers for The Blog Project
# 1. Stopping infrastructure (Redis, RabbitMQ)
# (Note: .NET service windows can be closed manually by hand)

Write-Host "Stopping Docker (Infrastructure)..." -ForegroundColor Cyan
docker-compose -f docker-compose-infra.yml stop

Write-Host "`nInfrastructure stopped. (Laragon MySQL remains untouched)" -ForegroundColor Yellow
Write-Host "You can close the individual .NET windows manually or restart 'start-dev.ps1' to run them again." -ForegroundColor Gray
