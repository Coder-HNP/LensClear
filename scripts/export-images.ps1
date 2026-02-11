# LensClear - Export Docker Images Script
# Usage: .\scripts\export-images.ps1

Write-Host "LensClear - Export Docker Images" -ForegroundColor Cyan

# 0. Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $ver = docker --version
    Write-Host "Docker found: $ver" -ForegroundColor Green
    
    # Check if daemon is actually running
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon not running"
    }
} catch {
    Write-Host "Error: Docker is not running or not installed." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

$DISTRIBUTION_DIR = "lensclear-distribution"
$IMAGES_DIR = "$DISTRIBUTION_DIR\images"

# 1. Create directory
if (Test-Path $DISTRIBUTION_DIR) {
    Remove-Item -Path $DISTRIBUTION_DIR -Recurse -Force
}
New-Item -ItemType Directory -Path $IMAGES_DIR -Force | Out-Null
Write-Host "Created distribution directory." -ForegroundColor Green

# 2. Build images
Write-Host "Building images... (this may take time)" -ForegroundColor Yellow
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

# 3. Pull Mongo
Write-Host "Pulling MongoDB..." -ForegroundColor Yellow
docker pull mongo:6.0

# 4. Export images
Write-Host "Exporting images to tar files..." -ForegroundColor Yellow
docker save -o "$IMAGES_DIR\lensclear-backend.tar" lensclear-backend:latest
docker save -o "$IMAGES_DIR\lensclear-frontend.tar" lensclear-frontend:latest
docker save -o "$IMAGES_DIR\mongo-6.0.tar" mongo:6.0

# 5. Checksums
Write-Host "Creating checksums..." -ForegroundColor Yellow
$checksumFile = "$IMAGES_DIR\checksums.txt"
Get-ChildItem "$IMAGES_DIR\*.tar" | ForEach-Object {
    $hash = Get-FileHash $_.FullName -Algorithm SHA256
    "$($_.Name): $($hash.Hash)" | Out-File -Append -FilePath $checksumFile
}

# 6. Copy files
Copy-Item "docker-compose.yml" -Destination $DISTRIBUTION_DIR
Copy-Item ".env.docker" -Destination "$DISTRIBUTION_DIR\.env.example"
Copy-Item "TEAM_DEPLOYMENT.md" -Destination $DISTRIBUTION_DIR -ErrorAction SilentlyContinue
Copy-Item "TESTING_GUIDE.md" -Destination $DISTRIBUTION_DIR -ErrorAction SilentlyContinue
Copy-Item "scripts\deploy-team.ps1" -Destination "$DISTRIBUTION_DIR\deploy-team.ps1" -ErrorAction SilentlyContinue
Copy-Item "scripts\install-client.ps1" -Destination "$DISTRIBUTION_DIR\install.ps1" -ErrorAction SilentlyContinue
Copy-Item "scripts\deploy-team.sh" -Destination "$DISTRIBUTION_DIR\deploy-team.sh" -ErrorAction SilentlyContinue
Copy-Item "scripts\cleanup.ps1" -Destination "$DISTRIBUTION_DIR\cleanup.ps1" -ErrorAction SilentlyContinue
Copy-Item "scripts\cleanup.sh" -Destination "$DISTRIBUTION_DIR\cleanup.sh" -ErrorAction SilentlyContinue
Copy-Item "scripts\health-check.ps1" -Destination "$DISTRIBUTION_DIR\health-check.ps1" -ErrorAction SilentlyContinue
Copy-Item "scripts\health-check.sh" -Destination "$DISTRIBUTION_DIR\health-check.sh" -ErrorAction SilentlyContinue

Write-Host "Export Complete!" -ForegroundColor Green
Write-Host "Folder: $DISTRIBUTION_DIR" -ForegroundColor White
Write-Host "Share this folder with your team." -ForegroundColor White
