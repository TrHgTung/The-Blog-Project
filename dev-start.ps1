# Script khởi động nhanh môi trường phát triển
Write-Host "Running script..." -ForegroundColor Cyan

# Lấy đường dẫn tuyệt đối của thư mục chứa script
$ProjectRoot = $PSScriptRoot

# Kiểm tra thư mục backend
if (Test-Path "$ProjectRoot\backend") {
    Write-Host "Starting Backend (dotnet watch)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\backend'; dotnet watch"
} else {
    Write-Warning "Backend source not found at $ProjectRoot\backend"
}

# Kiểm tra thư mục frontend
if (Test-Path "$ProjectRoot\frontend") {
    Write-Host "Starting Frontend (npm run dev)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\frontend'; npm run dev"
} else {
    Write-Warning "Frontend source not found at $ProjectRoot\frontend"
}

Write-Host "Please check on http://localhost:3000 > Now you can close this terminal, but dont close others, if you close them, the program will stop" -ForegroundColor Cyan
