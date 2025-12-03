/*
 * LensClear ESP32 IoT Firmware
 * 
 * This firmware connects ESP32 to WiFi and MQTT broker,
 * controls motors for lens cleaning, reads sensors,
 * and communicates with the LensClear backend.
 * 
 * Hardware Requirements:
 * - ESP32 DevKit board
 * - DC Motor with L298N motor driver
 * - DHT22 temperature sensor (or DS18B20)
 * - LED indicators
 * - Optional: Hall effect sensor for RPM, current sensor
 * 
 * Libraries Required:
 * - WiFi (built-in)
 * - PubSubClient (MQTT)
 * - DHT sensor library
 * - ArduinoJson
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
const char* DEVICE_ID = "ESP32_001";  // Unique device ID (use MAC address)
const char* AUTH_TOKEN = "your_device_auth_token_here";  // Get from backend

// Pin Definitions
#define MOTOR_PIN1 25      // Motor driver IN1
#define MOTOR_PIN2 26      // Motor driver IN2
#define MOTOR_PWM_PIN 27   // Motor speed control (PWM)
#define DHT_PIN 4          // DHT22 data pin
#define LED_STATUS 2       // Built-in LED (status indicator)
#define LED_ERROR 15       // Error LED (red)

// Sensor Configuration
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Motor Configuration
#define PWM_CHANNEL 0
#define PWM_FREQUENCY 5000
#define PWM_RESOLUTION 8  // 8-bit (0-255)

// Timing Configuration
#define SENSOR_INTERVAL 5000  // Send sensor data every 5 seconds
#define RECONNECT_DELAY 5000  // Retry connection every 5 seconds

// ==================== GLOBAL VARIABLES ====================
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastSensorUpdate = 0;
int currentMotorSpeed = 0;
bool motorRunning = false;

// MQTT Topics
String topicCommandMotor;
String topicCommandConfig;
String topicSensorData;
String topicStatus;
String topicResponse;

// ==================== FUNCTION DECLARATIONS ====================
void setupWiFi();
void setupMQTT();
void reconnectWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishSensorData();
void publishStatus(const char* status);
void executeCommand(JsonDocument& doc);
void startMotor(int speed = 128);
void stopMotor();
void adjustSpeed(int speed);
void runCleaningCycle();
float readTemperature();
int readRPM();
void blinkLED(int pin, int times);

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("LensClear ESP32 IoT Device");
  Serial.println("=================================");
  Serial.println("Device ID: " + String(DEVICE_ID));
  
  // Initialize pins
  pinMode(MOTOR_PIN1, OUTPUT);
  pinMode(MOTOR_PIN2, OUTPUT);
  pinMode(LED_STATUS, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);
  
  // Setup PWM for motor speed control
  ledcSetup(PWM_CHANNEL, PWM_FREQUENCY, PWM_RESOLUTION);
  ledcAttachPin(MOTOR_PWM_PIN, PWM_CHANNEL);
  
  // Initialize sensors
  dht.begin();
  
  // Stop motor initially
  stopMotor();
  
  // Setup MQTT topics
  topicCommandMotor = "devices/" + String(DEVICE_ID) + "/commands/motor";
  topicCommandConfig = "devices/" + String(DEVICE_ID) + "/commands/config";
  topicSensorData = "devices/" + String(DEVICE_ID) + "/sensors/data";
  topicStatus = "devices/" + String(DEVICE_ID) + "/status";
  topicResponse = "devices/" + String(DEVICE_ID) + "/response";
  
  // Connect to WiFi
  setupWiFi();
  
  // Connect to MQTT
  setupMQTT();
  
  Serial.println("=================================");
  Serial.println("Setup complete! Device ready.");
  Serial.println("=================================\n");
  
  blinkLED(LED_STATUS, 3);
}

// ==================== MAIN LOOP ====================
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    reconnectWiFi();
  }
  
  // Check MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  
  // Process MQTT messages
  mqttClient.loop();
  
  // Publish sensor data periodically
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorUpdate >= SENSOR_INTERVAL) {
    lastSensorUpdate = currentMillis;
    publishSensorData();
  }
  
  // Blink status LED to show device is alive
  digitalWrite(LED_STATUS, (millis() / 1000) % 2);
}

// ==================== WIFI FUNCTIONS ====================
void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_STATUS, HIGH);
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    digitalWrite(LED_ERROR, HIGH);
  }
}

void reconnectWiFi() {
  Serial.println("WiFi disconnected. Reconnecting...");
  digitalWrite(LED_ERROR, HIGH);
  WiFi.disconnect();
  delay(1000);
  setupWiFi();
}

// ==================== MQTT FUNCTIONS ====================
void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  reconnectMQTT();
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");
    
    // Attempt connection with authentication
    if (mqttClient.connect(DEVICE_ID, DEVICE_ID, AUTH_TOKEN)) {
      Serial.println(" ✓ Connected!");
      
      // Subscribe to command topics
      mqttClient.subscribe(topicCommandMotor.c_str());
      mqttClient.subscribe(topicCommandConfig.c_str());
      
      Serial.println("Subscribed to:");
      Serial.println("  - " + topicCommandMotor);
      Serial.println("  - " + topicCommandConfig);
      
      // Publish online status
      publishStatus("online");
      
      digitalWrite(LED_ERROR, LOW);
    } else {
      Serial.print(" ✗ Failed, rc=");
      Serial.println(mqttClient.state());
      Serial.println("Retrying in 5 seconds...");
      
      digitalWrite(LED_ERROR, HIGH);
      delay(RECONNECT_DELAY);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Execute command
  executeCommand(doc);
}

// ==================== COMMAND EXECUTION ====================
void executeCommand(JsonDocument& doc) {
  const char* command = doc["command"];
  unsigned long startTime = millis();
  bool success = true;
  String errorMsg = "";
  
  Serial.print("Executing command: ");
  Serial.println(command);
  
  if (strcmp(command, "start_motor") == 0) {
    int speed = doc["parameters"]["speed"] | 128;
    startMotor(speed);
  }
  else if (strcmp(command, "stop_motor") == 0) {
    stopMotor();
  }
  else if (strcmp(command, "adjust_speed") == 0) {
    int speed = doc["parameters"]["speed"] | 128;
    adjustSpeed(speed);
  }
  else if (strcmp(command, "run_cycle") == 0) {
    runCleaningCycle();
  }
  else {
    success = false;
    errorMsg = "Unknown command";
    Serial.println("✗ Unknown command!");
  }
  
  // Send acknowledgment
  StaticJsonDocument<128> response;
  response["success"] = success;
  response["responseTime"] = millis() - startTime;
  if (!success) {
    response["error"] = errorMsg;
  }
  
  char buffer[128];
  serializeJson(response, buffer);
  mqttClient.publish(topicResponse.c_str(), buffer);
  
  if (success) {
    Serial.println("✓ Command executed successfully");
  }
}

// ==================== MOTOR CONTROL ====================
void startMotor(int speed) {
  speed = constrain(speed, 0, 255);
  
  digitalWrite(MOTOR_PIN1, HIGH);
  digitalWrite(MOTOR_PIN2, LOW);
  ledcWrite(PWM_CHANNEL, speed);
  
  currentMotorSpeed = speed;
  motorRunning = true;
  
  Serial.print("Motor started at speed: ");
  Serial.println(speed);
}

void stopMotor() {
  digitalWrite(MOTOR_PIN1, LOW);
  digitalWrite(MOTOR_PIN2, LOW);
  ledcWrite(PWM_CHANNEL, 0);
  
  currentMotorSpeed = 0;
  motorRunning = false;
  
  Serial.println("Motor stopped");
}

void adjustSpeed(int speed) {
  if (!motorRunning) {
    startMotor(speed);
    return;
  }
  
  speed = constrain(speed, 0, 255);
  ledcWrite(PWM_CHANNEL, speed);
  currentMotorSpeed = speed;
  
  Serial.print("Motor speed adjusted to: ");
  Serial.println(speed);
}

void runCleaningCycle() {
  Serial.println("Starting cleaning cycle...");
  
  // Example cleaning cycle: ramp up, run, ramp down
  for (int speed = 0; speed <= 255; speed += 5) {
    adjustSpeed(speed);
    delay(50);
  }
  
  delay(3000);  // Run at full speed for 3 seconds
  
  for (int speed = 255; speed >= 0; speed -= 5) {
    adjustSpeed(speed);
    delay(50);
  }
  
  stopMotor();
  Serial.println("Cleaning cycle complete");
}

// ==================== SENSOR FUNCTIONS ====================
float readTemperature() {
  float temp = dht.readTemperature();
  
  if (isnan(temp)) {
    Serial.println("Failed to read temperature!");
    return 0.0;
  }
  
  return temp;
}

int readRPM() {
  // Placeholder for RPM sensor
  // Implement based on your sensor type (hall effect, encoder, etc.)
  // For now, return simulated value
  if (motorRunning) {
    return map(currentMotorSpeed, 0, 255, 0, 3000);
  }
  return 0;
}

void publishSensorData() {
  float temperature = readTemperature();
  int rpm = readRPM();
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["temperature"] = temperature;
  doc["rpm"] = rpm;
  doc["powerConsumption"] = 0.0;  // Implement if you have current sensor
  doc["vibration"] = 0.0;  // Implement if you have accelerometer
  doc["errorCode"] = "";
  doc["timestamp"] = millis();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Publish to MQTT
  if (mqttClient.publish(topicSensorData.c_str(), buffer)) {
    Serial.print("Sensor data published: ");
    Serial.println(buffer);
  } else {
    Serial.println("Failed to publish sensor data");
  }
}

void publishStatus(const char* status) {
  StaticJsonDocument<128> doc;
  doc["status"] = status;
  doc["timestamp"] = millis();
  
  char buffer[128];
  serializeJson(doc, buffer);
  
  mqttClient.publish(topicStatus.c_str(), buffer, true);  // Retained message
  
  Serial.print("Status published: ");
  Serial.println(status);
}

// ==================== UTILITY FUNCTIONS ====================
void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
    delay(200);
  }
}
