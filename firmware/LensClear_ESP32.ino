/**
 * LensClear IoT Device Firmware
 * Platform: ESP32
 * Dependencies:
 *  - Firebase ESP32 Client (by Mobizt)
 *  - ArduinoJson
 */

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// --- CONFIGURATION ---

// WiFi Credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Config
#define API_KEY "AIzaSyDvzrL8zXX0ZYgsdIL8bpRykVeFVepb68s"
#define FIREBASE_PROJECT_ID "lens-clear"

// Device Identity
#define DEVICE_ID "DEV-001" // Unique ID for this device
#define DEVICE_NAME "Living Room Monitor"

// --- GLOBALS ---

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
unsigned long checkControlPrevMillis = 0;
bool signupOK = false;

// Mock Sensor Data
float temperature = 24.0;
float humidity = 45.0;
int battery = 100;
int signalStrength = -60;
float pm25 = 12.5;
int co2 = 400;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Configure Firebase
  config.api_key = API_KEY;
  config.database_url = ""; // Not needed for Firestore-only, but good practice if using RTDB
  config.token_status_callback = tokenStatusCallback; // see addons/TokenHelper.h

  // Anonymous Sign-in (or use email/pass if configured)
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Auth Success");
    signupOK = true;
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready() && signupOK) {
    
    // 1. Send Sensor Data (Every 5 seconds)
    if (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0) {
      sendDataPrevMillis = millis();
      updateSensors();
      sendToFirestore();
    }

    // 2. Check for Controls (Every 3 seconds)
    // Note: In a real app, you might use a stream or a faster poll
    if (millis() - checkControlPrevMillis > 3000 || checkControlPrevMillis == 0) {
      checkControlPrevMillis = millis();
      // Implementation for checking pending commands would go here
      // Typically reading from devices/{DEVICE_ID}/control collection
    }
  }
}

void updateSensors() {
  // Simulate sensor fluctuation
  temperature += ((random(0, 20) - 10) / 10.0);
  humidity += ((random(0, 20) - 10) / 10.0);
  
  // Clamp values
  if (temperature < 15) temperature = 15;
  if (temperature > 35) temperature = 35;
  if (humidity < 30) humidity = 30;
  if (humidity > 90) humidity = 90;
  
  signalStrength = WiFi.RSSI();
  battery = max(0, battery - 1); // Drain battery slowly
}

void sendToFirestore() {
  String documentPath = "devices/" + String(DEVICE_ID);
  
  FirebaseJson content;
  content.set("fields/name/stringValue", DEVICE_NAME);
  content.set("fields/status/stringValue", "online");
  content.set("fields/temperature/doubleValue", temperature);
  content.set("fields/humidity/doubleValue", humidity);
  content.set("fields/battery/integerValue", battery);
  content.set("fields/signal/integerValue", signalStrength);
  content.set("fields/pm25/doubleValue", pm25);
  content.set("fields/co2/integerValue", co2);
  content.set("fields/updatedAt/timestampValue", "SERVER_TIMESTAMP"); // Placeholder, actual timestamp logic varies by library version

  // Note: The FirebaseESP32 library's Firestore support is basic. 
  // We use patchDocument to update fields without overwriting the whole doc.
  
  if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw(), "name,status,temperature,humidity,battery,signal,pm25,co2")) {
      Serial.println("Data sent to Firestore!");
      
      // Also add to history subcollection
      String historyPath = "devices/" + String(DEVICE_ID) + "/history";
      FirebaseJson historyContent;
      historyContent.set("fields/temperature/doubleValue", temperature);
      historyContent.set("fields/humidity/doubleValue", humidity);
      historyContent.set("fields/timestamp/timestampValue", "SERVER_TIMESTAMP"); // Needs proper ISO string in C++ usually
      
      Firebase.Firestore.createDocument(&fbdo, FIREBASE_PROJECT_ID, "", historyPath.c_str(), historyContent.raw());
      
  } else {
      Serial.println(fbdo.errorReason());
  }
}
