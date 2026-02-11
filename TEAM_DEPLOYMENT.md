# 🚀 LensClear Team Deployment Guide

Welcome! This guide will help you deploy and test the LensClear IoT platform on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have:

### Required Software
- **Docker Desktop** 20.10 or higher
  - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

### System Requirements
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 5GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **Ports**: 5000, 1883, 5173, 27017 must be available

### Verify Installation

```bash
# Check Docker
docker --version
# Should show: Docker version 20.10.x or higher

# Check Docker Compose
docker-compose --version
# Should show: Docker Compose version 2.x or higher

# Ensure Docker is running
docker ps
# Should show running containers or empty list (not an error)
```

---

## 🎯 Quick Start (Recommended)

### Option 1: Using Pre-built Images (Fastest - 2 minutes)

If you received a distribution package with an `images/` folder:

**Windows:**
```powershell
.\deploy-team.ps1
```

**Mac/Linux:**
```bash
chmod +x deploy-team.sh
./deploy-team.sh
```

That's it! The script will:
1. ✅ Check prerequisites
2. ✅ Load Docker images
3. ✅ Configure environment
4. ✅ Start all services
5. ✅ Verify deployment
6. ✅ Open the application in your browser

### Option 2: Building from Source (10 minutes)

If you have the source code without pre-built images:

**Windows:**
```powershell
# The script will automatically build if images are not found
.\deploy-team.ps1
```

**Mac/Linux:**
```bash
chmod +x deploy-team.sh
./deploy-team.sh
```

---

## 🌐 Access the Application

After successful deployment:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main web interface |
| **Backend API** | http://localhost:5000/health | API health check |
| **MQTT Broker** | mqtt://localhost:1883 | IoT device communication |
| **MongoDB** | mongodb://localhost:27017 | Database (internal) |

---

## 🔍 Verify Deployment

### Automated Health Check

**Windows:**
```powershell
.\health-check.ps1
```

**Mac/Linux:**
```bash
./health-check.sh
```

Expected output:
```
✓ All containers running (3/3)
✓ MongoDB is responding
✓ Backend API is healthy
✓ Frontend is accessible
✓ MQTT port 1883 is open
All Systems Healthy! ✓
```

### Manual Verification

1. **Check containers are running:**
   ```bash
   docker-compose ps
   ```
   All services should show "Up" status

2. **Test backend API:**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"ok","mongodb":"connected"}`

3. **Open frontend:**
   Visit http://localhost:5173 in your browser

---

## 📝 Testing the Application

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for complete testing instructions.

### Quick Test

1. **Open frontend**: http://localhost:5173
2. **Register a test device**:
   - Click "Add Device"
   - Enter Device ID: `TEST_001`
   - Enter Name: `Test Device`
   - Click "Register"
3. **Verify device appears** in the device list
4. **Check logs** for device registration activity

---

## 🛠️ Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Check Status
```bash
docker-compose ps
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Services
```bash
docker-compose stop
```

### Start Services
```bash
docker-compose start
```

### Full Cleanup

**Windows:**
```powershell
.\cleanup.ps1
```

**Mac/Linux:**
```bash
./cleanup.sh
```

This will:
- Stop all containers
- Remove containers
- Optionally remove data volumes
- Optionally remove Docker images

---

## 🐛 Troubleshooting

### Issue: "Docker is not running"

**Solution:**
- Start Docker Desktop
- Wait for it to fully initialize (whale icon in system tray)
- Try deployment again

### Issue: "Port already in use"

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution:**
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :5000

# Mac/Linux:
lsof -i :5000

# Stop the conflicting service or change ports in .env file
```

### Issue: "Services won't start"

**Solution:**
```bash
# Check logs
docker-compose logs

# Try full cleanup and redeploy
.\cleanup.ps1  # Windows
./cleanup.sh   # Mac/Linux

# Then redeploy
.\deploy-team.ps1  # Windows
./deploy-team.sh   # Mac/Linux
```

### Issue: "MongoDB connection failed"

**Solution:**
```bash
# Check MongoDB container
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Wait 30 seconds, then check health
.\health-check.ps1  # Windows
./health-check.sh   # Mac/Linux
```

### Issue: "Frontend shows blank page"

**Solution:**
1. Check browser console for errors (F12)
2. Verify backend is running: http://localhost:5000/health
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try incognito/private mode

### Issue: "Images failed to load"

**Solution:**
```bash
# If using pre-built images, verify checksums
cd images
# Windows:
Get-FileHash *.tar -Algorithm SHA256

# Mac/Linux:
sha256sum -c checksums.txt

# If checksums don't match, request fresh images
```

### Issue: "Build failed"

**Solution:**
```bash
# Clean Docker build cache
docker builder prune -a

# Try building again
docker-compose build --no-cache
```

---

## 📊 Resource Usage

Expected resource consumption:

| Service | CPU | RAM | Disk |
|---------|-----|-----|------|
| MongoDB | ~5% | ~200MB | ~500MB |
| Backend | ~3% | ~150MB | ~300MB |
| Frontend | ~1% | ~50MB | ~100MB |
| **Total** | **~10%** | **~400MB** | **~1GB** |

---

## 🔄 Updating the Application

If you receive an updated distribution package:

1. **Stop current deployment:**
   ```bash
   docker-compose down
   ```

2. **Load new images:**
   **Windows:**
   ```powershell
   docker load -i images\lensclear-backend.tar
   docker load -i images\lensclear-frontend.tar
   ```

   **Mac/Linux:**
   ```bash
   docker load -i images/lensclear-backend.tar
   docker load -i images/lensclear-frontend.tar
   ```

3. **Restart services:**
   ```bash
   docker-compose up -d
   ```

---

## 🧹 Cleanup After Testing

When you're done testing:

1. **Stop services:**
   ```bash
   docker-compose down
   ```

2. **Remove data (optional):**
   ```bash
   docker-compose down -v
   ```

3. **Remove images (optional):**
   ```bash
   docker rmi lensclear-backend:latest
   docker rmi lensclear-frontend:latest
   docker rmi mongo:6.0
   ```

Or use the cleanup script:
```bash
.\cleanup.ps1  # Windows
./cleanup.sh   # Mac/Linux
```

---

## 📞 Getting Help

### Check Documentation
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing instructions
- [DOCKER.md](DOCKER.md) - Advanced Docker configuration
- [README.md](README.md) - Project overview

### Common Solutions
1. **Restart Docker Desktop**
2. **Run cleanup script and redeploy**
3. **Check logs**: `docker-compose logs -f`
4. **Verify ports are available**
5. **Ensure sufficient disk space**

### Report Issues

If you encounter problems:
1. Run health check: `.\health-check.ps1` or `./health-check.sh`
2. Collect logs: `docker-compose logs > logs.txt`
3. Note your OS and Docker version
4. Contact the development team with this information

---

## 🎓 Next Steps

After successful deployment:

1. ✅ Complete the testing checklist in [TESTING_GUIDE.md](TESTING_GUIDE.md)
2. ✅ Explore the web interface
3. ✅ Try registering test devices
4. ✅ Test creating triggers and commands
5. ✅ Review logs and monitoring features
6. ✅ Provide feedback to the development team

---

## 📝 Notes

- **Data Persistence**: Database data is stored in Docker volumes and persists between restarts
- **Configuration**: Environment variables are in `.env` file (auto-created)
- **Logs**: Access logs via `docker-compose logs` command
- **Performance**: First startup may take 30-60 seconds for services to initialize

---

**Happy Testing! 🚀**

For questions or issues, contact the LensClear development team.
