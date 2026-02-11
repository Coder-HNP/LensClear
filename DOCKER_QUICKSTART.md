# 🐳 Docker Quick Reference - LensClear

## Quick Start

```bash
# 1. Setup environment
cp .env.docker .env
# Edit .env and change JWT_SECRET!

# 2. Build and start
docker-compose build
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/health
- **MQTT Broker**: mqtt://localhost:1883
- **MongoDB**: mongodb://localhost:27017/lensclear

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Check health
docker-compose ps

# Rebuild
docker-compose build --no-cache

# Clean everything (WARNING: Deletes data!)
docker-compose down -v
```

## ESP32 Configuration

1. Find your computer's IP:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Update firmware:
   ```cpp
   const char* MQTT_SERVER = "192.168.1.100";  // Your IP
   const char* MQTT_PORT = 1883;
   ```

3. Register device in frontend and get auth token

4. Upload to ESP32

## Troubleshooting

**Services won't start?**
```bash
docker-compose logs [service_name]
```

**MongoDB connection failed?**
```bash
docker-compose exec mongodb mongosh --eval "db.runCommand({ping: 1})"
```

**Backend health check failing?**
```bash
curl http://localhost:5000/health
```

**Need to reset everything?**
```bash
docker-compose down -v
docker-compose up -d
```

## File Structure

```
lensclear-project/
├── docker-compose.yml      # Service orchestration
├── Dockerfile.frontend     # Frontend image
├── .dockerignore          # Frontend build exclusions
├── .env.docker            # Environment template
├── .env                   # Your configuration (create this!)
├── DOCKER.md              # Full documentation
├── nginx.conf             # Nginx configuration
└── backend/
    ├── Dockerfile         # Backend image
    └── .dockerignore      # Backend build exclusions
```

## Production Checklist

- [ ] Change `JWT_SECRET` to secure random string
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS/TLS with reverse proxy
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Enable monitoring
- [ ] Review security in DOCKER.md

---

**📖 Full documentation**: See [DOCKER.md](DOCKER.md)
