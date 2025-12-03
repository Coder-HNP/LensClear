# ESP32 Testing Code - Complete Guide

## 📋 Overview

This guide will help you test the ESP32 simulation code for the LensClear IoT system. **No external sensors or WiFi required** - perfect for learning and testing!

---

## 🎯 What This Code Does

- ✅ Simulates a lens cleaning machine with realistic sensor data
- ✅ Transmits data to Serial Monitor every 3 seconds
- ✅ Accepts commands via Serial input (START, STOP, RESET, etc.)
- ✅ Uses built-in LED to show motor status
- ✅ Generates alerts based on sensor conditions
- ✅ Provides both human-readable and JSON output formats

---

## 🛠️ Hardware Required

**Minimum (for testing):**
- ESP32 DevKit V1 board
- USB cable (to connect to computer)

**That's it!** No external sensors, motors, or WiFi needed.

---

## 📥 Step 1: Install Arduino IDE

### Windows:
1. Download from: https://www.arduino.cc/en/software
2. Run installer
3. Follow installation wizard

### Mac:
```bash
brew install --cask arduino
```

### Linux:
```bash
sudo apt-get update
sudo apt-get install arduino
```

---

## 🔧 Step 2: Setup ESP32 Board Support

### 2.1 Add ESP32 Board Manager URL

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Click **OK**

### 2.2 Install ESP32 Board

1. Go to **Tools → Board → Boards Manager**
2. Search for "ESP32"
3. Install **"esp32 by Espressif Systems"**
4. Wait for installation to complete

---

## 📤 Step 3: Upload Code to ESP32

### 3.1 Open the Code

1. Open `LensClear_ESP32_Test.ino` in Arduino IDE
2. The code is ready to use - **no modifications needed!**

### 3.2 Select Board

1. Go to **Tools → Board → ESP32 Arduino**
2. Select **"ESP32 Dev Module"**

### 3.3 Select Port

1. Connect ESP32 to computer via USB
2. Go to **Tools → Port**
3. Select the COM port (Windows) or /dev/cu.* (Mac) that appears

**Troubleshooting:**
- No port appears? Install CP2102 or CH340 USB driver
- Multiple ports? Disconnect ESP32, see which port disappears, reconnect

### 3.4 Upload

1. Click the **Upload** button (→ arrow icon)
2. Wait for "Connecting..." message
3. If it says "Connecting..." for too long, press and hold **BOOT** button on ESP32
4. Wait for "Done uploading" message

**Expected Output:**
```
Sketch uses 234562 bytes (17%) of program storage space.
Global variables use 14532 bytes (4%) of dynamic memory.
...
Hard resetting via RTS pin...
```

---

## 📊 Step 4: Open Serial Monitor

### 4.1 Open Monitor

1. Click **Tools → Serial Monitor**
2. Or press **Ctrl+Shift+M** (Windows/Linux) or **Cmd+Shift+M** (Mac)

### 4.2 Set Baud Rate

1. In Serial Monitor, find baud rate dropdown (bottom right)
2. Select **115200**

### 4.3 Verify Output

You should see:
```
=====================================
  LensClear IoT Device Starting...  
=====================================
Device ID: ESP32_001
Device Name: Lens Cleaner A
Firmware Version: 1.0.0
...
[READY] Device initialized successfully!
Type HELP for available commands
```

---

## 🎮 Step 5: Test Commands

### Available Commands

Type these commands in the Serial Monitor input box (top):

| Command | Description | Expected Result |
|---------|-------------|-----------------|
| `HELP` | Show all commands | Displays command list |
| `START` | Start motor | Motor state → RUNNING, LED blinks |
| `STOP` | Stop motor | Motor state → STOPPED, LED off |
| `IDLE` | Set to idle | Motor state → IDLE, LED solid on |
| `RESET` | Reset cycle count | Cycle count → 0 |
| `STATUS` | Show current status | Displays all sensor values |
| `INFO` | Show device info | Displays device details |
| `REBOOT` | Restart ESP32 | Device restarts |

### Testing Procedure

**Test 1: Help Command**
```
Type: HELP
Expected: List of all commands displayed
```

**Test 2: Start Motor**
```
Type: START
Expected: 
- Message: "[CMD] ✓ Motor started"
- LED starts blinking (1 second interval)
- Next data update shows "Motor Status: RUNNING"
- RPM increases to 1000-1500
- Temperature starts rising
```

**Test 3: Stop Motor**
```
Type: STOP
Expected:
- Message: "[CMD] ✓ Motor stopped"
- LED turns off
- Next data update shows "Motor Status: STOPPED"
- RPM drops to 0
- Temperature starts decreasing
```

**Test 4: Reset Cycles**
```
Type: RESET
Expected:
- Message: "[CMD] ✓ Cycle count reset to 0"
- Cycle Count shows 0 in next update
```

