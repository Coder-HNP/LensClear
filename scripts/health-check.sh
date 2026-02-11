#!/bin/bash

# ============================================
# LensClear - Health Check Script
# ============================================
# Purpose: Verify all services are running correctly
# Usage: ./health-check.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}LensClear - Health Check${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

ALL_HEALTHY=true

# Check 1: Docker containers
echo -e "${YELLOW}[1/5] Checking Docker containers...${NC}"
RUNNING_COUNT=0

for service in mongodb backend frontend; do
    STATUS=$(docker-compose ps --format json | jq -r ".[] | select(.Service==\"$service\") | .State" 2>/dev/null)
    if [ "$STATUS" = "running" ]; then
        echo -e "  ${GREEN}✓ $service - Running${NC}"
        RUNNING_COUNT=$((RUNNING_COUNT + 1))
    else
        echo -e "  ${RED}✗ $service - $STATUS${NC}"
        ALL_HEALTHY=false
    fi
done

if [ $RUNNING_COUNT -eq 3 ]; then
    echo -e "${GREEN}✓ All containers running (3/3)${NC}"
else
    echo -e "${RED}✗ Some containers not running ($RUNNING_COUNT/3)${NC}"
    ALL_HEALTHY=false
fi

# Check 2: MongoDB
echo ""
echo -e "${YELLOW}[2/5] Checking MongoDB...${NC}"
if docker-compose exec -T mongodb mongosh --eval "db.runCommand({ping: 1})" --quiet &>/dev/null; then
    echo -e "${GREEN}✓ MongoDB is responding${NC}"
else
    echo -e "${RED}✗ MongoDB is not responding${NC}"
    ALL_HEALTHY=false
fi

# Check 3: Backend API
echo ""
echo -e "${YELLOW}[3/5] Checking Backend API...${NC}"
BACKEND_RESPONSE=$(curl -sf http://localhost:5000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend API is healthy${NC}"
    STATUS=$(echo $BACKEND_RESPONSE | jq -r '.status' 2>/dev/null)
    MONGODB=$(echo $BACKEND_RESPONSE | jq -r '.mongodb' 2>/dev/null)
    echo -e "  ${GRAY}Status: $STATUS${NC}"
    echo -e "  ${GRAY}MongoDB: $MONGODB${NC}"
else
    echo -e "${RED}✗ Backend API is not accessible${NC}"
    ALL_HEALTHY=false
fi

# Check 4: Frontend
echo ""
echo -e "${YELLOW}[4/5] Checking Frontend...${NC}"
if curl -sf http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible${NC}"
    ALL_HEALTHY=false
fi

# Check 5: MQTT Port
echo ""
echo -e "${YELLOW}[5/5] Checking MQTT Broker...${NC}"
if nc -z localhost 1883 2>/dev/null || timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/1883' 2>/dev/null; then
    echo -e "${GREEN}✓ MQTT port 1883 is open${NC}"
else
    echo -e "${RED}✗ MQTT port 1883 is not accessible${NC}"
    ALL_HEALTHY=false
fi

# Display summary
echo ""
echo -e "${CYAN}========================================${NC}"
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}All Systems Healthy! ✓${NC}"
else
    echo -e "${RED}Some Issues Detected! ✗${NC}"
fi
echo -e "${CYAN}========================================${NC}"
echo ""

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${YELLOW}Access Points:${NC}"
    echo -e "${NC}  Frontend:    http://localhost:5173${NC}"
    echo -e "${NC}  Backend API: http://localhost:5000/health${NC}"
    echo -e "${NC}  MQTT Broker: mqtt://localhost:1883${NC}"
    echo ""
else
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "${NC}  1. Check logs: docker-compose logs -f${NC}"
    echo -e "${NC}  2. Restart services: docker-compose restart${NC}"
    echo -e "${NC}  3. Full reset: ./cleanup.sh then ./deploy-team.sh${NC}"
    echo ""
    exit 1
fi
