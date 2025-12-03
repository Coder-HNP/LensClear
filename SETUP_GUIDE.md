# LensClear IoT System - Complete Setup Guide

This guide will walk you through setting up the complete LensClear IoT system from scratch, including backend, frontend, and ESP32 hardware.

## System Requirements

### Software
- **Node.js** 18.x or higher
- **MongoDB** 5.0 or higher
- **Arduino IDE** 2.x
- **Git** (optional)

### Hardware
- **ESP32 DevKit** board
- **DC Motor** with L298N driver
- **DHT22** temperature sensor
- **LEDs** and resistors
- **Power supply** (12V 2A)
- **Breadboard** and jumper wires

## Part 1: Backend Setup

### Step 1: Install MongoDB

#### Windows:
1. Download MongoDB from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Complete" installation
4. Install as a Windows Service
5. MongoDB will start automatically

#### Mac:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

Verify installation:
```bash
mongosh
# Should connect to MongoDB shell
```

### Step 2: Setup Backend

1. **Navigate to backend directory:**
   ```bash
   cd lensclear-project/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/lensclear
   JWT_SECRET=your_secret_key_here_change_this
   MQTT_PORT=1883
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start the backend server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Verify backend is running:**
   - Open browser to `http://localhost:5000/health`
   - Should see: `{"status":"ok","mongodb":"connected"}`

### Expected Output:
```
📦 Connecting to MongoDB...
✅ MongoDB connected
🔌 Initializing Socket.io...
✅ Socket.io initialized
📡 Initializing MQTT broker...
✅ MQTT Broker running on port 1883
✅ MQTT broker initialized
⏰ Initializing scheduler...
✅ Scheduler initialized

==================================================
🚀 LensClear Backend Server Running
==================================================
📍 HTTP Server: http://localhost:5000
📡 MQTT Broker: mqtt://localhost:1883
🔌 Socket.io: Enabled
📦 MongoDB: Connected
==================================================
```

## Part 2: Frontend Setup

### Step 1: Install Dependencies

1. **Navigate to frontend directory:**
   ```bash
   cd lensclear-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Step 2: Configure Environment

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

### Step 3: Start Frontend

```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

### Step 4: Create Account

1. Open `http://localhost:5173` in browser
2. Click "Register"
3. Create account with email and password
4. Login with your credentials

## Part 3: ESP32 Hardware Setup

### Step 1: Assemble Hardware

Follow the wiring diagram in `firmware/README.md`:

**Quick Reference:**
- ESP32 Pin 25 → L298N IN1
- ESP32 Pin 26 → L298N IN2
- ESP32 Pin 27 → L298N ENA (PWM)
- ESP32 Pin 4 → DHT22 DATA
- ESP32 Pin 2 → Status LED (Green)
- ESP32 Pin 15 → Error LED (Red)
- 12V Power → L298N 12V Input
- Common GND → All components

### Step 2: Install Arduino IDE

