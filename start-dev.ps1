
Write-Host "🚀 Starting LensClear Development Environment..." -ForegroundColor Cyan

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Error "Backend directory not found! Please run this script from the project root."
    exit 1
}

# Start Backend in a new terminal window
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Green
try {
    Start-Process -FilePath "cmd" -ArgumentList "/k title LensClear Backend && npm run dev" -WorkingDirectory "backend"
}
catch {
    Write-Error "Failed to start backend process: $_"
    exit 1
}

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend in current window
Write-Host "Starting Frontend (Port 5173)..." -ForegroundColor Green
npm run dev
