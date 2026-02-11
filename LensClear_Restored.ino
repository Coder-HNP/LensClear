#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ---------------------------------------------------------
// 1. WIFI CONFIGURATION
// ---------------------------------------------------------
const char* WIFI_SSID = "ACT-1";        
const char* WIFI_PASSWORD = "Bosshnp2011"; 

// ---------------------------------------------------------
// 2. BACKEND CONFIGURATION
// ---------------------------------------------------------
const char* SERVER_IP = "192.168.0.107";  
const int SERVER_PORT = 5000;             

// ---------------------------------------------------------
// 3. DEVICE CONFIGURATION (From your Account)
// ---------------------------------------------------------
#define DEVICE_ID "101"
#define AUTH_TOKEN "fb269c79-dbbb-439c-a407-5cc11d8fd724"

// ---------------------------------------------------------
// HARDWARE PINS
// ---------------------------------------------------------
const int SERVO_PIN = 0;       
#define LED_PIN 2

#define UPDATE_INTERVAL 5000      
#define COMMAND_CHECK_INTERVAL 3000  

// ---------------------------------------------------------
// GLOBALS
// ---------------------------------------------------------
Servo myServo;
bool sweepOn = false;
bool wifiConnected = false;
unsigned long lastUpdate = 0;
unsigned long lastCmdCheck = 0;
unsigned long lastStep = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(LED_PIN, OUTPUT);
  myServo.attach(SERVO_PIN, 500, 2400);    
  myServo.write(0);              

  Serial.println("\n--- LensClear Restored (Auto-ID) ---");
  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectWiFi();
  }

  if (wifiConnected) {
    if (now - lastUpdate >= UPDATE_INTERVAL) {
      sendSensorData();
      lastUpdate = now;
    }
    
    if (now - lastCmdCheck >= COMMAND_CHECK_INTERVAL) {
      pollCommands();
      lastCmdCheck = now;
    }
  }

  handleServo(now);
}

void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500); Serial.print("."); attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n[WiFi] ✓ Connected!");
  }
}

void sendSensorData() {
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/sensor-data";
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["authToken"] = AUTH_TOKEN;
  doc["temperature"] = 45.0 + (random(1, 10) / 10.0);
  doc["status"] = sweepOn ? "running" : "idle";
  
  String json;
  serializeJson(doc, json);

  int code = http.POST(json);
  if (code == 200) {
    Serial.println("[Sensor] Sent OK (200)");
  } else {
    String res = http.getString();
    Serial.printf("[Sensor] ❌ Error %d: %s\n", code, res.c_str());
  }
  http.end();
}

void pollCommands() {
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/commands/" + String(DEVICE_ID);
  HTTPClient http;
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));
  
  int code = http.GET();
  if (code == 200) {
    String res = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, res);
    
    if (doc.containsKey("command")) {
      String cmd = doc["command"].as<String>();
      String cmdId = doc["id"].as<String>();
      Serial.println("[Command] 🚀 GOT: " + cmd);
      bool ok = runCommand(cmd);
      sendAck(cmdId, ok);
    }
  } else if (code != 404) {
    Serial.printf("[Command] ❌ Error %d\n", code);
  }
  http.end();
}

bool runCommand(String cmd) {
  cmd.toUpperCase();
  if (cmd == "START") { sweepOn = true; return true; }
  if (cmd == "STOP") { sweepOn = false; return true; }
  return false;
}

void sendAck(String cmdId, bool ok) {
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/commands/ack";
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<128> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["commandId"] = cmdId;
  doc["success"] = ok;
  
  String json;
  serializeJson(doc, json);
  http.POST(json);
  http.end();
}

void handleServo(unsigned long now) {
  if (sweepOn) {
    if (now - lastStep >= 20) {
      lastStep = now;
      static int angle = 0;
      static int dir = 1;
      angle += dir;
      if (angle >= 120 || angle <= 0) dir *= -1;
      myServo.write(angle);
    }
  } else {
    myServo.write(0);
  }
}
