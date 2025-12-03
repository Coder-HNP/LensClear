/************************************
 * LENSCLEAR IOT - ESP32 WEB-CONNECTED TEST FIRMWARE
 * Version: 2.0.0
 * Purpose: Simulate sensor data + transmit to backend server
 * Hardware: ESP32 DevKit V1 (NO EXTERNAL SENSORS NEEDED)
 * Features: WiFi + HTTP communication with backend
 * 
 * WHAT THIS CODE DOES:
 * - Connects to WiFi network
 * - Sends sensor data to backend server via HTTP POST
 * - Receives commands from backend server via HTTP GET
 * - Shows all network activity in Serial Monitor
 * - Uses built-in LED to show status
 * - Works with the LensClear backend (port 5000)
 * 
 * REQUIREMENTS:
 * - Backend server must be running (npm start in backend folder)
 * - ESP32 and computer must be on same WiFi network
 * - Update WiFi credentials and server IP below
 ************************************/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================
// WiFi Credentials - CHANGE THESE!
const char* WIFI_SSID = "ACT-ai_103767848193";        // Your WiFi name
const char* WIFI_PASSWORD = "81140518"; // Your WiFi password

// Backend Server Configuration - CHANGE THIS!
const char* SERVER_IP = "192.168.0.6";  // Your computer's IP address
const int SERVER_PORT = 5000;             // Backend port (default: 5000)

// Device Configuration
#define DEVICE_ID "ESP32_TEST_001"
#define DEVICE_NAME "Test Lens Cleaner"
#define AUTH_TOKEN "cb32163950eeb1060c0d6bf95741f5ab5c1b9cd1b1054c1b93e9707f5db6b387"  // Get from device registration

// Timing Configuration
#define UPDATE_INTERVAL 5000      // Send data every 5 seconds
#define COMMAND_CHECK_INTERVAL 3000  // Check for commands every 3 seconds

// Pin Definitions
#define LED_PIN 2  // Built-in LED

// Sensor Simulation Ranges
#define TEMP_MIN 35.0
#define TEMP_MAX 60.0
#define RPM_MAX 1500

// ==================== GLOBAL VARIABLES ====================

// Motor States
enum MotorState {
  STOPPED,
  IDLE,
  RUNNING
};

MotorState currentState = IDLE;
const char* stateNames[] = {"STOPPED", "IDLE", "RUNNING"};

// Sensor Data
float temperature = 40.0;
int motorRPM = 0;
float vibration = 0.2;
int cycleCount = 0;
float powerConsumption = 0.0;

// Timing Variables
unsigned long lastUpdateTime = 0;
unsigned long lastCommandCheckTime = 0;
unsigned long startTime = 0;
unsigned long lastCycleTime = 0;

// LED Blink Variables
unsigned long lastBlinkTime = 0;
bool ledState = false;

// WiFi Status
bool wifiConnected = false;

// HTTP Client
HTTPClient http;

// ==================== SETUP ====================
void setup() {
  // Initialize Serial Communication
  Serial.begin(115200);
  delay(1000);
  
  // Initialize LED Pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Record start time
  startTime = millis();
  
  // Display startup message
  printStartupMessage();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize random seed
  randomSeed(analogRead(0));
  
  Serial.println("\n[READY] Device initialized successfully!");
  Serial.println("Sending data to: http://" + String(SERVER_IP) + ":" + String(SERVER_PORT));
  Serial.println("Type HELP in Serial Monitor for commands\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  unsigned long currentTime = millis();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("[WiFi] Connection lost! Reconnecting...");
    connectToWiFi();
  }
  
  // Check for serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleSerialCommand(command);
  }
  
  // Update sensor data continuously
  updateSensorData();
  
  // Update LED based on motor state
  updateLED();
  
  // Send data to server every 5 seconds
  if (wifiConnected && currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
    sendDataToServer();
    lastUpdateTime = currentTime;
  }
  
  // Check for commands from server every 3 seconds
  if (wifiConnected && currentTime - lastCommandCheckTime >= COMMAND_CHECK_INTERVAL) {
    checkServerCommands();
    lastCommandCheckTime = currentTime;
  }
  
  // Increment cycle count every 30 seconds when motor is running
  if (currentState == RUNNING && currentTime - lastCycleTime >= 30000) {
    cycleCount++;
    lastCycleTime = currentTime;
    Serial.println("[INFO] Cleaning cycle completed. Count: " + String(cycleCount));
  }
}

