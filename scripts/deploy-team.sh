#!/bin/bash

# ============================================
# LensClear - Team Deployment Script
# ============================================
# Purpose: One-command deployment for teammates
# Usage: ./deploy-team.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}LensClear - Team Deployment${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Step 1: Check Docker is installed
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker found: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}✗ Docker not found. Please install Docker from:${NC}"
    echo -e "${NC}  https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓ Docker Compose found: $COMPOSE_VERSION${NC}"
else
    echo -e "${RED}✗ Docker Compose not found.${NC}"
    exit 1
fi

# Check if Docker is running
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running. Please start Docker.${NC}"
    exit 1
fi

# Step 2: Check for images directory
echo ""
echo -e "${YELLOW}[2/7] Checking for Docker images...${NC}"
if [ -d "images" ]; then
    echo -e "${GREEN}✓ Images directory found${NC}"
    USE_LOCAL_IMAGES=true
else
    echo -e "${YELLOW}⚠ Images directory not found. Will build from source.${NC}"
    USE_LOCAL_IMAGES=false
fi

# Step 3: Load or build images
echo ""
if [ "$USE_LOCAL_IMAGES" = true ]; then
    echo -e "${YELLOW}[3/7] Loading Docker images...${NC}"
    echo -e "${GRAY}  This may take a few minutes...${NC}"
    
    echo -e "${GRAY}  Loading MongoDB image...${NC}"
    docker load -i images/mongo-6.0.tar
    
    echo -e "${GRAY}  Loading backend image...${NC}"
    docker load -i images/lensclear-backend.tar
    
    echo -e "${GRAY}  Loading frontend image...${NC}"
    docker load -i images/lensclear-frontend.tar
    
    echo -e "${GREEN}✓ All images loaded successfully${NC}"
else
    echo -e "${YELLOW}[3/7] Building Docker images...${NC}"
    echo -e "${GRAY}  This may take 5-10 minutes...${NC}"
    
    docker-compose build
    echo -e "${GREEN}✓ Images built successfully${NC}"
fi

# Step 4: Create .env file
echo ""
echo -e "${YELLOW}[4/7] Configuring environment...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    else
        # Create default .env
        cat > .env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/lensclear
JWT_SECRET=team_testing_secret_change_in_production
MQTT_PORT=1883
FRONTEND_URL=http://localhost:5173
ENABLE_MQTT=true
VITE_API_URL=/api
VITE_SOCKET_URL=http://localhost:5173
EOF
        echo -e "${GREEN}✓ Created default .env file${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 5: Stop any existing containers
echo ""
echo -e "${YELLOW}[5/7] Cleaning up existing containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Step 6: Start services
echo ""
echo -e "${YELLOW}[6/7] Starting services...${NC}"
echo -e "${GRAY}  Starting MongoDB, Backend, and Frontend...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ All services started${NC}"

# Step 7: Wait for services to be healthy
echo ""
echo -e "${YELLOW}[7/7] Waiting for services to be ready...${NC}"
echo -e "${GRAY}  This may take 30-60 seconds...${NC}"

MAX_WAIT=120
WAITED=0
ALL_HEALTHY=false

while [ $WAITED -lt $MAX_WAIT ] && [ "$ALL_HEALTHY" = false ]; do
    sleep 5
    WAITED=$((WAITED + 5))
    
    # Check if backend is responding
    if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
        ALL_HEALTHY=true
    else
        echo -e "${GRAY}  Waiting for services to be ready...${NC}"
    fi
done

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ All services are healthy${NC}"
else
    echo -e "${YELLOW}⚠ Services started but may still be initializing${NC}"
fi

# Display success message
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Access the application:${NC}"
echo -e "${NC}  Frontend:    http://localhost:5173${NC}"
echo -e "${NC}  Backend API: http://localhost:5000/health${NC}"
echo -e "${NC}  MQTT Broker: mqtt://localhost:1883${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "${NC}  View logs:        docker-compose logs -f${NC}"
echo -e "${NC}  Check status:     docker-compose ps${NC}"
echo -e "${NC}  Stop services:    docker-compose down${NC}"
echo -e "${NC}  Restart:          docker-compose restart${NC}"
[ -f "health-check.sh" ] && echo -e "${NC}  Health check:     ./health-check.sh${NC}"
[ -f "cleanup.sh" ] && echo -e "${NC}  Full cleanup:     ./cleanup.sh${NC}"
echo ""
echo -e "${CYAN}Happy testing! 🚀${NC}"
echo ""
