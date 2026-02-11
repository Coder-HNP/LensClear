/*
 * LensClear ESP32 IoT Firmware
 * 
 * Features:
 * - Non-blocking WiFi & MQTT connection re-tries
 * - Robust Command Handling (JSON)
 * - Fixed Speed Motor Control
 * - Heartbeat/Sensor Reporting
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================
// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT Broker Configuration
const char* MQTT_SERVER = "192.168.1.100";  // Your backend server IP
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "ESP32_001";  // Unique device ID
const char* AUTH_TOKEN = "your_device_auth_token_here"; 

// Pin Definitions
#define MOTOR_PIN1 25
#define MOTOR_PIN2 26
#define MOTOR_PWM_PIN 27 // Still used for Enable/Speed but fixed at max
#define DHT_PIN 4
#define LED_STATUS 2
#define LED_ERROR 15

// Sensor Configuration
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Motor Configuration
#define PWM_CHANNEL 0
#define PWM_FREQUENCY 5000
#define PWM_RESOLUTION 8
const int MOTOR_SPEED_FULL = 255;

// Timing Configuration
const long SENSOR_INTERVAL = 5000;
const long WIFI_RETRY_INTERVAL = 5000;
const long MQTT_RETRY_INTERVAL = 5000;

// ==================== GLOBAL VARIABLES ====================
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastSensorUpdate = 0;
unsigned long lastWiFiRetry = 0;
unsigned long lastMqttRetry = 0;
bool motorRunning = false;

// MQTT Topics
String topicCommandMotor;
String topicSensorData;
String topicStatus;
String topicResponse;

// ==================== FUNCTION DECLARATIONS ====================
void connectWiFi();
void connectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishSensorData();
void publishStatus(const char* status);
void executeCommand(JsonDocument& doc);
void startMotor();
void stopMotor();
void runCleaningCycle(int durationMs);
float readTemperature();
void blinkLED(int pin, int times);

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000); // Allow serial to stabilize

  Serial.println("\n\n=== LensClear ESP32 Firmware Starting ===");
  Serial.println("Device ID: " + String(DEVICE_ID));

  // Initialize Pins
  pinMode(MOTOR_PIN1, OUTPUT);
  pinMode(MOTOR_PIN2, OUTPUT);
  pinMode(LED_STATUS, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);

  // Setup PWM
  ledcSetup(PWM_CHANNEL, PWM_FREQUENCY, PWM_RESOLUTION);
  ledcAttachPin(MOTOR_PWM_PIN, PWM_CHANNEL);

  // Initialize Sensors
  dht.begin();
  
  // Initial State
  stopMotor();

  // Define Topics
  topicCommandMotor = "devices/" + String(DEVICE_ID) + "/commands/motor";
  topicSensorData = "devices/" + String(DEVICE_ID) + "/sensors/data";
  topicStatus = "devices/" + String(DEVICE_ID) + "/status";
  topicResponse = "devices/" + String(DEVICE_ID) + "/response";

  // MQTT Client Setup
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  // Initial Connection Attempt (Blocking just for startup is okay, but we use non-blocking loop later)
  connectWiFi();
}

// ==================== MAIN LOOP ====================
void loop() {
  unsigned long currentMillis = millis();

  // 1. Maintain WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    if (currentMillis - lastWiFiRetry >= WIFI_RETRY_INTERVAL) {
      lastWiFiRetry = currentMillis;
      connectWiFi();
    }
  } 
  // 2. Maintain MQTT Connection (only if WiFi is up)
  else {
    if (!mqttClient.connected()) {
      if (currentMillis - lastMqttRetry >= MQTT_RETRY_INTERVAL) {
        lastMqttRetry = currentMillis;
        connectMQTT();
      }
    } else {
      // Client connected, process incoming
      mqttClient.loop();
      
      // 3. Publish Data Periodically
      if (currentMillis - lastSensorUpdate >= SENSOR_INTERVAL) {
        lastSensorUpdate = currentMillis;
        publishSensorData();
      }
    }
  }

  // Alive blink
  if (currentMillis % 2000 < 100) {
      digitalWrite(LED_STATUS, HIGH);
  } else {
      digitalWrite(LED_STATUS, LOW);
  }
}

// ==================== WIFI & MQTT ====================
void connectWiFi() {
  Serial.println("[WiFi] Connecting to " + String(WIFI_SSID) + "...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  // We don't block here with 'while', check status in next loop iteration
  // But for initial connect, a small check is fine.
  // Actually, WiFi.begin returns immediately. The loop checks status.
}

void connectMQTT() {
  Serial.print("[MQTT] Connecting to broker...");
  
  // Connect with ID, User, Pass (User/Pass same for simplicity or as config)
  if (mqttClient.connect(DEVICE_ID, DEVICE_ID, AUTH_TOKEN)) {
    Serial.println(" Connected!");
    digitalWrite(LED_ERROR, LOW);
    
    // Subscribe
    mqttClient.subscribe(topicCommandMotor.c_str());
    Serial.println("Subscribed to: " + topicCommandMotor);
    
    // Announce Online
    publishStatus("online");
  } else {
    Serial.print(" Failed (rc=");
    Serial.print(mqttClient.state());
    Serial.println(")");
    digitalWrite(LED_ERROR, HIGH);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message on [");
  Serial.print(topic);
  Serial.print("]: ");
  
  // Limit payload size to prevent overflow
  if (length > 256) length = 256;
  
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Use serializeJson to pretty print to serial for debug
  serializeJson(doc, Serial);
  Serial.println();

  executeCommand(doc);
}

// ==================== COMMAND EXECUTION ====================
void executeCommand(JsonDocument& doc) {
  const char* command = doc["command"];
  bool success = true;
  String errorMsg = "";
  unsigned long startTime = millis();

  Serial.print("CMD: ");
  Serial.println(command);

  if (strcmp(command, "START") == 0 || strcmp(command, "start_motor") == 0) {
    startMotor(); // Fixed speed
  }
  else if (strcmp(command, "STOP") == 0 || strcmp(command, "stop_motor") == 0) {
    stopMotor();
  }
  else if (strcmp(command, "CYCLE") == 0 || strcmp(command, "run_cycle") == 0) {
    // Run cycle: e.g. run for 5 seconds then stop
    // Note: Since this is blocking 'delay', it might block MQTT keepalives. 
    // In production, use state machine. For now, short delays are Acceptable.
    // Or better: set a flag 'cycleActive' and handle in loop.
    // For simplicity of this refactor, we'll do a simple blocking sequence 
    // BUT we must call mqttClient.loop() if it's long.
    
    Serial.println("Starting cleaning cycle...");
    startMotor();
    unsigned long cycleStart = millis();
    while (millis() - cycleStart < 5000) {
        // Keep MQTT alive
        if (millis() % 100 == 0) mqttClient.loop(); 
        delay(10); 
    }
    stopMotor();
    Serial.println("Cycle complete.");
  }
  else if (strcmp(command, "PING") == 0) {
    String msg = "PING";
    if (doc["parameters"].containsKey("message")) {
        msg = doc["parameters"]["message"].as<String>();
    }
    Serial.print("🔔 PING RECEIVED: ");
    Serial.println(msg);
  }
  else {
    success = false;
    errorMsg = "Unknown command";
    Serial.println("Unknown command received");
  }

  // Send ACK
  StaticJsonDocument<256> resp;
  resp["success"] = success;
  resp["command"] = command;
  resp["responseTime"] = millis() - startTime;
  if (!success) resp["error"] = errorMsg;

  char buffer[256];
  serializeJson(resp, buffer);
  mqttClient.publish(topicResponse.c_str(), buffer);
}

// ==================== MOTOR LOGIC ====================
void startMotor() {
  digitalWrite(MOTOR_PIN1, HIGH);
  digitalWrite(MOTOR_PIN2, LOW);
  ledcWrite(PWM_CHANNEL, MOTOR_SPEED_FULL); // Always full speed
  motorRunning = true;
  publishStatus("running");
  Serial.println("Motor STARTED (Full Speed)");
}

void stopMotor() {
  digitalWrite(MOTOR_PIN1, LOW);
  digitalWrite(MOTOR_PIN2, LOW);
  ledcWrite(PWM_CHANNEL, 0);
  motorRunning = false;
  publishStatus("idle");
  Serial.println("Motor STOPPED");
}

// ==================== SENSORS ====================
void publishSensorData() {
  float temp = dht.readTemperature();
  if (isnan(temp)) temp = 0.0;
  
  // Simulated RPM for feedback
  int rpm = motorRunning ? 3000 : 0;

  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["rpm"] = rpm;
  doc["timestamp"] = millis(); // Backend will overwrite with server time
  
  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(topicSensorData.c_str(), buffer);
  
  Serial.print("Sent Telemetry: ");
  Serial.println(buffer);
}

void publishStatus(const char* status) {
  StaticJsonDocument<128> doc;
  doc["status"] = status;
  
  char buffer[128];
  serializeJson(doc, buffer);
  mqttClient.publish(topicStatus.c_str(), buffer, true); // Retained
}

void blinkLED(int pin, int times) {
  for(int i=0; i<times; i++) {
    digitalWrite(pin, !digitalRead(pin));
    delay(100);
    digitalWrite(pin, !digitalRead(pin));
    delay(100);
  }
}