// ==================== WIFI CONNECTION ====================
void connectToWiFi() {
  Serial.println("\n[WiFi] Connecting to: " + String(WIFI_SSID));
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n[WiFi] ✓ Connected!");
    Serial.println("[WiFi] IP Address: " + WiFi.localIP().toString());
    Serial.println("[WiFi] Signal Strength: " + String(WiFi.RSSI()) + " dBm");
    digitalWrite(LED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_PIN, LOW);
  } else {
    wifiConnected = false;
    Serial.println("\n[WiFi] ✗ Connection failed!");
    Serial.println("[WiFi] Check SSID and password");
  }
}

// ==================== SENSOR SIMULATION ====================
void updateSensorData() {
  // Simulate temperature changes based on motor state
  if (currentState == RUNNING) {
    temperature += random(5, 15) / 100.0;
    if (temperature > TEMP_MAX) temperature = TEMP_MAX;
  } else if (currentState == IDLE) {
    temperature -= random(2, 8) / 100.0;
    if (temperature < 40.0) temperature = 40.0;
  } else {
    temperature -= random(5, 12) / 100.0;
    if (temperature < TEMP_MIN) temperature = TEMP_MIN;
  }
  
  // Simulate motor RPM
  if (currentState == RUNNING) {
    motorRPM = random(1000, RPM_MAX);
  } else if (currentState == IDLE) {
    motorRPM = random(100, 300);
  } else {
    motorRPM = 0;
  }
  
  // Simulate vibration
  if (currentState == RUNNING) {
    vibration = random(20, 70) / 100.0;
  } else if (currentState == IDLE) {
    vibration = random(5, 20) / 100.0;
  } else {
    vibration = 0.0;
  }
  
  // Simulate power consumption
  if (currentState == RUNNING) {
    powerConsumption = random(25, 50) / 10.0;
  } else if (currentState == IDLE) {
    powerConsumption = random(5, 15) / 10.0;
  } else {
    powerConsumption = 0.0;
  }
}

// ==================== SEND DATA TO SERVER ====================
void sendDataToServer() {
  Serial.println("\n[HTTP] ═══════════════════════════════════");
  Serial.println("[HTTP] Sending sensor data to server...");
  
  // Create JSON payload in FLAT format (backend expects this!)
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["authToken"] = AUTH_TOKEN;  // MUST be in body!
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["rpm"] = motorRPM;
  doc["vibration"] = round(vibration * 10) / 10.0;
  doc["status"] = currentState == RUNNING ? "running" : (currentState == IDLE ? "idle" : "stopped");
  doc["power"] = round(powerConsumption * 10) / 10.0;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Print JSON to Serial Monitor
  Serial.println("[HTTP] Payload:");
  serializeJsonPretty(doc, Serial);
  Serial.println();
  
  // Send HTTP POST request
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/sensor-data";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  Serial.println("[HTTP] POST → " + url);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    Serial.println("[HTTP] ✓ Response Code: " + String(httpCode));
    
    if (httpCode == 200 || httpCode == 201) {
      String response = http.getString();
      Serial.println("[HTTP] Server Response:");
      Serial.println(response);
      Serial.println("[HTTP] ✓✓✓ DATA SENT SUCCESSFULLY! ✓✓✓");
    } else if (httpCode == 400) {
      Serial.println("[HTTP] ✗ Bad Request - Check data format");
      String response = http.getString();
      Serial.println(response);
    } else if (httpCode == 401) {
      Serial.println("[HTTP] ✗ Unauthorized - Check AUTH_TOKEN");
    } else if (httpCode == 404) {
      Serial.println("[HTTP] ✗ Device not found - Register device first");
    }
  } else {
    Serial.println("[HTTP] ✗ Error: " + http.errorToString(httpCode));
    Serial.println("[HTTP] Make sure backend server is running!");
    Serial.println("[HTTP] Check: http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/health");
  }
  
  http.end();
  Serial.println("[HTTP] ═══════════════════════════════════\n");
}

