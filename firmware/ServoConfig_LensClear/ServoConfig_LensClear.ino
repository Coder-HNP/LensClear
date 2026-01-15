#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

const char* WIFI_SSID     = "Redmi K20";
const char* WIFI_PASSWORD = "gokul13092000";
const char* SERVER_IP     = "192.168.242.96";
const int   SERVER_PORT   = 5000;

#define DEVICE_ID   "PROTO_TEST_UNIT_001"
#define DEVICE_NAME "G001"
#define AUTH_TOKEN  "bbfa0d1cf34fccbd651f1f1eb2df6ff82c680899f5e53f2d084952b4b9ed0f2d"

const int SERVO_PIN    = 1;
const int MIN_ANGLE    = 0;
const int MAX_ANGLE    = 120;
const int START_ANGLE  = 0;

#define UPDATE_INTERVAL        5000
#define COMMAND_CHECK_INTERVAL 3000

const unsigned long stepInterval = 30;

#define LED_PIN 2

Servo myServo;
bool sweepOn       = false;
int  currentAngle  = START_ANGLE;
int  targetAngle   = START_ANGLE;
int  stepDir       = 1;
unsigned long lastStepTime = 0;

bool wifiConnected = false;
HTTPClient http;

unsigned long lastUpdateTime       = 0;
unsigned long lastCommandCheckTime = 0;
unsigned long startTime            = 0;

float temperature = 45.0;
int   motorRPM    = 0;
int   cycleCount  = 0;   // kept for compatibility (unused now)

// ---- Custom motion profile config ----
// You can tune these three values to adjust slow/mid/fast speeds
const unsigned long SERVO_INTERVAL_SLOW = 40;  // 0–25° and 25–0°
const unsigned long SERVO_INTERVAL_MID  = 20;  // 60–120°, 120–60°, etc.
const unsigned long SERVO_INTERVAL_FAST = 8;   // 25–60° and 120–25°

int motionPhase = 0;    // 0..6 – which segment of the motion we are in

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n[INIT] Attaching Servo...");
  myServo.setPeriodHertz(50);
  myServo.attach(SERVO_PIN, 500, 2400);
  myServo.write(START_ANGLE);

  startTime = millis();

  Serial.println("═════════════════════════════════════════");
  Serial.println("   LensClear Final Firmware (Merged)");
  Serial.println("═════════════════════════════════════════");
  Serial.println("Device ID: " + String(DEVICE_ID));
  Serial.println("Servo Pin: " + String(SERVO_PIN));

  connectToWiFi();
}

void loop() {
  unsigned long currentTime = millis();

  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("[WiFi] Lost connection! Reconnecting...");
    connectToWiFi();
  }

  if (wifiConnected) {
    if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
      sendDataToServer();
      lastUpdateTime = currentTime;
    }

    if (currentTime - lastCommandCheckTime >= COMMAND_CHECK_INTERVAL) {
      checkServerCommands();
      lastCommandCheckTime = currentTime;
    }
  }

  updateServo(currentTime);

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    handleSerialCommand(cmd);
  }
}

