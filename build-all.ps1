# =========================================================
#   THE BLOG PROJECT - BUILD INDIVIDUAL SERVICES
# =========================================================

$ErrorActionPreference = "Continue" # Continue to next build if one fails, or keep Stop if you want to halt
$rootPath = Get-Location

$projects = @(
    "shared/TheBlog.Shared",
    "gateway/ApiGateway",
    "services/AuthService",
    "services/UserService",
    "services/ChatService",
    "services/RecommendPostService"
)

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "   BUILDING PROJECTS INDIVIDUALLY" -ForegroundColor Cyan
Write-Host "=========================================================`n" -ForegroundColor Cyan

$startTime = Get-Date
$failedProjects = @()

foreach ($projDir in $projects) {
    if (Test-Path $projDir) {
        Write-Host ">>> Building in directory: $projDir" -ForegroundColor Yellow
        
        Push-Location $projDir
        try {
            dotnet build --configuration Debug
            if ($LASTEXITCODE -ne 0) {
                $failedProjects += $projDir
                Write-Host "!!! Build FAILED in $projDir" -ForegroundColor Red
            } else {
                Write-Host "### Build SUCCESS in $projDir" -ForegroundColor Green
            }
        }
        catch {
            $failedProjects += $projDir
            Write-Host "!!! Critical error building $projDir" -ForegroundColor Red
        }
        Pop-Location
        Write-Host "---------------------------------------------------------`n"
    } else {
        Write-Host "!!! Path not found: $projDir" -ForegroundColor Red
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "=========================================================" -ForegroundColor Cyan
if ($failedProjects.Count -eq 0) {
    Write-Host "   ALL BUILDS COMPLETED SUCCESSFULLY" -ForegroundColor Green
} else {
    Write-Host "   BUILDS COMPLETED WITH ERRORS" -ForegroundColor Red
    Write-Host "   Failed projects:" -ForegroundColor Red
    foreach ($f in $failedProjects) {
        Write-Host "   - $f" -ForegroundColor Red
    }
}
Write-Host "   Total time: $($duration.TotalSeconds.ToString("F2")) seconds" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