**Test 5: Status Check**
```
Type: STATUS
Expected:
- Immediate display of current values
- Shows Motor, Temperature, RPM, Cycles
```

---

## 📈 Step 6: Understanding the Output

### Pretty Print Mode (Default)

```
[00:00:03] ====================================
[00:00:03] Device: Lens Cleaner A (ESP32_001)
[00:00:03] Uptime: 0h 0m 3s | Free Memory: 245KB
[00:00:03] ------------------------------------
[00:00:03] Temperature: 42.3°C ████░░░░░░ (42%)
[00:00:03] Motor RPM: 850 ███████░░░ (57%)
[00:00:03] Motor Status: RUNNING
[00:00:03] Vibration: 0.4g ████░░░░░░ (40%)
[00:00:03] Cycle Count: 3
[00:00:03] Power: 2.8W ██████░░░░ (56%)
[00:00:03] Status: ACTIVE
[00:00:03] Alerts: None
[00:00:03] WiFi: Not Connected (Serial Mode)
[00:00:03] ====================================
[00:00:03] CSV_DATA,42.3,850,3,2.8
```

**What Each Line Means:**

- **Timestamp** `[00:00:03]`: Hours:Minutes:Seconds since boot
- **Device Info**: Device name and ID
- **Uptime**: How long ESP32 has been running
- **Free Memory**: Available RAM (should be ~240-250KB)
- **Temperature**: Current temperature with visual bar
- **Motor RPM**: Revolutions per minute (0 when stopped)
- **Motor Status**: RUNNING, IDLE, or STOPPED
- **Vibration**: Vibration level in g-force
- **Cycle Count**: Number of cleaning cycles completed
- **Power**: Power consumption in watts
- **Status**: Overall device status
- **Alerts**: Any warnings or alerts
- **CSV_DATA**: Easy-to-copy data for Excel

### Progress Bars

```
Temperature: 42.3°C ████░░░░░░ (42%)
                    ^^^^^^^^^^
                    Progress bar showing 42% of max
```

- `█` = Filled portion
- `░` = Empty portion
- Percentage shows relative value

---

## 🔄 Step 7: Automatic State Machine

The motor automatically changes state every 20 seconds:

```
IDLE → RUNNING → IDLE → STOPPED → IDLE → (repeat)
```

**What Happens:**

1. **IDLE** (20 seconds)
   - LED: Solid ON
   - RPM: 100-300
   - Temperature: Stable around 40°C

2. **RUNNING** (20 seconds)
   - LED: Blinking (1 second interval)
   - RPM: 1000-1500
   - Temperature: Rising
   - Cycles increment every 30 seconds

3. **IDLE** (20 seconds)
   - LED: Solid ON
   - RPM: 100-300
   - Temperature: Slowly decreasing

4. **STOPPED** (20 seconds)
   - LED: OFF
   - RPM: 0
   - Temperature: Faster decreasing

---

## ⚠️ Step 8: Testing Alerts

Alerts are generated automatically based on conditions:

### High Temperature Alert
```
How to trigger:
1. Type: START
2. Wait for temperature to rise above 55°C
3. Next update will show: "⚠️ High Temperature Warning"
```

### High Vibration Alert
```
How to trigger:
- Vibration is random, wait for it to exceed 0.8
- Alert appears: "⚠️ High Vibration Detected"
```

### Maintenance Due Alert
```
How to trigger:
1. Let motor run for extended time
2. Wait for cycle count to exceed 100
3. Alert appears: "⚠️ Maintenance Due"
```

---

## 📊 Step 9: Using CSV Data

### Copy to Excel

1. Wait for data update in Serial Monitor
2. Find line starting with `CSV_DATA`
3. Copy the values: `42.3,850,3,2.8`
4. Paste into Excel

### Excel Setup

Create columns:
| Temperature | RPM | Cycles | Power |
|-------------|-----|--------|-------|
| 42.3        | 850 | 3      | 2.8   |

### Create Graph

1. Select data
2. Insert → Chart → Line Chart
3. Watch values update in real-time!

---

## 🔀 Step 10: Switching to JSON Mode

### Change Output Format

1. Open `LensClear_ESP32_Test.ino`
2. Find line: `#define OUTPUT_MODE 1`
3. Change to: `#define OUTPUT_MODE 2`
4. Upload code again

### JSON Output

```json
{"deviceId":"ESP32_001","deviceName":"Lens Cleaner A","timestamp":"00:00:03","sensors":{"temperature":42.3,"motorRPM":850,"motorStatus":"RUNNING","vibration":0.4,"cycleCount":3,"powerConsumption":2.8},"status":"active","alerts":[],"uptime":3,"freeMemory":251904}
```

**Use Cases:**
- Machine parsing
- Data logging
- Integration with other systems
- Web API simulation

---

## 🐛 Troubleshooting