// ==================== CHECK SERVER COMMANDS ====================
void checkServerCommands() {
  Serial.println("[HTTP] Checking for commands from server...");
  
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/commands/" + String(DEVICE_ID);
  
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    
    // Parse JSON response
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      if (doc.containsKey("command")) {
        String command = doc["command"].as<String>();
        Serial.println("[HTTP] ✓ Command received: " + command);
        
        // Execute command
        executeCommand(command);
      } else {
        Serial.println("[HTTP] No pending commands");
      }
    }
  } else if (httpCode == 404) {
    Serial.println("[HTTP] No commands available");
  } else {
    Serial.println("[HTTP] Error checking commands: " + String(httpCode));
  }
  
  http.end();
}

// ==================== EXECUTE COMMAND ====================
void executeCommand(String command) {
  command.toUpperCase();
  
  Serial.println("\n[CMD] ═══════════════════════════════════");
  Serial.println("[CMD] Executing: " + command);
  
  if (command == "START" || command == "START_MOTOR") {
    currentState = RUNNING;
    Serial.println("[CMD] ✓ Motor started");
  }
  else if (command == "STOP" || command == "STOP_MOTOR") {
    currentState = STOPPED;
    motorRPM = 0;
    Serial.println("[CMD] ✓ Motor stopped");
  }
  else if (command == "IDLE") {
    currentState = IDLE;
    Serial.println("[CMD] ✓ Motor set to idle");
  }
  else if (command == "RESET") {
    cycleCount = 0;
    Serial.println("[CMD] ✓ Cycle count reset");
  }
  else if (command == "REBOOT") {
    Serial.println("[CMD] Rebooting ESP32...");
    delay(1000);
    ESP.restart();
  }
  else {
    Serial.println("[CMD] ✗ Unknown command: " + command);
  }
  
  Serial.println("[CMD] ═══════════════════════════════════\n");
  
  // Send acknowledgment to server
  sendCommandAcknowledgment(command, true);
}

// ==================== SEND COMMAND ACKNOWLEDGMENT ====================
void sendCommandAcknowledgment(String command, bool success) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["command"] = command;
  doc["success"] = success;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/command-ack";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    Serial.println("[HTTP] Command acknowledgment sent: " + String(httpCode));
  }
  
  http.end();
}

// ==================== LED CONTROL ====================
void updateLED() {
  unsigned long currentTime = millis();
  
  if (currentState == RUNNING) {
    if (currentTime - lastBlinkTime >= 1000) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      lastBlinkTime = currentTime;
    }
  } else if (currentState == IDLE) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}

// ==================== SERIAL COMMANDS ====================
void handleSerialCommand(String command) {
  command.toUpperCase();
  
  Serial.println("\n[SERIAL] Command: " + command);
  
  if (command == "START") {
    currentState = RUNNING;
    Serial.println("[SERIAL] ✓ Motor started");
  }
  else if (command == "STOP") {
    currentState = STOPPED;
    motorRPM = 0;
    Serial.println("[SERIAL] ✓ Motor stopped");
  }
  else if (command == "IDLE") {
    currentState = IDLE;
    Serial.println("[SERIAL] ✓ Motor set to idle");
  }
  else if (command == "RESET") {
    cycleCount = 0;
    Serial.println("[SERIAL] ✓ Cycle count reset");
  }
  else if (command == "STATUS") {
    printStatus();
  }
  else if (command == "WIFI") {
    printWiFiStatus();
  }
  else if (command == "RECONNECT") {
    connectToWiFi();
  }
  else if (command == "TEST") {
    Serial.println("[SERIAL] Sending test data to server...");
    sendDataToServer();
  }
  else if (command == "HELP") {
    printHelp();
  }
  else if (command == "REBOOT") {
    Serial.println("[SERIAL] Rebooting ESP32...");
    delay(1000);
    ESP.restart();
  }
  else {
    Serial.println("[SERIAL] ✗ Unknown command. Type HELP");
  }
  
  Serial.println();
}

// ==================== HELPER FUNCTIONS ====================

