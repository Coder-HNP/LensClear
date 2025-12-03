# ESP32 Web-Connected Test - Quick Setup Guide

## 🌐 What's New

This updated code connects ESP32 to your WiFi network and communicates with the LensClear backend server via HTTP. All network activity is shown in the Serial Monitor!

## ⚡ Quick Setup (5 Steps)

### Step 1: Get Your Computer's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for your local IP (e.g., `192.168.1.100`)

### Step 2: Update ESP32 Code

Open `LensClear_ESP32_Test.ino` and update these lines:

```cpp
// Line 24-25: WiFi Credentials
const char* WIFI_SSID = "YourWiFiName";        // ← Change this
const char* WIFI_PASSWORD = "YourWiFiPassword"; // ← Change this

// Line 28: Server IP
const char* SERVER_IP = "192.168.1.100";  // ← Your computer's IP
```

### Step 3: Start Backend Server

```bash
cd backend
npm start
```

✅ Verify you see:
```
🚀 LensClear Backend Server Running
📍 HTTP Server: http://localhost:5000
```

### Step 4: Upload to ESP32

1. Open Arduino IDE
2. Select **Board**: ESP32 Dev Module
3. Select **Port**: (your ESP32 port)
4. Click **Upload**

### Step 5: Open Serial Monitor

1. **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. Watch the magic happen!

---

## 📊 What You'll See in Serial Monitor

### 1. WiFi Connection
```
[WiFi] Connecting to: YourWiFiName
.....
[WiFi] ✓ Connected!
[WiFi] IP Address: 192.168.1.105
[WiFi] Signal Strength: -45 dBm
```

### 2. Sending Data to Server (Every 5 seconds)
```
[HTTP] ═══════════════════════════════════
[HTTP] Sending sensor data to server...
[HTTP] Payload:
{
  "deviceId": "ESP32_TEST_001",
  "deviceName": "Test Lens Cleaner",
  "sensors": {
    "temperature": 42.3,
    "motorRPM": 850,
    "motorStatus": "RUNNING",
    "vibration": 0.4,
    "cycleCount": 3,
    "powerConsumption": 2.8
  },
  "status": "active"
}
[HTTP] POST → http://192.168.1.100:5000/api/sensor-data
[HTTP] ✓ Response Code: 200
[HTTP] Server Response:
{"success":true,"message":"Data received"}
[HTTP] ═══════════════════════════════════
```

### 3. Receiving Commands from Server (Every 3 seconds)
```
[HTTP] Checking for commands from server...
[HTTP] ✓ Command received: START_MOTOR

[CMD] ═══════════════════════════════════
[CMD] Executing: START_MOTOR
[CMD] ✓ Motor started
[CMD] ═══════════════════════════════════

[HTTP] Command acknowledgment sent: 200
```

---

## 🎮 Testing the System

### Test 1: Send Data from ESP32 to Website

1. **ESP32**: Type `TEST` in Serial Monitor
2. **Serial Monitor**: Watch HTTP POST request
3. **Backend Terminal**: See incoming request logged
4. **Website**: (Future) View data in dashboard

### Test 2: Send Command from Website to ESP32

1. **Website**: Click "Start Motor" button
2. **Backend**: Sends command to ESP32
3. **ESP32**: Receives and executes command
4. **Serial Monitor**: Shows command execution

### Test 3: Manual Serial Commands

Type these in Serial Monitor:

```
START      → Starts motor (shows in Serial + sends to server)
STOP       → Stops motor
STATUS     → Shows current sensor values
WIFI       → Shows WiFi connection details
TEST       → Manually sends data to server
RECONNECT  → Reconnects to WiFi
HELP       → Shows all commands
```

---

## 🔍 Serial Monitor Commands

| Command | What It Does | What You'll See |
|---------|--------------|-----------------|
| `START` | Start motor | Motor state changes, LED blinks |
| `STOP` | Stop motor | Motor stops, LED off |
| `STATUS` | Show current status | All sensor values displayed |
| `WIFI` | WiFi information | IP, signal strength, server URL |
| `TEST` | Send data now | Immediate HTTP POST to server |
| `RECONNECT` | Reconnect WiFi | WiFi reconnection process |
| `HELP` | Show commands | Command list |
| `REBOOT` | Restart ESP32 | Device restarts |

---

## 🌐 How It Works

