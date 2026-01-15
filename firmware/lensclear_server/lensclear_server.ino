#include <ESP32Servo.h>

Servo myServo;

const int SERVO_PIN = 0;       // GPIO 0
const int MIN_ANGLE = 60;
const int MAX_ANGLE = 120;
const int START_ANGLE = 0;

bool sweepOn = false;
int currentAngle = START_ANGLE;
int targetAngle = START_ANGLE;
int stepDir = 1;               // +1 or -1
unsigned long lastStepTime = 0;
const unsigned long stepInterval = 30; // ms between 1° steps -> slow move

void setup() {
  Serial.begin(115200);
  myServo.setPeriodHertz(50);              // standard servo frequency[web:3]
  myServo.attach(SERVO_PIN, 500, 2400);    // typical SG90 pulse range[web:3]
  myServo.write(START_ANGLE);              // rest at 0°
}

void loop() {
  // Handle serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();

    if (cmd == "ON") {
      sweepOn = true;
      targetAngle = MAX_ANGLE;
      stepDir = +1;
    } else { // any other command: stop and go to 0°
      sweepOn = false;
      targetAngle = START_ANGLE;
    }
  }

  unsigned long now = millis();

  if (sweepOn) {
    // Sweep between 60° and 120° slowly
    if (now - lastStepTime >= stepInterval) {
      lastStepTime = now;

      // Move one degree toward target
      if (currentAngle != targetAngle) {
        currentAngle += stepDir;
        myServo.write(currentAngle);
      } else {
        // At one end: reverse direction and set new target
        if (targetAngle == MAX_ANGLE) {
          targetAngle = MIN_ANGLE;
          stepDir = -1;
        } else {
          targetAngle = MAX_ANGLE;
          stepDir = +1;
        }
      }
    }
  } else {
    // Hold (or go back) to 0° slowly
    if (currentAngle != START_ANGLE && now - lastStepTime >= stepInterval) {
      lastStepTime = now;
      if (currentAngle > START_ANGLE) currentAngle--;
      else if (currentAngle < START_ANGLE) currentAngle++;
      myServo.write(currentAngle);
    }
  }
}