# LensClear IoT Device Management System

<div align="center">

![LensClear](https://img.shields.io/badge/LensClear-IoT%20Platform-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green)
![ESP32](https://img.shields.io/badge/ESP32-DevKit-red)

**Production-ready IoT platform for ESP32-based lens cleaning devices with real-time monitoring, automation, and MQTT communication.**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture)

</div>

---

## 🌟 Features

### 🎛️ Device Management
- **Real-time Monitoring**: Live device status (online/offline/active/idle)
- **Remote Control**: Start/stop motors, adjust speed, run cleaning cycles
- **Multi-Device Support**: Manage unlimited ESP32 devices
- **Device Authentication**: Secure token-based device registration

### ⚡ Automation & Triggers
- **Immediate Triggers**: Execute actions instantly
- **Scheduled Triggers**: Daily, weekly, or one-time scheduled automation
- **Multi-Device Targeting**: Control multiple devices with single trigger
- **Custom Parameters**: Configure speed, duration, and more

### 📊 Sensor Data & Analytics
- **Real-time Sensor Readings**: Temperature, RPM, power consumption, vibration
- **Historical Data**: Time-series storage with 30-day retention
- **Live Graphs**: Chart.js visualizations updating every 5 seconds
- **Data Export**: Download sensor data for analysis

### 📝 Advanced Logging
- **Detailed Activity Logs**: Every action tracked with timestamps
- **Filtering & Search**: Filter by device, action, status, date range
- **Export Options**: CSV and PDF export for reporting
- **Response Time Tracking**: Monitor command execution performance

### 🔄 Real-time Communication
- **MQTT Protocol**: Efficient IoT messaging with QoS 1
- **Socket.io**: Instant frontend updates without polling
- **Auto-reconnection**: Robust connection handling
- **Command Acknowledgment**: Verify successful execution

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5.0+
- Arduino IDE 2.x (for ESP32)
- ESP32 DevKit board

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Start server
npm start
```

Backend runs on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to project root
cd lensclear-project

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. ESP32 Setup

1. Open `firmware/lensclear_esp32/lensclear_esp32.ino` in Arduino IDE
2. Install required libraries (PubSubClient, DHT, ArduinoJson)
3. Update WiFi credentials and MQTT server IP
4. Register device in frontend and copy auth token
5. Update `AUTH_TOKEN` in firmware
6. Upload to ESP32

**📖 Full setup guide**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Complete setup instructions for all components |
| [firmware/README.md](firmware/README.md) | ESP32 hardware wiring and firmware guide |
| [walkthrough.md](.gemini/antigravity/brain/.../walkthrough.md) | Implementation details and architecture |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React + Vite + Socket.io Client + Axios + Chart.js        │
│  Pages: Dashboard, Devices, Triggers, Logs, Settings       │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST + Socket.io
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  Node.js + Express + MongoDB + Socket.io + Aedes MQTT      │
│  Routes: Devices, Triggers, Commands, Logs                 │
│  Services: MQTT, Socket.io, Scheduler                       │
└────────────────┬────────────────────────────────────────────┘
                 │ MQTT (port 1883)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      ESP32 Devices                          │
│  WiFi + MQTT Client + DHT22 + Motor Control                │
│  Publishes: Sensor data, Status                            │
│  Subscribes: Commands, Configuration                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Express.js - Web framework
- MongoDB + Mongoose - Database
- Aedes - MQTT broker
- Socket.io - Real-time communication
- node-cron - Task scheduling

**Frontend:**
- React 19 - UI framework
- Vite - Build tool
- Axios - HTTP client
- Socket.io Client - Real-time updates
- Chart.js - Data visualization

**Hardware:**
- ESP32 DevKit - Microcontroller
- DHT22 - Temperature/humidity sensor
- L298N - Motor driver
- DC Motor - Lens cleaning actuator

---

## 📁 Project Structure

```
lensclear-project/
├── backend/                 # Node.js backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── services/           # MQTT, Socket.io, Scheduler
│   ├── middleware/         # Authentication
│   ├── utils/              # Helper functions
│   └── server.js           # Main server file
├── src/                    # React frontend
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── services/           # API and Socket.io clients
│   ├── context/            # React context providers
│   └── utils/              # Utility functions
├── firmware/               # ESP32 Arduino code
│   ├── lensclear_esp32/    # Main firmware
│   └── README.md           # Hardware guide
├── SETUP_GUIDE.md          # Setup instructions
└── README.md               # This file
```

---

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lensclear
JWT_SECRET=your_secret_key
MQTT_PORT=1883
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### ESP32 Configuration

```cpp
const char* WIFI_SSID = "YourWiFi";
const char* WIFI_PASSWORD = "YourPassword";
const char* MQTT_SERVER = "192.168.1.100";  // Backend IP
const char* DEVICE_ID = "ESP32_001";
const char* AUTH_TOKEN = "your_device_token";
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
npm test
```

### Manual Testing
1. Start backend and frontend
2. Register device in UI
3. Upload ESP32 firmware
4. Verify device shows "Online"
5. Send motor command
6. Check logs for execution

---

## 🚢 Deployment

### Backend (Render/Heroku)
1. Create MongoDB Atlas cluster
2. Deploy backend to Render
3. Set environment variables
4. Update frontend API URL

### Frontend (Vercel/Netlify)
1. Deploy to Vercel
2. Set environment variables
3. Update backend CORS settings

### ESP32 Production
1. Update MQTT server to production URL
2. Use static IP or domain
3. Implement OTA updates

---

## 🛠️ Development

### Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd lensclear-project && npm install
```

### Run Development Servers
```bash
# Backend (with auto-reload)
cd backend && npm run dev

# Frontend
cd lensclear-project && npm run dev
```

### Build for Production
```bash
# Frontend
npm run build

# Backend (no build needed, runs with Node.js)
```

---

## 📊 API Endpoints

### Devices
- `GET /api/devices` - List all devices
- `POST /api/devices` - Register new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/:id/sensors` - Get sensor data

### Triggers
- `GET /api/triggers` - List all triggers
- `POST /api/triggers` - Create trigger
- `PUT /api/triggers/:id` - Update trigger
- `DELETE /api/triggers/:id` - Delete trigger
- `POST /api/triggers/:id/execute` - Execute trigger

### Commands
- `POST /api/commands/send` - Send command to device
- `GET /api/commands/:id/status` - Get command status

### Logs
- `GET /api/logs` - Get logs (with filters)
- `POST /api/logs/export` - Export logs (CSV/PDF)

---

## 🔐 Security

- **Device Authentication**: Token-based MQTT authentication
- **API Authentication**: JWT tokens (Firebase Auth compatible)
- **CORS**: Configured for frontend origin
- **Input Validation**: All API inputs validated
- **Rate Limiting**: TODO for production

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongosh`
- Verify port 5000 is available
- Check environment variables in `.env`

### ESP32 won't connect
- Verify WiFi credentials
- Check MQTT server IP address
- Ensure firewall allows port 1883
- Verify auth token matches backend

### Device shows offline
- Check ESP32 Serial Monitor
- Verify MQTT connection successful
- Ensure deviceId matches registration

**Full troubleshooting guide**: See [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting)

---

## 🤝 Contributing

This is a production IoT system. For modifications:
1. Test locally first
2. Update documentation
3. Follow existing code style
4. Add error handling

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎯 Roadmap

- [x] Backend infrastructure
- [x] MQTT broker integration
- [x] ESP32 firmware
- [x] Triggers system
- [x] Real-time updates
- [x] Log export
- [ ] Firebase Admin SDK integration
- [ ] User roles and permissions
- [ ] Mobile app (React Native)
- [ ] OTA firmware updates
- [ ] Advanced analytics dashboard
- [ ] Email/SMS alerts

---

## 📞 Support

For issues or questions:
- Check [SETUP_GUIDE.md](SETUP_GUIDE.md)
- Review [firmware/README.md](firmware/README.md)
- Check backend logs
- Check ESP32 Serial Monitor
- Review browser console

---

<div align="center">

**Built with ❤️ for IoT automation**

[⬆ Back to Top](#lensclear-iot-device-management-system)

</div>
