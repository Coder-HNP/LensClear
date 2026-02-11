# Build and Export Script for LensClear IoT System
$ErrorActionPreference = "Stop"

$deliveryFolder = "lensclear-delivery"
$imageFolder = "$deliveryFolder/images"

Write-Host "🚀 Starting Build Process..." -ForegroundColor Cyan

# 1. Create delivery directories
if (!(Test-Path $imageFolder)) {
    New-Item -ItemType Directory -Force -Path $imageFolder | Out-Null
}

# 2. Build Backend Image
Write-Host "📦 Building Backend Image..." -ForegroundColor Yellow
docker build -t lensclear-backend:latest ./backend

# 3. Build Frontend Image
Write-Host "🎨 Building Frontend Image..." -ForegroundColor Yellow
docker build -t lensclear-frontend:latest . `
  --build-arg VITE_API_URL=/api `
  --build-arg VITE_SOCKET_URL=/

# 4. Save Images to Tar
Write-Host "💾 Saving Images to ./$imageFolder/..." -ForegroundColor Yellow

Write-Host "   - Saving Backend..."
docker save -o "$imageFolder/lensclear-backend.tar" lensclear-backend:latest

Write-Host "   - Saving Frontend..."
docker save -o "$imageFolder/lensclear-frontend.tar" lensclear-frontend:latest

# 5. Copy necessary deployment files
Copy-Item "docker-compose.yml" -Destination "$deliveryFolder/"
Copy-Item "nginx.conf" -Destination "$deliveryFolder/"
Copy-Item "scripts/install-client.ps1" -Destination "$deliveryFolder/install.ps1"

Write-Host "✅ Build and Export Complete!" -ForegroundColor Green
Write-Host "   All files are in ./$deliveryFolder/"
Write-Host "   Zip this folder and send it to the client."
