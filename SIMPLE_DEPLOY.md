# 🚀 LensClear - Simple Deployment Guide

## Quick Start (Recommended)

The easiest way to run LensClear with Docker:

### Step 1: Build the containers
```powershell
docker-compose build
```
**Note**: This may take 5-10 minutes on first run.

### Step 2: Start the containers
```powershell
docker-compose up -d
```

### Step 3: Access the application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/health
- **MQTT Broker**: mqtt://localhost:1883

---

## Common Commands

### View logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Check status
```powershell
docker-compose ps
```

### Stop containers
```powershell
docker-compose down
```

### Restart containers
```powershell
docker-compose restart
```

### Rebuild (after code changes)
```powershell
docker-compose build
docker-compose up -d
```

---

## Troubleshooting

### Build takes too long?
If the build is taking more than 10 minutes, you can:

1. **Check Docker resources**: Increase CPU/Memory in Docker Desktop settings
2. **Clear cache**: `docker builder prune -a`
3. **Build individually**:
   ```powershell
   docker-compose build backend
   docker-compose build frontend
   ```

### Containers won't start?
```powershell
# Check logs
docker-compose logs

# Remove and restart
docker-compose down
docker-compose up -d
```

### Port conflicts?
If ports 5000, 5173, 1883, or 27017 are in use:
```powershell
# Find what's using the port (Windows)
netstat -ano | findstr :5000

# Stop the conflicting service or modify docker-compose.yml ports
```

---

## For Teammates

Share this folder with teammates. They just need to:

1. Install Docker Desktop
2. Run `docker-compose up -d`
3. Access http://localhost:5173

That's it! 🎉
