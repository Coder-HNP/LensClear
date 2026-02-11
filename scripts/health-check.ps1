# ============================================
# LensClear - Health Check Script
# ============================================
# Purpose: Verify all services are running correctly
# Usage: .\health-check.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LensClear - Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check 1: Docker containers
Write-Host "[1/5] Checking Docker containers..." -ForegroundColor Yellow
try {
    $containers = docker-compose ps --format json | ConvertFrom-Json
    $runningCount = 0
    
    foreach ($container in $containers) {
        $status = $container.State
        if ($status -eq "running") {
            Write-Host "  ✓ $($container.Service) - Running" -ForegroundColor Green
            $runningCount++
        } else {
            Write-Host "  ✗ $($container.Service) - $status" -ForegroundColor Red
            $allHealthy = $false
        }
    }
    
    if ($runningCount -eq 3) {
        Write-Host "✓ All containers running (3/3)" -ForegroundColor Green
    } else {
        Write-Host "✗ Some containers not running ($runningCount/3)" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "✗ Failed to check containers: $_" -ForegroundColor Red
    $allHealthy = $false
}

# Check 2: MongoDB
Write-Host ""
Write-Host "[2/5] Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoCheck = docker-compose exec -T mongodb mongosh --eval "db.runCommand({ping: 1})" --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MongoDB is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ MongoDB is not responding" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "✗ MongoDB check failed" -ForegroundColor Red
    $allHealthy = $false
}

# Check 3: Backend API
Write-Host ""
Write-Host "[3/5] Checking Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $health = $response.Content | ConvertFrom-Json
        Write-Host "✓ Backend API is healthy" -ForegroundColor Green
        Write-Host "  Status: $($health.status)" -ForegroundColor Gray
        Write-Host "  MongoDB: $($health.mongodb)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Backend API returned status $($response.StatusCode)" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "✗ Backend API is not accessible" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
    $allHealthy = $false
}

# Check 4: Frontend
Write-Host ""
Write-Host "[4/5] Checking Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend returned status $($response.StatusCode)" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "✗ Frontend is not accessible" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
    $allHealthy = $false
}

# Check 5: MQTT Port
Write-Host ""
Write-Host "[5/5] Checking MQTT Broker..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 1883)
    $tcpClient.Close()
    Write-Host "✓ MQTT port 1883 is open" -ForegroundColor Green
} catch {
    Write-Host "✗ MQTT port 1883 is not accessible" -ForegroundColor Red
    $allHealthy = $false
}

# Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "All Systems Healthy! ✓" -ForegroundColor Green
} else {
    Write-Host "Some Issues Detected! ✗" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allHealthy) {
    Write-Host "Access Points:" -ForegroundColor Yellow
    Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor White
    Write-Host "  Backend API: http://localhost:5000/health" -ForegroundColor White
    Write-Host "  MQTT Broker: mqtt://localhost:1883" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "  2. Restart services: docker-compose restart" -ForegroundColor White
    Write-Host "  3. Full reset: .\cleanup.ps1 then .\deploy-team.ps1" -ForegroundColor White
    Write-Host ""
}

if (-not $allHealthy) {
    exit 1
}
