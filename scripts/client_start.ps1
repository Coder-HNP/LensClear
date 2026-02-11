# Client Deployment Script
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting LensClear IoT System..." -ForegroundColor Cyan

# 1. Load Images
Write-Host "📦 Loading Docker Images (this may take a minute)..." -ForegroundColor Yellow

if (Test-Path "lensclear-backend.tar") {
    Write-Host "   - Loading Backend..."
    docker load -i lensclear-backend.tar
} else {
    Write-Warning "Backend image tar not found. Assuming pulled from registry or already loaded."
}

if (Test-Path "lensclear-frontend.tar") {
    Write-Host "   - Loading Frontend..."
    docker load -i lensclear-frontend.tar
} else {
    Write-Warning "Frontend image tar not found."
}

# 2. Start System
Write-Host "▶️  Starting Services..." -ForegroundColor Yellow
docker compose up -d

Write-Host "`n✅ System Started Successfully!" -ForegroundColor Green
Write-Host "   - Dashboard: http://localhost"
Write-Host "   - API:       http://localhost:5000"
Write-Host "   - MQTT:      localhost:1883"
