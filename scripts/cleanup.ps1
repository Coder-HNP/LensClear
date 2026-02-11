# LensClear - Cleanup Script
# Usage: .\cleanup.ps1

Write-Host "LensClear - Cleanup" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop Containers
Write-Host "[1/3] Stopping containers..." -ForegroundColor Yellow
docker-compose stop
Write-Host "Containers stopped." -ForegroundColor Green

# 2. Remove Containers
Write-Host ""
Write-Host "[2/3] Removing containers..." -ForegroundColor Yellow
docker-compose down
Write-Host "Containers removed." -ForegroundColor Green

# 3. Force Cleanup (Safety Net)
Write-Host "Ensuring complete cleanup..." -ForegroundColor Gray
docker rm -f lensclear-mongodb lensclear-backend lensclear-frontend 2>$null

# 4. Optional Data/Images
Write-Host ""
Write-Host "[3/3] Data cleanup..." -ForegroundColor Yellow
$response = Read-Host "Remove database data? (y/N)"
if ($response -eq "y") {
    docker-compose down -v
    Write-Host "Volumes removed." -ForegroundColor Green
} else {
    Write-Host "Volumes preserved." -ForegroundColor Green
}

Write-Host ""
$response = Read-Host "Remove Docker images? (y/N)"
if ($response -eq "y") {
    Write-Host "Removing images..." -ForegroundColor Yellow
    docker rmi lensclear-backend:latest -f 2>$null
    docker rmi lensclear-frontend:latest -f 2>$null
    docker rmi mongo:6.0 -f 2>$null
    Write-Host "Images removed." -ForegroundColor Green
} else {
    Write-Host "Images preserved." -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "To start again run: .\deploy-team.ps1" -ForegroundColor White
Write-Host ""
