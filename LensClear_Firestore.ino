#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// --- WiFi Configuration ---
const char* WIFI_SSID = "ACT-1";        
const char* WIFI_PASSWORD = "Bosshnp2011"; 

// --- Firebase Configuration ---
const char* FIREBASE_HOST = "firestore.googleapis.com";
const char* PROJECT_ID = "lens-clear";
// IMPORTANT: Get your User ID (UID) from the App Profile and paste it below
const char* USER_ID = "PASTE_YOUR_USER_ID_HERE"; 

// --- Device Configuration ---
#define DEVICE_ID "101"
#define DEVICE_NAME "Room"
#define AUTH_TOKEN "fb269c79-dbbb-439c-a407-5cc11d8fd724"

// --- Servo Configuration ---
const int SERVO_PIN = 0;       
const int MIN_ANGLE = 0;
const int MAX_ANGLE = 120;
const int START_ANGLE = 0;

// --- Timings ---
#define UPDATE_INTERVAL 5000      
#define COMMAND_CHECK_INTERVAL 3000  
const unsigned long stepInterval = 30; 

#define LED_PIN 2

// --- Globals ---
Servo myServo;
bool sweepOn = false;
int currentAngle = START_ANGLE;
int targetAngle = START_ANGLE;
int stepDir = 1;               
unsigned long lastStepTime = 0;
bool wifiConnected = false;
unsigned long lastUpdateTime = 0;
unsigned long lastCommandCheckTime = 0;
int motionPhase = 0;    
float temperature = 45.0;
int motorRPM = 0;

WiFiClientSecure client;

// --- Motion Intervals ---
const unsigned long SERVO_INTERVAL_SLOW = 40;  
const unsigned long SERVO_INTERVAL_MID  = 20;  
const unsigned long SERVO_INTERVAL_FAST = 8;   

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n[INIT] Attaching Servo...");
  myServo.setPeriodHertz(50);              
  myServo.attach(SERVO_PIN, 500, 2400);    
  myServo.write(START_ANGLE);              

  Serial.println("═════════════════════════════════════════");
  Serial.println("   LensClear Firestore Firmware");
  Serial.println("═════════════════════════════════════════");
  Serial.println("Device ID: " + String(DEVICE_ID));
  
  // Set SSL client to insecure for testing (ignores certificate check)
  client.setInsecure();

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
      sendDataToFirestore();
      lastUpdateTime = currentTime;
    }
    
    if (currentTime - lastCommandCheckTime >= COMMAND_CHECK_INTERVAL) {
      checkFirestoreCommands();
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

void updateServo(unsigned long now) {
  if (sweepOn) {
    unsigned long interval;
    switch (motionPhase) {
      case 0: interval = SERVO_INTERVAL_SLOW; break;
      case 1: interval = SERVO_INTERVAL_FAST; break;
      case 2: interval = SERVO_INTERVAL_MID;  break;
      case 3: interval = SERVO_INTERVAL_MID;  break;
      case 4: interval = SERVO_INTERVAL_MID;  break;
      case 5: interval = SERVO_INTERVAL_FAST; break;
      case 6: interval = SERVO_INTERVAL_MID;  break;
      default: interval = SERVO_INTERVAL_MID; break;
    }

    if (now - lastStepTime >= interval) {
      lastStepTime = now;
      if (currentAngle != targetAngle) {
        currentAngle += stepDir;
        myServo.write(currentAngle);
      } else {
        switch (motionPhase) {
          case 0: motionPhase = 1; targetAngle = 60; stepDir = +1; break;
          case 1: motionPhase = 2; targetAngle = 120; stepDir = +1; break;
          case 2: motionPhase = 3; targetAngle = 60; stepDir = -1; break;
          case 3: motionPhase = 4; targetAngle = 120; stepDir = +1; break;
          case 4: motionPhase = 5; targetAngle = 25; stepDir = -1; break;
          case 5: motionPhase = 6; targetAngle = 0; stepDir = -1; break;
          case 6: 
          default:
            sweepOn = false;            
            motionPhase = 0;
            targetAngle = START_ANGLE;  
            Serial.println("[AUTO] Custom motion profile complete");
            break;
        }
      }
    }
  } else {
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
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
  }
}

void sendDataToFirestore() {
  if (!wifiConnected) return;

  if (sweepOn) {
    motorRPM = 1200; 
    temperature += 0.1; if (temperature > 55) temperature = 55;
  } else {
    motorRPM = 0;
    temperature -= 0.1; if (temperature < 35) temperature = 35;
  }

  // Firestore Document Link: users/{userId}/devices/{deviceId}
  String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) + 
               "/databases/(default)/documents/users/" + String(USER_ID) + 
               "/devices/" + String(DEVICE_ID) + "?updateMask.fieldPaths=status&updateMask.fieldPaths=battery&updateMask.fieldPaths=temperature&updateMask.fieldPaths=rpm";

  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  JsonObject fields = doc.createNestedObject("fields");
  fields["status"]["stringValue"] = sweepOn ? "running" : "idle";
  fields["battery"]["integerValue"] = 90;
  fields["temperature"]["doubleValue"] = round(temperature * 10) / 10.0;
  fields["rpm"]["integerValue"] = motorRPM;
  
  String jsonString;
  serializeJson(doc, jsonString);

  // Use PATCH to update existing fields only
  int httpCode = http.PATCH(jsonString);
  if (httpCode > 0) {
    Serial.printf("[Firestore] Update Code: %d\n", httpCode);
  } else {
    Serial.printf("[Firestore] Error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void checkFirestoreCommands() {
  if (!wifiConnected) return;

  // Query the 'commands' sub-collection
  String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) + 
               "/databases/(default)/documents/users/" + String(USER_ID) + 
               "/devices/" + String(DEVICE_ID) + "/commands?pageSize=1&orderBy=timestamp%20desc";

  HTTPClient http;
  http.begin(client, url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("documents")) {
      String command = doc["documents"][0]["fields"]["command"]["stringValue"].as<String>();
      Serial.println("[Firestore] Received Command: " + command);
      executeCommand(command);
    }
  }
  http.end();
}

void executeCommand(String command) {
  command.toUpperCase();
  if (command == "START" || command == "START_MOTOR" || command == "CALIBRATE") {
    sweepOn = true; motionPhase = 0; currentAngle = START_ANGLE; targetAngle = 25; stepDir = +1;
  }
  else if (command == "STOP" || command == "STOP_MOTOR" || command == "IDLE") {
    sweepOn = false; targetAngle = START_ANGLE;
  }
  else if (command == "REBOOT") {
    ESP.restart();
  }
}

void handleSerialCommand(String command) {
  executeCommand(command);
}