void printStartupMessage() {
  Serial.println("\n\n");
  Serial.println("═════════════════════════════════════════");
  Serial.println("  LensClear IoT - Web Connected Test");
  Serial.println("═════════════════════════════════════════");
  Serial.println("Device ID: " + String(DEVICE_ID));
  Serial.println("Device Name: " + String(DEVICE_NAME));
  Serial.println("Version: 2.0.0 (WiFi + HTTP)");
  Serial.println("═════════════════════════════════════════");
  Serial.println("Hardware: ESP32 DevKit V1");
  Serial.println("CPU: " + String(ESP.getCpuFreqMHz()) + " MHz");
  Serial.println("Flash: " + String(ESP.getFlashChipSize() / 1024 / 1024) + " MB");
  Serial.println("Free Heap: " + String(ESP.getFreeHeap() / 1024) + " KB");
  Serial.println("═════════════════════════════════════════");
}

void printStatus() {
  Serial.println("\n═════════════════════════════════════════");
  Serial.println("           CURRENT STATUS");
  Serial.println("═════════════════════════════════════════");
  Serial.println("Motor State: " + String(stateNames[currentState]));
  Serial.println("Temperature: " + String(temperature, 1) + "°C");
  Serial.println("Motor RPM: " + String(motorRPM));
  Serial.println("Vibration: " + String(vibration, 1) + "g");
  Serial.println("Cycle Count: " + String(cycleCount));
  Serial.println("Power: " + String(powerConsumption, 1) + "W");
  Serial.println("Uptime: " + String((millis() - startTime) / 1000) + "s");
  Serial.println("Free Memory: " + String(ESP.getFreeHeap() / 1024) + "KB");
  Serial.println("═════════════════════════════════════════\n");
}

void printWiFiStatus() {
  Serial.println("\n═════════════════════════════════════════");
  Serial.println("           WiFi STATUS");
  Serial.println("═════════════════════════════════════════");
  Serial.println("Status: " + String(wifiConnected ? "Connected" : "Disconnected"));
  if (wifiConnected) {
    Serial.println("SSID: " + String(WIFI_SSID));
    Serial.println("IP Address: " + WiFi.localIP().toString());
    Serial.println("Signal: " + String(WiFi.RSSI()) + " dBm");
    Serial.println("Server: http://" + String(SERVER_IP) + ":" + String(SERVER_PORT));
  }
  Serial.println("═════════════════════════════════════════\n");
}

void printHelp() {
  Serial.println("\n═════════════════════════════════════════");
  Serial.println("         AVAILABLE COMMANDS");
  Serial.println("═════════════════════════════════════════");
  Serial.println("START      - Start motor");
  Serial.println("STOP       - Stop motor");
  Serial.println("IDLE       - Set motor to idle");
  Serial.println("RESET      - Reset cycle count");
  Serial.println("STATUS     - Show current status");
  Serial.println("WIFI       - Show WiFi status");
  Serial.println("RECONNECT  - Reconnect to WiFi");
  Serial.println("TEST       - Send test data to server");
  Serial.println("REBOOT     - Restart ESP32");
  Serial.println("HELP       - Show this help");
  Serial.println("═════════════════════════════════════════");
  Serial.println("TIP: Commands are case-insensitive");
  Serial.println("═════════════════════════════════════════\n");
}

/************************************
 * SETUP INSTRUCTIONS:
 * 
 * 1. UPDATE CONFIGURATION (lines 24-30):
 *    - WIFI_SSID: Your WiFi network name
 *    - WIFI_PASSWORD: Your WiFi password
 *    - SERVER_IP: Your computer's IP address
 *      (Windows: ipconfig, Mac/Linux: ifconfig)
 * 
 * 2. START BACKEND SERVER:
 *    cd backend
 *    npm start
 * 
 * 3. UPLOAD CODE TO ESP32:
 *    - Select Board: ESP32 Dev Module
 *    - Select Port: (your ESP32 port)
 *    - Click Upload
 * 
 * 4. OPEN SERIAL MONITOR:
 *    - Baud rate: 115200
 *    - Watch for WiFi connection
 *    - See data being sent to server
 * 
 * 5. TEST FROM WEBSITE:
 *    - Open http://localhost:5173
 *    - Login to dashboard
 *    - Send commands to ESP32
 *    - Watch Serial Monitor for responses
 * 
 * TROUBLESHOOTING:
 * - WiFi won't connect? Check SSID/password
 * - HTTP errors? Ensure backend is running
 * - No response? Check SERVER_IP is correct
 * - Firewall? Allow port 5000
 ************************************/