1. Download from [arduino.cc](https://www.arduino.cc/en/software)
2. Install ESP32 board support:
   - File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager
   - Search "ESP32" and install "esp32 by Espressif Systems"

### Step 3: Install Libraries

Go to **Sketch → Include Library → Manage Libraries** and install:
- PubSubClient
- DHT sensor library
- Adafruit Unified Sensor
- ArduinoJson

### Step 4: Register Device in Backend

1. Login to frontend
2. Go to **Devices** page
3. Click **Add Device**
4. Fill in:
   - **Device ID**: `ESP32_001` (must match firmware)
   - **Name**: "Lens Cleaner 1"
   - **Type**: Combined
   - **Location**: "Lab" (optional)
5. Click **Register Device**
6. **Copy the Auth Token** (you'll need this for firmware)

### Step 5: Configure Firmware

1. Open `firmware/lensclear_esp32/lensclear_esp32.ino` in Arduino IDE

2. Update configuration:
   ```cpp
   // WiFi Credentials
   const char* WIFI_SSID = "YourWiFiName";
   const char* WIFI_PASSWORD = "YourWiFiPassword";

   // MQTT Broker (your computer's IP address)
   const char* MQTT_SERVER = "192.168.1.100";  // Change this!

   // Device Configuration
   const char* DEVICE_ID = "ESP32_001";  // Must match registration
   const char* AUTH_TOKEN = "paste_token_here";  // From step 4
   ```

3. **Find your computer's IP address:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

### Step 6: Upload Firmware

1. Connect ESP32 to computer via USB
2. Select **Tools → Board → ESP32 Dev Module**
3. Select **Tools → Port → COM X** (your ESP32's port)
4. Click **Upload** button (→)
5. Wait for "Done uploading"

### Step 7: Monitor Serial Output

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   =================================
   LensClear ESP32 IoT Device
   =================================
   Device ID: ESP32_001
   Connecting to WiFi: YourWiFiName
   .....
   ✓ WiFi connected!
   IP Address: 192.168.1.XXX
   Connecting to MQTT broker... ✓ Connected!
   Subscribed to:
     - devices/ESP32_001/commands/motor
     - devices/ESP32_001/commands/config
   Status published: online
   =================================
   Setup complete! Device ready.
   =================================
   ```

## Part 4: Testing the System

### Test 1: Verify Device Connection

1. In frontend, go to **Devices** page
2. Your device should show status: **Online** (green indicator)
3. Check "Last Seen" timestamp is recent

### Test 2: View Sensor Data

1. Go to **Dashboard**
2. Select your device from dropdown
3. You should see:
   - Temperature reading updating every 5 seconds
   - Real-time graph showing sensor data
   - Device status card

### Test 3: Send Motor Command

1. In Dashboard, find **Control Panel**
2. Click **Start Motor** button
3. Check Serial Monitor:
   ```
   Message received on topic: devices/ESP32_001/commands/motor
   Executing command: start_motor
   Motor started at speed: 128
   ✓ Command executed successfully
   ```
4. Motor should start spinning
5. Click **Stop Motor** to stop

### Test 4: Create a Trigger

1. Go to **Triggers** page
2. Click **Create Trigger**
3. Fill in:
   - Name: "Test Motor Start"
   - Type: Immediate
   - Action: Start Motor
   - Target Devices: Select your device
   - Speed: 150
4. Click **Create Trigger**
5. Click **Execute Now** (play icon)
6. Motor should start at speed 150

### Test 5: View Logs

1. Go to **Logs** page
2. You should see all commands executed
3. Try filters:
   - Filter by device
   - Filter by action
   - Filter by status
4. Click **Export to CSV** to download logs

## Part 5: Advanced Configuration

### Enable Firebase Authentication (Optional)

If you want to use Firebase Auth instead of simple tokens:

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Google)
3. Get Firebase Admin SDK credentials
4. Update `backend/middleware/auth.js`:
   - Uncomment Firebase Admin code
   - Add credentials to `.env`

### Setup Scheduled Triggers

1. Go to **Triggers** page
2. Create new trigger:
   - Type: **Scheduled**
   - Schedule Type: **Daily**
   - Date & Time: Choose time (e.g., 9:00 AM)
3. Trigger will execute automatically at scheduled time

### Add Multiple Devices

1. Repeat ESP32 setup for each device
2. Use unique Device IDs: `ESP32_002`, `ESP32_003`, etc.
3. Each device gets its own auth token
4. Upload firmware with correct ID and token

### Monitor System Health

1. Go to **Dashboard**
2. Check **System Health** widget:
   - CPU usage
   - Memory usage
   - Active connections
3. Check **Alerts Panel** for warnings

## Troubleshooting

### Backend Won't Start

**Problem**: MongoDB connection error
```
Solution:
1. Verify MongoDB is running: mongosh
2. Check MONGODB_URI in .env
3. Ensure port 27017 is not blocked
```

**Problem**: Port 5000 already in use
```
Solution:
1. Change PORT in .env to 5001
2. Update VITE_API_URL in frontend .env
3. Restart both servers
```

### ESP32 Won't Connect to WiFi

**Problem**: WiFi connection failed
```
Solution:
1. Check SSID and password are correct
2. Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
3. Move ESP32 closer to router
4. Check Serial Monitor for error details
```

### ESP32 Won't Connect to MQTT

**Problem**: MQTT connection refused
```
Solution:
1. Verify backend is running
2. Check MQTT_SERVER IP is correct
3. Ping the server from another device
4. Ensure firewall allows port 1883
5. Verify AUTH_TOKEN matches backend
```

### Device Shows Offline

**Problem**: Device registered but shows offline
```
Solution:
1. Check ESP32 Serial Monitor for connection status
2. Verify MQTT connection is successful
3. Check backend logs for MQTT errors
4. Ensure deviceId matches exactly (case-sensitive)
```

### Motor Not Running

**Problem**: Command sent but motor doesn't spin
```
Solution:
1. Check wiring connections
2. Verify motor driver has 12V power
3. Test motor directly with battery
4. Check PWM pin connected to ENA
5. Ensure motor driver jumper is on ENA
```

### Sensor Reading NaN

**Problem**: Temperature shows NaN or null
```
Solution:
1. Check DHT22 wiring (VCC, GND, DATA)
2. Add 10kΩ pull-up resistor between DATA and VCC
3. Wait 2 seconds after power-on
4. Try different DHT22 sensor
```

## Production Deployment

### Backend Deployment (Render/Heroku)

1. Create account on [Render](https://render.com) or [Heroku](https://heroku.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set environment variables:
   - `MONGODB_URI`: Use MongoDB Atlas
   - `JWT_SECRET`: Generate secure key
   - `FRONTEND_URL`: Your frontend URL
5. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Create account on [Vercel](https://vercel.com)
2. Import project from GitHub
3. Set environment variables:
   - `VITE_API_URL`: Your backend URL
   - `VITE_SOCKET_URL`: Your backend URL
4. Deploy

### MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Add database user
4. Whitelist IP addresses (or allow from anywhere)
5. Get connection string
6. Update `MONGODB_URI` in backend

### ESP32 Production Configuration

1. Update `MQTT_SERVER` to production backend URL
2. Use static IP or domain name
3. Implement OTA (Over-The-Air) updates for firmware
4. Add watchdog timer for auto-restart
5. Implement SSL/TLS for secure MQTT

## Next Steps

✅ System is now fully operational!

**Recommended Actions:**
1. Create scheduled triggers for automated cleaning
2. Set up alerts for abnormal sensor readings
3. Export logs regularly for analysis
4. Add more ESP32 devices
5. Customize motor control parameters
6. Implement custom cleaning cycles

## Support & Resources

- **Backend API Documentation**: See `docs/API_DOCUMENTATION.md`
- **MQTT Protocol**: See `docs/MQTT_PROTOCOL.md`
- **ESP32 Wiring**: See `firmware/README.md`
- **Troubleshooting**: See above section

For issues or questions, check:
- Backend logs: Console output
- Frontend logs: Browser DevTools Console
- ESP32 logs: Arduino Serial Monitor
- MongoDB logs: MongoDB logs directory

---

**Congratulations!** 🎉 Your LensClear IoT system is ready to use!
