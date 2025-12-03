# LensClear IoT - Quick Start (5 Minutes)

Get the system running in 5 minutes for testing!

## Step 1: Install MongoDB (2 minutes)

### Windows:
Download and run: https://www.mongodb.com/try/download/community
- Choose "Complete" installation
- Install as Windows Service
- Done! MongoDB starts automatically

### Mac:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## Step 2: Start Backend (1 minute)

```bash
cd backend
npm install
cp .env.example .env
npm start
```

✅ You should see:
```
🚀 LensClear Backend Server Running
📍 HTTP Server: http://localhost:5000
📡 MQTT Broker: mqtt://localhost:1883
```

## Step 3: Start Frontend (1 minute)

Open NEW terminal:
```bash
cd lensclear-project
npm install
cp .env.example .env
npm run dev
```

✅ Frontend opens at: http://localhost:5173

## Step 4: Create Account (30 seconds)

1. Click "Register"
2. Enter email and password
3. Click "Create Account"
4. Login

## Step 5: Test Without Hardware (30 seconds)

### Register a Virtual Device:
1. Go to "Devices" page
2. Click "Add Device"
3. Enter:
   - Device ID: `TEST_001`
   - Name: "Test Device"
   - Type: Combined
4. Click "Register"
5. **Copy the Auth Token** (save it!)

### Create a Trigger:
1. Go to "Triggers" page
2. Click "Create Trigger"
3. Enter:
   - Name: "Test Motor Start"
   - Type: Immediate
   - Action: Start Motor
   - Select "Test Device"
4. Click "Create Trigger"

### View Logs:
1. Go to "Logs" page
2. You'll see device registration log
3. Try "Export to CSV"

✅ **System is working!** Backend, frontend, and database are operational.

---

## Next: Add Real ESP32 Hardware

### What You Need:
- ESP32 DevKit board ($5-10)
- L298N motor driver ($2-5)
- DHT22 sensor ($3-5)
- DC motor ($2-5)
- 12V power supply
- Breadboard and wires

### Quick ESP32 Setup:

1. **Install Arduino IDE**: https://www.arduino.cc/en/software

2. **Add ESP32 Board**:
   - File → Preferences
   - Add URL: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager
   - Install "esp32"

3. **Install Libraries**:
   - Sketch → Include Library → Manage Libraries
   - Install: PubSubClient, DHT sensor library, ArduinoJson

4. **Upload Firmware**:
   - Open `firmware/lensclear_esp32/lensclear_esp32.ino`
   - Update WiFi credentials
   - Update MQTT server IP (your computer's IP)
   - Update AUTH_TOKEN (from device registration)
   - Select Board: ESP32 Dev Module
   - Click Upload

5. **Verify Connection**:
   - Open Serial Monitor (115200 baud)
   - Should see: "✓ WiFi connected!" and "✓ MQTT Connected!"
   - Device should show "Online" in frontend

---

## Troubleshooting

### Backend won't start?
```bash
# Check MongoDB is running
mongosh
# If error, start MongoDB manually
```

### Frontend won't start?
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### ESP32 won't connect?
- Check WiFi SSID and password
- Verify MQTT server IP is correct (use `ipconfig` or `ifconfig`)
- Ensure firewall allows port 1883
- Check Serial Monitor for errors

---

## What's Next?

✅ **System is running!**

Now you can:
1. **Test motor control** from Dashboard
2. **Create scheduled triggers** for automation
3. **View real-time sensor data** in graphs
4. **Export logs** for analysis
5. **Add more ESP32 devices**

📖 **Full documentation**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## Commands Cheat Sheet

```bash
# Start backend
cd backend && npm start

# Start frontend
cd lensclear-project && npm run dev

# Check MongoDB
mongosh

# View backend logs
# (just watch the terminal)

# View ESP32 logs
# Arduino IDE → Tools → Serial Monitor (115200 baud)
```

---

## System URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health
- **MQTT Broker**: mqtt://localhost:1883

---

**🎉 You're all set! The system is ready to use.**

For detailed setup, hardware wiring, and production deployment, see [SETUP_GUIDE.md](SETUP_GUIDE.md).
