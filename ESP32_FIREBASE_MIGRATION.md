# ESP32 to Firebase Migration Guide

The error `Connection Refused` is occurring because your ESP32 is trying to connect to a local server on port `5000` (192.168.0.106:5000), which we removed to make the application standalone.

Your ESP32 must now communicate directly with **Firebase Firestore** over **HTTPS (Port 443)**.

## 1. Required Libraries
Make sure you have `WiFiClientSecure` included (it comes with the ESP32 board package).

```cpp
#include <WiFiClientSecure.h>
```

## 2. Updated Configuration
Replace your `SERVER_IP` and `SERVER_PORT` with these Firebase settings:

```cpp
const char* FIREBASE_HOST = "firestore.googleapis.com";
const char* PROJECT_ID = "lens-clear";
// You can find your User ID in the App's Profile or Firebase Console
const char* USER_ID = "PASTE_YOUR_USER_ID_HERE"; 

WiFiClientSecure client;
```

## 3. Rectified `sendDataToServer()`
This version uses the Firestore REST API format.

```cpp
void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  // Use HTTPS
  client.setInsecure(); // For testing. In production, use Firebase Root CA.
  
  String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) + 
               "/databases/(default)/documents/users/" + String(USER_ID) + 
               "/devices/" + String(DEVICE_ID) + "?updateMask.fieldPaths=status&updateMask.fieldPaths=battery&updateMask.fieldPaths=temperature";

  HTTPClient http;
  http.begin(client, url); 
  http.addHeader("Content-Type", "application/json");

  // Firestore requires a very specific "fields" JSON structure
  StaticJsonDocument<512> doc;
  JsonObject fields = doc.createNestedObject("fields");
  
  fields["status"]["stringValue"] = sweepOn ? "running" : "idle";
  fields["battery"]["integerValue"] = 85; 
  fields["temperature"]["doubleValue"] = round(temperature * 10) / 10.0;
  
  String jsonString;
  serializeJson(doc, jsonString);

  // Use PATCH to update existing document fields
  int httpCode = http.PATCH(jsonString);
  
  if (httpCode > 0) {
    Serial.printf("[Firestore] Success: %d\n", httpCode);
  } else {
    Serial.printf("[Firestore] Failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
```

## 4. Troubleshooting
- **User ID**: You must replace `PASTE_YOUR_USER_ID_HERE` with your actual Firebase UID (found in the app).
- **Security Rules**: Ensure your Firebase Firestore rules allow `write` access to `users/{userId}/devices/{deviceId}`.
- **Port**: You no longer need port 5000; the standard HTTPS port (443) is used automatically.
