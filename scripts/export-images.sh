#!/bin/bash

# ============================================
# LensClear - Export Docker Images Script
# ============================================
# Purpose: Build and export Docker images for team distribution
# Usage: ./scripts/export-images.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}LensClear - Export Docker Images${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Configuration
DISTRIBUTION_DIR="lensclear-distribution"
IMAGES_DIR="$DISTRIBUTION_DIR/images"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

# Step 1: Check Docker is installed
echo -e "${YELLOW}[1/6] Checking Docker installation...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker found: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}✗ Docker not found. Please install Docker.${NC}"
    exit 1
fi

# Step 2: Create distribution directory
echo ""
echo -e "${YELLOW}[2/6] Creating distribution directory...${NC}"
if [ -d "$DISTRIBUTION_DIR" ]; then
    echo -e "${GRAY}  Cleaning existing distribution directory...${NC}"
    rm -rf "$DISTRIBUTION_DIR"
fi
mkdir -p "$IMAGES_DIR"
echo -e "${GREEN}✓ Distribution directory created${NC}"

# Step 3: Build Docker images
echo ""
echo -e "${YELLOW}[3/6] Building Docker images...${NC}"
echo -e "${GRAY}  This may take 5-10 minutes...${NC}"

echo -e "${GRAY}  Building backend image...${NC}"
docker-compose build backend

echo -e "${GRAY}  Building frontend image...${NC}"
docker-compose build frontend

echo -e "${GREEN}✓ All images built successfully${NC}"

# Step 4: Pull MongoDB image
echo ""
echo -e "${YELLOW}[4/6] Pulling MongoDB image...${NC}"
docker pull mongo:6.0
echo -e "${GREEN}✓ MongoDB image pulled${NC}"

# Step 5: Export images to tar files
echo ""
echo -e "${YELLOW}[5/6] Exporting images to tar files...${NC}"

echo -e "${GRAY}  Exporting backend image...${NC}"
docker save -o "$IMAGES_DIR/lensclear-backend.tar" lensclear-backend:latest

echo -e "${GRAY}  Exporting frontend image...${NC}"
docker save -o "$IMAGES_DIR/lensclear-frontend.tar" lensclear-frontend:latest

echo -e "${GRAY}  Exporting MongoDB image...${NC}"
docker save -o "$IMAGES_DIR/mongo-6.0.tar" mongo:6.0

echo -e "${GREEN}✓ All images exported${NC}"

# Step 6: Create checksums
echo ""
echo -e "${YELLOW}[6/6] Creating checksums...${NC}"
CHECKSUM_FILE="$IMAGES_DIR/checksums.txt"
cd "$IMAGES_DIR"
sha256sum *.tar > checksums.txt
cd "$PROJECT_ROOT"
echo -e "${GREEN}✓ Checksums created${NC}"

# Copy necessary files to distribution
echo ""
echo -e "${YELLOW}Copying distribution files...${NC}"
cp docker-compose.yml "$DISTRIBUTION_DIR/"
cp .env.docker "$DISTRIBUTION_DIR/.env.example"
[ -f "TEAM_DEPLOYMENT.md" ] && cp TEAM_DEPLOYMENT.md "$DISTRIBUTION_DIR/"
[ -f "TESTING_GUIDE.md" ] && cp TESTING_GUIDE.md "$DISTRIBUTION_DIR/"
[ -f "scripts/deploy-team.ps1" ] && cp scripts/deploy-team.ps1 "$DISTRIBUTION_DIR/"
[ -f "scripts/deploy-team.sh" ] && cp scripts/deploy-team.sh "$DISTRIBUTION_DIR/"
[ -f "scripts/cleanup.ps1" ] && cp scripts/cleanup.ps1 "$DISTRIBUTION_DIR/"
[ -f "scripts/cleanup.sh" ] && cp scripts/cleanup.sh "$DISTRIBUTION_DIR/"
[ -f "scripts/health-check.ps1" ] && cp scripts/health-check.ps1 "$DISTRIBUTION_DIR/"
[ -f "scripts/health-check.sh" ] && cp scripts/health-check.sh "$DISTRIBUTION_DIR/"

# Make scripts executable
chmod +x "$DISTRIBUTION_DIR"/*.sh 2>/dev/null || true

# Create README for distribution
cat > "$DISTRIBUTION_DIR/README.md" << 'EOF'
# LensClear IoT Platform - Distribution Package

## Quick Start

### Windows
```powershell
.\deploy-team.ps1
```

### Mac/Linux
```bash
chmod +x deploy-team.sh
./deploy-team.sh
```

## What's Included

- Pre-built Docker images (backend, frontend, MongoDB)
- Deployment scripts for easy setup
- Health check scripts
- Cleanup scripts
- Complete documentation

## System Requirements

- Docker Desktop 20.10+
- 4GB RAM minimum
- 5GB free disk space
- Windows 10/11, macOS 10.15+, or Linux

## Access Points

After deployment:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/health
- MQTT Broker: mqtt://localhost:1883

## Documentation

- **TEAM_DEPLOYMENT.md** - Complete deployment guide
- **TESTING_GUIDE.md** - Testing instructions

## Support

For issues, check TEAM_DEPLOYMENT.md troubleshooting section.
EOF

echo -e "${GREEN}✓ Distribution files copied${NC}"

# Display summary
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Export Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${NC}Distribution package created in: $DISTRIBUTION_DIR${NC}"
echo ""
echo -e "${YELLOW}Package contents:${NC}"
find "$DISTRIBUTION_DIR" -type f -exec ls -lh {} \; | awk '{print "  " $9 " - " $5}'

TOTAL_SIZE=$(du -sh "$DISTRIBUTION_DIR" | awk '{print $1}')
echo ""
echo -e "${CYAN}Total package size: $TOTAL_SIZE${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${NC}  1. Share the '$DISTRIBUTION_DIR' folder with your team${NC}"
echo -e "${NC}  2. Teammates run: ./deploy-team.sh (Mac/Linux) or .\\deploy-team.ps1 (Windows)${NC}"
echo -e "${NC}  3. Application will be accessible at http://localhost:5173${NC}"
echo ""
