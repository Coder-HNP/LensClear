# LensClear - Client Installation Script
# Usage: ./install.ps1

Write-Host "LensClear - Client Installation" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
try {
    $ver = docker --version
    Write-Host "Docker found: $ver" -ForegroundColor Green
    
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
} catch {
    Write-Host "Error: Docker is not running or not installed." -ForegroundColor Red
    Write-Host "Please install Docker Desktop and start it." -ForegroundColor Red
    exit 1
}

# 2. Load Images
Write-Host ""
Write-Host "[2/4] Loading Software (this may take a few minutes)..." -ForegroundColor Yellow
if (Test-Path "images") {
    $images = Get-ChildItem "images\*.tar"
    foreach ($img in $images) {
        Write-Host "Loading $($img.Name)..." -ForegroundColor Gray
        docker load -i $img.FullName
    }
    Write-Host "Software loaded successfully." -ForegroundColor Green
} else {
    Write-Host "Error: 'images' folder not found!" -ForegroundColor Red
    exit 1
}

# 3. Start Application
Write-Host ""
Write-Host "[3/4] Starting Application..." -ForegroundColor Yellow
# Stop existing if running
docker-compose down 2>$null

# Start
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "Application started!" -ForegroundColor Green
} else {
    Write-Host "Failed to start application. Check if port 80 or 5000 are in use." -ForegroundColor Red
    exit 1
}

# 4. Finalizing
Write-Host ""
Write-Host "[4/4] Finalizing..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""
Write-Host "SUCCESS! LensClear is running." -ForegroundColor Green
Write-Host "Access it here: http://localhost" -ForegroundColor Cyan

Start-Sleep -Seconds 2
Start-Process "http://localhost"
