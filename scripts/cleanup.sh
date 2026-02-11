#!/bin/bash

# ============================================
# LensClear - Cleanup Script
# ============================================
# Purpose: Stop and remove all containers and optionally volumes
# Usage: ./cleanup.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}LensClear - Cleanup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml not found in current directory${NC}"
    exit 1
fi

# Step 1: Stop containers
echo -e "${YELLOW}[1/3] Stopping containers...${NC}"
docker-compose stop 2>/dev/null || echo -e "${YELLOW}⚠ No running containers found${NC}"
echo -e "${GREEN}✓ Containers stopped${NC}"

# Step 2: Remove containers
echo ""
echo -e "${YELLOW}[2/3] Removing containers...${NC}"
docker-compose down 2>/dev/null || echo -e "${YELLOW}⚠ No containers to remove${NC}"
echo -e "${GREEN}✓ Containers removed${NC}"

# Step 3: Ask about volumes
echo ""
echo -e "${YELLOW}[3/3] Data cleanup...${NC}"
echo ""
echo -e "${RED}⚠ WARNING: This will delete all database data!${NC}"
read -p "Do you want to remove volumes (database data)? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down -v 2>/dev/null
    echo -e "${GREEN}✓ Volumes removed${NC}"
else
    echo -e "${GREEN}✓ Volumes preserved${NC}"
fi

# Optional: Remove images
echo ""
read -p "Do you want to remove Docker images? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing images...${NC}"
    docker rmi lensclear-backend:latest -f 2>/dev/null || true
    docker rmi lensclear-frontend:latest -f 2>/dev/null || true
    echo -e "${GREEN}✓ Images removed${NC}"
else
    echo -e "${GREEN}✓ Images preserved${NC}"
fi

# Display summary
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Cleanup Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}To redeploy, run:${NC}"
if [ -f "deploy-team.sh" ]; then
    echo -e "${NC}  ./deploy-team.sh${NC}"
else
    echo -e "${NC}  docker-compose up -d${NC}"
fi
echo ""
