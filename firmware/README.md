# LensClear ESP32 Firmware

Complete Arduino firmware for ESP32-based IoT lens cleaning device with MQTT communication.

## Hardware Requirements

### Components
- **ESP32 DevKit** (30-pin or 38-pin)
- **DC Motor** (6V-12V)
- **L298N Motor Driver Module**
- **DHT22 Temperature/Humidity Sensor**
- **LEDs** (2x - status and error indicators)
- **Resistors** (2x 220Ω for LEDs)
- **Power Supply** (12V 2A recommended)
- **Breadboard and Jumper Wires**

### Optional Components
- Hall Effect Sensor (for RPM measurement)
- INA219 Current Sensor (for power consumption)
- MPU6050 Accelerometer (for vibration detection)

## Wiring Diagram

### ESP32 to L298N Motor Driver
```
ESP32 Pin 25  →  L298N IN1
ESP32 Pin 26  →  L298N IN2
ESP32 Pin 27  →  L298N ENA (PWM speed control)
ESP32 GND     →  L298N GND
```

### ESP32 to DHT22 Sensor
```
ESP32 Pin 4   →  DHT22 DATA
ESP32 3.3V    →  DHT22 VCC
ESP32 GND     →  DHT22 GND
```

### ESP32 to LEDs
```
ESP32 Pin 2   →  Status LED (Green) → 220Ω → GND
ESP32 Pin 15  →  Error LED (Red) → 220Ω → GND
```

### L298N to Motor
```
L298N OUT1    →  Motor Terminal 1
L298N OUT2    →  Motor Terminal 2
12V Power     →  L298N 12V
GND           →  L298N GND
```

### Power Supply
```
12V Adapter   →  L298N 12V Input
L298N 5V Out  →  ESP32 VIN (or use separate 5V supply)
Common GND    →  All components
```

## Software Setup

### 1. Install Arduino IDE
Download and install Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)

### 2. Install ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add this URL to "Additional Board Manager URLs":
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "ESP32" and install "esp32 by Espressif Systems"

### 3. Install Required Libraries
Go to **Sketch → Include Library → Manage Libraries** and install:

- **PubSubClient** by Nick O'Leary (for MQTT)
- **DHT sensor library** by Adafruit
- **Adafruit Unified Sensor** (dependency for DHT)
- **ArduinoJson** by Benoit Blanchon

### 4. Configure the Firmware

Open `lensclear_esp32.ino` and update these settings:

```cpp
// WiFi Credentials
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";

// MQTT Broker (your backend server IP)
const char* MQTT_SERVER = "192.168.1.100";  // Change to your server IP

// Device Configuration
const char* DEVICE_ID = "ESP32_001";  // Unique ID for this device
const char* AUTH_TOKEN = "paste_token_from_backend";  // Get from device registration
```

### 5. Upload to ESP32