### Problem: No Output in Serial Monitor

**Solutions:**
1. Check baud rate is **115200**
2. Press **Reset** button on ESP32
3. Close and reopen Serial Monitor
4. Check USB cable is data cable (not charge-only)

### Problem: Garbled Text

**Solutions:**
1. Set baud rate to **115200**
2. Reset ESP32
3. Check "Both NL & CR" in Serial Monitor dropdown

### Problem: Upload Failed

**Solutions:**
1. Hold **BOOT** button while uploading
2. Try different USB port
3. Install CP2102 or CH340 driver
4. Check board is "ESP32 Dev Module"

### Problem: LED Not Blinking

**Solutions:**
1. Check LED_PIN is set to 2
2. Some ESP32 boards use different pins
3. Try changing to pin 5 or 13
4. Motor must be in RUNNING state

### Problem: Commands Not Working

**Solutions:**
1. Type commands in UPPERCASE
2. Press Enter after typing
3. Check "Both NL & CR" is selected
4. Commands are case-insensitive but uppercase recommended

### Problem: ESP32 Keeps Restarting

**Solutions:**
1. Check power supply (use good USB cable)
2. Check free memory isn't too low
3. Reduce UPDATE_INTERVAL if needed
4. Check for brownout detector messages

---

## 🎓 Learning Exercises

### Exercise 1: Modify Update Interval

**Task:** Change data transmission to every 5 seconds

**Steps:**
1. Find: `#define UPDATE_INTERVAL 3000`
2. Change to: `#define UPDATE_INTERVAL 5000`
3. Upload and verify

### Exercise 2: Add New Alert

**Task:** Add alert when RPM exceeds 1400

**Steps:**
1. Find `checkAlerts()` function
2. Add:
   ```cpp
   if (motorRPM > 1400) {
     alerts[alertCount++] = "High RPM Warning";
   }
   ```
3. Upload and test

### Exercise 3: Change Temperature Range

**Task:** Simulate higher operating temperature (40-70°C)

**Steps:**
1. Find: `#define TEMP_MIN 35.0`
2. Change to: `#define TEMP_MIN 40.0`
3. Find: `#define TEMP_MAX 60.0`
4. Change to: `#define TEMP_MAX 70.0`
5. Upload and observe

### Exercise 4: Custom Device Name

**Task:** Change device name to your own

**Steps:**
1. Find: `#define DEVICE_NAME "Lens Cleaner A"`
2. Change to: `#define DEVICE_NAME "My Test Device"`
3. Upload and verify in output

---

## 📝 Testing Checklist

Use this checklist to verify everything works:

- [ ] Code uploads without errors
- [ ] Serial Monitor shows startup message
- [ ] Data updates every 3 seconds
- [ ] LED blinks when motor is RUNNING
- [ ] LED is solid ON when IDLE
- [ ] LED is OFF when STOPPED
- [ ] START command works
- [ ] STOP command works
- [ ] RESET command works
- [ ] STATUS command works
- [ ] HELP command shows all commands
- [ ] Temperature changes based on motor state
- [ ] RPM changes based on motor state
- [ ] Cycle count increments when running
- [ ] Alerts appear when conditions met
- [ ] CSV_DATA line can be copied
- [ ] Automatic state changes every 20 seconds
- [ ] Free memory stays above 200KB
- [ ] Uptime counter increments correctly

---

## 🚀 Next Steps

Once you've mastered this testing code:

1. **Add Real Sensors**
   - Connect DHT22 for real temperature
   - Add hall effect sensor for RPM
   - Integrate current sensor for power

2. **Add WiFi**
   - Connect to WiFi network
   - Send data to web server
   - Receive commands over WiFi

3. **Add MQTT**
   - Connect to MQTT broker
   - Publish sensor data
   - Subscribe to commands

4. **Full Integration**
   - Use the complete `lensclear_esp32.ino` firmware
   - Connect to backend server
   - View data in web dashboard

---

## 📚 Additional Resources

- **Arduino ESP32 Documentation**: https://docs.espressif.com/projects/arduino-esp32/
- **Serial Monitor Guide**: https://www.arduino.cc/en/Guide/Environment#serial-monitor
- **ESP32 Pinout**: Search "ESP32 DevKit pinout" for diagrams

---

## ✅ Success Criteria

You've successfully completed testing when:

✅ You can upload code without errors  
✅ You can see data in Serial Monitor  
✅ You can control motor with commands  
✅ You understand the output format  
✅ You can modify the code and see changes  
✅ You're ready to move to real hardware integration  

---

**🎉 Congratulations!** You're now ready to build the full IoT system!

For the complete system with WiFi, MQTT, and real sensors, see:
- `firmware/lensclear_esp32/lensclear_esp32.ino`
- `firmware/README.md`
- `SETUP_GUIDE.md`
