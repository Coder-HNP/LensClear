# LensClear - Team Deployment Script
# Usage: .\deploy-team.ps1

Write-Host "LensClear - Team Deployment" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Prerequisites
Write-Host "[1/7] Checking Docker..." -ForegroundColor Yellow
try {
    $ver = docker --version
    Write-Host "Docker found: $ver" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# 2. Check Images
Write-Host ""
Write-Host "[2/7] Checking images..." -ForegroundColor Yellow
$useLocal = $false
if (Test-Path "images") {
    Write-Host "Images directory found." -ForegroundColor Green
    $useLocal = $true
} else {
    Write-Host "Images not found. Will build from source." -ForegroundColor Yellow
}

# 3. Load/Build
Write-Host ""
if ($useLocal) {
    Write-Host "[3/7] Loading images (this may take time)..." -ForegroundColor Yellow
    try {
        docker load -i "images\mongo-6.0.tar" 2>$null
        docker load -i "images\lensclear-backend.tar" 2>$null
        docker load -i "images\lensclear-frontend.tar" 2>$null
        Write-Host "Images loaded." -ForegroundColor Green
    } catch {
        Write-Host "Warning: Failed to load some images. Proceeding..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[3/7] Building images..." -ForegroundColor Yellow
    docker-compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed." -ForegroundColor Red
        exit 1
    }
}

# 4. Config Environment
Write-Host ""
Write-Host "[4/7] Configuring environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env from example." -ForegroundColor Green
    } else {
        # Simple default .env content
        $content = "PORT=5000`nMONGODB_URI=mongodb://mongodb:27017/lensclear`nJWT_SECRET=team_secret`nMQTT_PORT=1883`nFRONTEND_URL=http://localhost:5173`nENABLE_MQTT=true`nVITE_API_URL=/api`nVITE_SOCKET_URL=http://localhost:5173"
        Set-Content -Path ".env" -Value $content
        Write-Host "Created default .env." -ForegroundColor Green
    }
} else {
    Write-Host ".env already exists." -ForegroundColor Green
}

# 5. Cleanup
Write-Host ""
Write-Host "[5/7] Stopping old containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Force remove by name to avoid conflicts from other folders
Write-Host "Ensuring clean slate..." -ForegroundColor Gray
docker rm -f lensclear-mongodb lensclear-backend lensclear-frontend 2>$null


# 6. Start
Write-Host ""
Write-Host "[6/7] Starting services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start services." -ForegroundColor Red
    exit 1
}

# 7. Wait
Write-Host ""
Write-Host "[7/7] Waiting for services (30s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend:  http://localhost:5000/health" -ForegroundColor White

Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