### Data Flow: ESP32 → Server

```
ESP32 Sensors → JSON Payload → HTTP POST → Backend Server
                                              ↓
                                         MongoDB Storage
                                              ↓
                                         Socket.io Emit
                                              ↓
                                         Frontend Update
```

### Command Flow: Server → ESP32

```
Frontend Button → Backend API → HTTP Response → ESP32 Receives
                                                    ↓
                                              Execute Command
                                                    ↓
                                              Send Acknowledgment
```

---

## 🔧 Troubleshooting

### WiFi Won't Connect

**Problem:** `[WiFi] ✗ Connection failed!`

**Solutions:**
- Check SSID and password are correct
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router
- Check WiFi network allows new devices

### HTTP Errors

**Problem:** `[HTTP] ✗ Error: connection refused`

**Solutions:**
- Verify backend server is running (`npm start`)
- Check SERVER_IP is your computer's IP (not localhost)
- Ensure ESP32 and computer are on same WiFi network
- Check firewall allows port 5000

**Problem:** `[HTTP] Error: -1`

**Solutions:**
- Backend server not running
- Wrong IP address
- Network firewall blocking connection

### No Commands Received

**Problem:** ESP32 doesn't receive commands from server

**Solutions:**
- Backend needs to implement command queue endpoint
- Check `/api/commands/{deviceId}` route exists
- Verify AUTH_TOKEN matches backend

### Serial Monitor Shows Garbage

**Solutions:**
- Set baud rate to **115200**
- Press Reset button on ESP32
- Close and reopen Serial Monitor

---

## 📡 Backend API Endpoints Used

The ESP32 communicates with these endpoints:

### 1. Send Sensor Data
```
POST /api/sensor-data
Headers: Authorization: Bearer {AUTH_TOKEN}
Body: JSON sensor data
```

### 2. Check for Commands
```
GET /api/commands/{deviceId}
Headers: Authorization: Bearer {AUTH_TOKEN}
Response: {"command": "START_MOTOR"}
```

### 3. Send Command Acknowledgment
```
POST /api/command-ack
Headers: Authorization: Bearer {AUTH_TOKEN}
Body: {"deviceId": "...", "command": "...", "success": true}
```

---

## 🎯 Testing Checklist

- [ ] WiFi credentials updated in code
- [ ] Server IP address updated
- [ ] Backend server running
- [ ] Code uploaded to ESP32
- [ ] Serial Monitor open (115200 baud)
- [ ] WiFi connection successful
- [ ] Data sending to server (every 5 seconds)
- [ ] HTTP 200 response received
- [ ] Commands can be sent via Serial Monitor
- [ ] LED blinks when motor running
- [ ] All network activity visible in Serial Monitor

---

## 💡 Tips

1. **Keep Serial Monitor Open**: You'll see all HTTP requests/responses in real-time

2. **Watch Both Terminals**: 
   - Serial Monitor (ESP32 activity)
   - Backend Terminal (server logs)

3. **Test Incrementally**:
   - First: WiFi connection
   - Then: Sending data
   - Finally: Receiving commands

4. **Use TEST Command**: Manually trigger data send without waiting

5. **Check IP Address**: Use `ipconfig`/`ifconfig` to verify your computer's IP

---

## 🚀 Next Steps

Once this works:

1. **View Data in Frontend**:
   - Create endpoint to display ESP32 data
   - Show real-time sensor values
   - Graph temperature/RPM over time

2. **Send Commands from Frontend**:
   - Add "Start Motor" button
   - Implement command queue in backend
   - ESP32 polls for commands

3. **Add More Devices**:
   - Upload code to multiple ESP32 boards
   - Change DEVICE_ID for each
   - Manage all from one dashboard

4. **Switch to MQTT**:
   - More efficient than HTTP polling
   - Real-time bidirectional communication
   - Use the full `lensclear_esp32.ino` firmware

---

## 📞 Support

**WiFi Issues?**
- Check 2.4GHz network
- Verify credentials
- Move closer to router

**HTTP Issues?**
- Verify backend running
- Check IP address
- Test with `curl` or Postman

**Serial Monitor Issues?**
- Baud rate: 115200
- Reset ESP32
- Check USB cable

---

**🎉 You're now connected to the internet!**

Your ESP32 is sending data to the server and can receive commands. Watch the Serial Monitor to see all the network magic happening in real-time!