1. Connect ESP32 to computer via USB
2. Select **Tools → Board → ESP32 Dev Module**
3. Select **Tools → Port → COM X** (your ESP32's port)
4. Click **Upload** button (→)
5. Wait for "Done uploading" message

### 6. Monitor Serial Output

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see connection logs and sensor data

## Device Registration

Before the ESP32 can connect, you must register it in the backend:

1. Start the backend server
2. Login to the frontend
3. Go to **Devices** page
4. Click **Add Device**
5. Enter:
   - **Device ID**: Same as in firmware (e.g., `ESP32_001`)
   - **Name**: Friendly name (e.g., "Lens Cleaner 1")
   - **Type**: Combined
   - **Location**: Optional
6. Copy the generated **Auth Token**
7. Paste it into the firmware's `AUTH_TOKEN` constant
8. Re-upload the firmware

## Testing

### 1. Check WiFi Connection
Serial Monitor should show:
```
Connecting to WiFi: YourWiFiName
.....
✓ WiFi connected!
IP Address: 192.168.1.XXX
```

### 2. Check MQTT Connection
Serial Monitor should show:
```
Connecting to MQTT broker... ✓ Connected!
Subscribed to:
  - devices/ESP32_001/commands/motor
  - devices/ESP32_001/commands/config
Status published: online
```

### 3. Check Sensor Data
Every 5 seconds, you should see:
```
Sensor data published: {"temperature":25.5,"rpm":0,"powerConsumption":0.0,"vibration":0.0,"errorCode":"","timestamp":12345}
```

### 4. Test Motor Control
From the frontend Dashboard:
1. Click "Start Motor" button
2. Serial Monitor should show:
   ```
   Message received on topic: devices/ESP32_001/commands/motor
   Executing command: start_motor
   Motor started at speed: 128
   ✓ Command executed successfully
   ```
3. Motor should start spinning

## Troubleshooting

### WiFi Won't Connect
- Check SSID and password are correct
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router
- Check Serial Monitor for error messages

### MQTT Connection Failed
- Verify backend server is running
- Check MQTT_SERVER IP address is correct
- Ensure port 1883 is not blocked by firewall
- Verify AUTH_TOKEN matches the one from backend
- Check Serial Monitor for error code:
  - `-2`: Connection refused
  - `-3`: Connection lost
  - `-4`: Timeout

### Motor Not Running
- Check wiring connections
- Verify motor driver has power (12V)
- Test motor directly with battery
- Check PWM pin is connected to ENA
- Ensure motor driver jumper is on ENA

### Sensor Reading NaN
- Check DHT22 wiring (VCC, GND, DATA)
- Add 10kΩ pull-up resistor between DATA and VCC
- Wait 2 seconds after power-on for sensor to stabilize
- Try different DHT22 sensor (may be faulty)

### Device Shows Offline in Frontend
- Check MQTT connection is successful
- Verify device is publishing status messages
- Check backend logs for MQTT errors
- Ensure deviceId matches exactly

## Advanced Configuration

### Change Sensor Interval
```cpp
#define SENSOR_INTERVAL 5000  // milliseconds (default: 5 seconds)
```

### Adjust Motor Speed Range
```cpp
void startMotor(int speed) {
  speed = constrain(speed, 50, 200);  // Limit to 50-200 instead of 0-255
  // ...
}
```

### Add RPM Sensor
If you have a hall effect sensor on pin 34:
```cpp
#define RPM_SENSOR_PIN 34
volatile int pulseCount = 0;

void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setup() {
  pinMode(RPM_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RPM_SENSOR_PIN), pulseCounter, RISING);
}

int readRPM() {
  static unsigned long lastTime = 0;
  unsigned long currentTime = millis();
  
  if (currentTime - lastTime >= 1000) {
    int rpm = (pulseCount * 60) / 1;  // Assuming 1 pulse per revolution
    pulseCount = 0;
    lastTime = currentTime;
    return rpm;
  }
  return 0;
}
```

## Pin Reference

| Pin | Function | Component |
|-----|----------|-----------|
| 2 | Status LED | Green LED |
| 4 | DHT22 Data | Temperature Sensor |
| 15 | Error LED | Red LED |
| 25 | Motor IN1 | L298N Driver |
| 26 | Motor IN2 | L298N Driver |
| 27 | Motor PWM | L298N ENA |
| 3.3V | Power | DHT22 VCC |
| GND | Ground | All components |

## Safety Notes

⚠️ **Important Safety Guidelines:**

1. **Power Supply**: Use appropriate voltage for your motor (typically 6-12V)
2. **Current**: Ensure power supply can handle motor current (check motor specs)
3. **Heat**: L298N can get hot - add heatsink if running continuously
4. **Isolation**: Keep motor driver away from ESP32 to avoid electrical noise
5. **Fuses**: Consider adding fuse to motor power supply
6. **Testing**: Test motor control with low voltage first

## Next Steps

1. ✅ Upload firmware to ESP32
2. ✅ Register device in backend
3. ✅ Test WiFi and MQTT connection
4. ✅ Verify sensor data in Dashboard
5. ✅ Test motor control commands
6. ✅ Create triggers for automated cleaning
7. ✅ Monitor logs for errors

## Support

For issues or questions:
- Check Serial Monitor output
- Review backend logs
- Verify all wiring connections
- Test components individually
