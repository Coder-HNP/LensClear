# 🐳 Docker Deployment Guide - LensClear IoT Platform

This guide covers deploying the LensClear IoT platform using Docker and Docker Compose.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Services Overview](#services-overview)
- [Development vs Production](#development-vs-production)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [ESP32 Configuration](#esp32-configuration)
- [Scaling](#scaling)

---

## 🔧 Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **System Requirements**:
  - 2GB RAM minimum (4GB recommended)
  - 5GB free disk space
  - Ports available: 5000, 1883, 5173, 27017

### Install Docker

**Windows/Mac**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### 1. Clone and Configure

```bash
# Navigate to project directory
cd lensclear-project

# Create environment file
cp .env.docker .env

# Edit .env with your configuration
# IMPORTANT: Change JWT_SECRET in production!
```

### 2. Build and Start Services

```bash
# Build all images
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Verify Deployment

```bash
# Check service status
docker-compose ps

# Should show all services as "healthy"
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/health
- **MongoDB**: mongodb://localhost:27017/lensclear
- **MQTT Broker**: mqtt://localhost:1883

---

## ⚙️ Configuration

### Environment Variables

The `.env` file controls all configuration. Key variables:

#### Backend
```env
PORT=5000                                    # Backend API port
MONGODB_URI=mongodb://mongodb:27017/lensclear # MongoDB connection
JWT_SECRET=your_secure_secret_here           # CHANGE IN PRODUCTION!
MQTT_PORT=1883                               # MQTT broker port
FRONTEND_URL=http://localhost:5173           # Frontend URL for CORS
ENABLE_MQTT=true                             # Enable/disable MQTT broker
```

#### Frontend
```env
VITE_API_URL=/api                            # API endpoint (proxied by Nginx)
VITE_SOCKET_URL=http://localhost:5173        # Socket.io connection URL
```

#### MongoDB (Optional - Production)
```env
MONGO_INITDB_ROOT_USERNAME=admin             # MongoDB admin user
MONGO_INITDB_ROOT_PASSWORD=secure_password   # MongoDB admin password
```

### Production Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string (32+ characters)
- [ ] Enable MongoDB authentication
- [ ] Use environment-specific `.env` files
- [ ] Don't commit `.env` to version control
- [ ] Use Docker secrets for sensitive data
- [ ] Enable firewall rules for exposed ports
- [ ] Use HTTPS/TLS in production (reverse proxy)

---

## 🏗️ Services Overview

### MongoDB (Database)
- **Image**: `mongo:6.0`
- **Port**: 27017
- **Volume**: `mongodb_data` (persistent storage)
- **Healthcheck**: Ping database every 30s

### Backend (Node.js API + MQTT Broker)
- **Image**: `lensclear-backend:latest`
- **Ports**: 
  - 5000 (HTTP API)
  - 1883 (MQTT Broker)
- **Dependencies**: MongoDB
- **Healthcheck**: HTTP GET /health every 30s

### Frontend (React + Nginx)
- **Image**: `lensclear-frontend:latest`
- **Port**: 5173 → 80 (host → container)
- **Dependencies**: Backend
- **Healthcheck**: HTTP GET / every 30s

### Network
- **Name**: `lensclear-network`
- **Type**: Bridge network
- **Purpose**: Isolate services and enable DNS resolution

---

## 🔄 Development vs Production

### Development Setup

For development with hot reload:

```bash
# Use local development servers instead of Docker
cd backend && npm run dev
cd .. && npm run dev
```

Docker is recommended for:
- Testing production builds
- Consistent environment across team
- CI/CD pipelines

### Production Deployment

#### Option 1: Docker Compose (Single Server)

```bash
# Build for production
docker-compose build --no-cache

# Start services
docker-compose up -d

# Monitor logs
docker-compose logs -f backend frontend
```

#### Option 2: Docker Swarm (Multi-Server)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml lensclear

# Check services
docker service ls
```

#### Option 3: Kubernetes

See `k8s/` directory for Kubernetes manifests (if available).

---

## 📝 Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f [service_name]

# Check service status
docker-compose ps
```

### Building

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend

# Build without cache
docker-compose build --no-cache

# Pull latest base images
docker-compose pull
```

### Data Management

```bash
# Backup MongoDB data
docker-compose exec mongodb mongodump --out=/data/backup
docker cp lensclear-mongodb:/data/backup ./backup

# Restore MongoDB data
docker cp ./backup lensclear-mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup

# Clear all data (WARNING: Destructive!)
docker-compose down -v
```

### Debugging

```bash
# Execute command in running container
docker-compose exec backend sh
docker-compose exec mongodb mongosh

# View container resource usage
docker stats

# Inspect container
docker inspect lensclear-backend

# View container logs
docker logs lensclear-backend --tail 100 -f
```

---

## 🐛 Troubleshooting

### Services Won't Start

**Check logs**:
```bash
docker-compose logs backend
docker-compose logs mongodb
```

**Common issues**:
- Port already in use: Change ports in `.env`
- MongoDB not ready: Wait for healthcheck to pass
- Build errors: Run `docker-compose build --no-cache`

### MongoDB Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Test connection
docker-compose exec mongodb mongosh --eval "db.runCommand({ping: 1})"

# Check network
docker network inspect lensclear-network
```

### Backend Health Check Failing

```bash
# Check backend logs
docker-compose logs backend

# Test health endpoint manually
curl http://localhost:5000/health

# Restart backend
docker-compose restart backend
```

### Frontend Not Loading

```bash
# Check Nginx logs
docker-compose logs frontend

# Verify build completed
docker-compose exec frontend ls -la /usr/share/nginx/html

# Check Nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### MQTT Connection Issues

```bash
# Test MQTT broker
docker-compose exec backend nc -zv localhost 1883

# Check if MQTT is enabled
docker-compose exec backend printenv ENABLE_MQTT

# View MQTT logs (in backend logs)
docker-compose logs backend | grep MQTT
```

### Container Keeps Restarting

```bash
# Check exit code and logs
docker-compose ps
docker-compose logs [service_name]

# Disable auto-restart for debugging
docker-compose up --no-start
docker-compose start [service_name]
```

---

## 📡 ESP32 Configuration

### Network Configuration

When using Docker, the backend is accessible at:
- **Local machine**: `localhost` or `127.0.0.1`
- **Same network**: Your computer's IP address (e.g., `192.168.1.100`)

### Update ESP32 Firmware

```cpp
// In firmware/lensclear_esp32/lensclear_esp32.ino

const char* MQTT_SERVER = "192.168.1.100";  // Your computer's IP
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "ESP32_001";
const char* AUTH_TOKEN = "your_device_token_from_frontend";
```

### Find Your Computer's IP

**Windows**:
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac/Linux**:
```bash
ifconfig
# or
ip addr show
```

### Testing MQTT Connection

```bash
# Install MQTT client
npm install -g mqtt

# Subscribe to test topic
mqtt sub -h localhost -p 1883 -t "lensclear/#" -v

# Publish test message
mqtt pub -h localhost -p 1883 -t "lensclear/test" -m "Hello"
```

---

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Note: You'll need a load balancer (e.g., Nginx, HAProxy)
```

### Vertical Scaling (Resource Limits)

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Production Recommendations

- Use **Docker Swarm** or **Kubernetes** for orchestration
- Implement **load balancing** for multiple backend instances
- Use **MongoDB replica set** for high availability
- Enable **monitoring** (Prometheus, Grafana)
- Set up **automated backups** for MongoDB
- Use **reverse proxy** (Nginx, Traefik) with SSL/TLS

---

## 🔒 Security Best Practices

1. **Never use default secrets in production**
2. **Enable MongoDB authentication**
3. **Use Docker secrets** for sensitive data
4. **Implement rate limiting** on API endpoints
5. **Use HTTPS/TLS** with reverse proxy
6. **Regular security updates**: `docker-compose pull && docker-compose up -d`
7. **Limit exposed ports** to only what's necessary
8. **Use non-root users** in containers
9. **Scan images for vulnerabilities**: `docker scan lensclear-backend`

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)
- [LensClear Setup Guide](SETUP_GUIDE.md)

---

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review service logs: `docker-compose logs -f`
3. Verify configuration in `.env`
4. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for general setup help
5. Ensure all prerequisites are met

---

**Built with 🐳 Docker for easy deployment**

[⬆ Back to Top](#-docker-deployment-guide---lensclear-iot-platform)