// === NEW SERVO LOGIC HERE ===
// Custom profile:
// 0 → 25°  (slow)
// 25 → 60° (fast)
// 60 → 120° (mid)
// 120 → 60° (mid)
// 60 → 120° (mid)
// 120 → 25° (fast)
// 25 → 0° (mid) then stop at 0°
void updateServo(unsigned long now) {
  if (sweepOn) {
    // Choose step interval based on current motion phase
    unsigned long interval;

    switch (motionPhase) {
      case 0: // 0 → 25° (slow)
        interval = SERVO_INTERVAL_SLOW;
        break;
      case 1: // 25 → 60° (fast)
        interval = SERVO_INTERVAL_FAST;
        break;
      case 2: // 60 → 120° (mid)
        interval = SERVO_INTERVAL_MID;
        break;
      case 3: // 120 → 60° (mid)
        interval = SERVO_INTERVAL_MID;
        break;
      case 4: // 60 → 120° (mid again)
        interval = SERVO_INTERVAL_MID;
        break;
      case 5: // 120 → 25° (fast)
        interval = SERVO_INTERVAL_FAST;
        break;
      case 6: // 25 → 0° (mid)
        interval = SERVO_INTERVAL_MID;
        break;
      default:
        interval = SERVO_INTERVAL_MID;
        break;
    }

    if (now - lastStepTime >= interval) {
      lastStepTime = now;

      if (currentAngle != targetAngle) {
        // Move one degree in the direction of stepDir
        currentAngle += stepDir;
        myServo.write(currentAngle);
      } else {
        // Reached current target – set up next segment in the sequence
        switch (motionPhase) {
          case 0: // finished 0 → 25, now 25 → 60 (fast)
            motionPhase = 1;
            targetAngle = 60;
            stepDir = +1;
            break;

          case 1: // finished 25 → 60, now 60 → 120 (mid)
            motionPhase = 2;
            targetAngle = 120;
            stepDir = +1;
            break;

          case 2: // finished 60 → 120, now 120 → 60 (mid)
            motionPhase = 3;
            targetAngle = 60;
            stepDir = -1;
            break;

          case 3: // finished 120 → 60, now 60 → 120 (mid again)
            motionPhase = 4;
            targetAngle = 120;
            stepDir = +1;
            break;

          case 4: // finished 60 → 120, now 120 → 25 (fast)
            motionPhase = 5;
            targetAngle = 25;
            stepDir = -1;
            break;

          case 5: // finished 120 → 25, now 25 → 0 (mid)
            motionPhase = 6;
            targetAngle = 0;
            stepDir = -1;
            break;

          case 6: // finished 25 → 0 → end of profile
          default:
            sweepOn = false;            // stop the profile
            motionPhase = 0;
            targetAngle = START_ANGLE;  // should be 0 anyway
            Serial.println("[AUTO] Custom motion profile complete");
            break;
        }
      }
    }

  } else {
    // If stopped, gently return and hold at START_ANGLE (0°) – same behavior idea as before
    if (currentAngle != START_ANGLE && now - lastStepTime >= stepInterval) {
      lastStepTime = now;
      if (currentAngle > START_ANGLE) currentAngle--;
      else if (currentAngle < START_ANGLE) currentAngle++;
      myServo.write(currentAngle);
    }
  }
}

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
    Serial.println("[WiFi] IP: " + WiFi.localIP().toString());
    digitalWrite(LED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_PIN, LOW);
  } else {
    wifiConnected = false;
    Serial.println("\n[WiFi] ✗ Connection failed. Retrying in loop...");
  }
}

void sendDataToServer() {
  if (!wifiConnected) return;

  if (sweepOn) {
    motorRPM = 1200;
    temperature += 0.1;
    if (temperature > 55) temperature = 55;
  } else {
    motorRPM = 0;
    temperature -= 0.1;
    if (temperature < 35) temperature = 35;
  }

  StaticJsonDocument<512> doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["authToken"] = AUTH_TOKEN;

  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["rpm"]         = motorRPM;
  doc["vibration"]   = sweepOn ? 0.3 : 0.0;
  doc["status"]      = sweepOn ? "running" : "idle";
  doc["power"]       = sweepOn ? 4.5 : 0.5;

  String jsonString;
  serializeJson(doc, jsonString);

  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/sensor-data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonString);

  if (httpCode > 0) {
    // Optionally handle OK response
  } else {
    Serial.println("[HTTP] Error sending data: " + http.errorToString(httpCode));
  }

  http.end();
}

void checkServerCommands() {
  if (!wifiConnected) return;

  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/commands/" + String(DEVICE_ID);

  http.begin(url);
  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));

  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (!error && doc.containsKey("command")) {
      String command = doc["command"].as<String>();
      Serial.println("[HTTP] Received Command: " + command);
      executeCommand(command);
    }
  }

  http.end();
}

void executeCommand(String command) {
  command.toUpperCase();

  bool success = true;

  if (command == "START" || command == "START_MOTOR" || command == "CALIBRATE") {
    sweepOn      = true;
    motionPhase  = 0;               // start from first segment
    currentAngle = START_ANGLE;     // ensure we start from 0°
    targetAngle  = 25;              // first segment: 0 → 25° (slow)
    stepDir      = +1;              // moving upwards
    Serial.println("[CMD] Starting custom motion profile");
  }
  else if (command == "STOP" || command == "STOP_MOTOR") {
    sweepOn     = false;
    targetAngle = START_ANGLE;
    Serial.println("[CMD] Motor STOPPED");
  }
  else if (command == "IDLE") {
    sweepOn     = false;
    targetAngle = START_ANGLE;
    Serial.println("[CMD] Motor IDLE");
  }
  else if (command == "RESET") {
    cycleCount = 0;
    Serial.println("[CMD] Cycle count RESET");
  }
  else if (command == "REBOOT") {
    Serial.println("[CMD] Rebooting...");
    ESP.restart();
  }
  else {
    Serial.println("[CMD] Unknown command: " + command);
    success = false;
  }

  sendCommandAck(command, success);
}

void sendCommandAck(String command, bool success) {
  StaticJsonDocument<256> doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["command"]   = command;
  doc["success"]   = success;
  doc["timestamp"] = millis();

  String jsonString;
  serializeJson(doc, jsonString);

  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/command-ack";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));

  http.POST(jsonString);
  http.end();
}

void handleSerialCommand(String command) {
  command.toUpperCase();
  executeCommand(command);
}
