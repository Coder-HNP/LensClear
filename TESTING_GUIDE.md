# 🧪 LensClear Testing Guide

This guide provides a comprehensive testing checklist for the LensClear IoT platform.

---

## 📋 Testing Checklist

Use this checklist to verify all features are working correctly.

### ✅ Deployment Verification

- [ ] All Docker containers are running
- [ ] Backend API responds at http://localhost:5000/health
- [ ] Frontend loads at http://localhost:5173
- [ ] No errors in browser console (F12)
- [ ] Health check script passes all tests

### ✅ User Interface Testing

- [ ] Dashboard page loads correctly
- [ ] Navigation menu works
- [ ] All pages are accessible (Devices, Triggers, Logs, Settings)
- [ ] UI is responsive and displays correctly
- [ ] No broken images or missing assets

### ✅ Device Management

- [ ] Can register a new device
- [ ] Device appears in device list
- [ ] Device shows correct status (online/offline)
- [ ] Can view device details
- [ ] Can edit device information
- [ ] Can delete a device

### ✅ Command Execution

- [ ] Can send commands to devices
- [ ] Commands appear in command history
- [ ] Command status updates correctly
- [ ] Can view command details
- [ ] Error handling works for invalid commands

### ✅ Triggers & Automation

- [ ] Can create immediate trigger
- [ ] Can create scheduled trigger
- [ ] Trigger executes successfully
- [ ] Can edit existing trigger
- [ ] Can delete trigger
- [ ] Can enable/disable trigger

### ✅ Logging & Monitoring

- [ ] Activity logs display correctly
- [ ] Can filter logs by device
- [ ] Can filter logs by action type
- [ ] Can filter logs by date range
- [ ] Logs update in real-time
- [ ] Can export logs (if implemented)

### ✅ Real-time Features

- [ ] Device status updates in real-time
- [ ] New logs appear without refresh
- [ ] Socket.io connection established
- [ ] Real-time updates work correctly

### ✅ Data Persistence

- [ ] Data persists after container restart
- [ ] Registered devices remain after restart
- [ ] Logs are preserved
- [ ] Triggers are preserved

---

## 🧪 Detailed Test Scenarios

### Scenario 1: Device Registration

**Objective**: Verify device registration workflow

**Steps**:
1. Open frontend at http://localhost:5173
2. Navigate to "Devices" page
3. Click "Add Device" or "Register Device"
4. Fill in device details:
   - Device ID: `TEST_DEVICE_001`
   - Name: `Test Device 1`
   - Location: `Test Lab`
5. Click "Register" or "Save"

**Expected Results**:
- ✅ Success message appears
- ✅ Device appears in device list
- ✅ Device shows "offline" status (no physical device connected)
- ✅ Auth token is generated and displayed

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### Scenario 2: Command Execution

**Objective**: Test sending commands to devices

**Steps**:
1. Select a registered device
2. Open device control panel
3. Send a "START_MOTOR" command
4. Check command history
5. View logs

**Expected Results**:
- ✅ Command is queued
- ✅ Command appears in history
- ✅ Status shows "pending" or "sent"
- ✅ Log entry created for command

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### Scenario 3: Trigger Creation

**Objective**: Verify trigger automation works

**Steps**:
1. Navigate to "Triggers" page
2. Click "Create Trigger"
3. Configure trigger:
   - Name: `Test Trigger`
   - Type: `Immediate`
   - Action: `START_MOTOR`
   - Target Device: `TEST_DEVICE_001`
4. Save trigger
5. Execute trigger manually

**Expected Results**:
- ✅ Trigger is created
- ✅ Trigger appears in trigger list
- ✅ Can execute trigger
- ✅ Command is sent to device
- ✅ Log entry created

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### Scenario 4: Log Filtering

**Objective**: Test log filtering functionality

**Steps**:
1. Navigate to "Logs" page
2. Apply device filter
3. Apply action type filter
4. Apply date range filter
5. Clear filters

**Expected Results**:
- ✅ Logs filter correctly by device
- ✅ Logs filter correctly by action
- ✅ Logs filter correctly by date
- ✅ Multiple filters work together
- ✅ Clear filters resets view

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### Scenario 5: Real-time Updates

**Objective**: Verify real-time data updates

**Steps**:
1. Open frontend in two browser tabs
2. In Tab 1: Register a new device
3. In Tab 2: Observe device list

**Expected Results**:
- ✅ New device appears in Tab 2 without refresh
- ✅ Socket.io connection shows "connected"
- ✅ Updates are instant (< 1 second)

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### Scenario 6: Data Persistence

**Objective**: Verify data survives container restart

**Steps**:
1. Register a test device
2. Create a test trigger
3. Generate some log entries
4. Stop containers: `docker-compose down`
5. Start containers: `docker-compose up -d`
6. Wait for services to be ready
7. Check if data is still present

**Expected Results**:
- ✅ Device still exists
- ✅ Trigger still exists
- ✅ Logs are preserved
- ✅ No data loss

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

## 🔍 API Testing

### Test Backend Endpoints

**Health Check**:
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"ok","mongodb":"connected"}`

**List Devices**:
```bash
curl http://localhost:5000/api/devices
```
Expected: JSON array of devices

**Create Device** (requires auth):
```bash
curl -X POST http://localhost:5000/api/devices \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"API_TEST","name":"API Test Device"}'
```

---

## 🐛 Bug Reporting Template

If you find issues, use this template:

```markdown
**Bug Title**: [Short description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:


**Actual Behavior**:


**Screenshots**: [If applicable]

**Environment**:
- OS: [Windows/Mac/Linux]
- Docker Version: 
- Browser: [Chrome/Firefox/Safari]

**Logs**:
```
[Paste relevant logs from docker-compose logs]
```

**Additional Context**:

```

---

## 📊 Performance Testing

### Load Testing Checklist

- [ ] Application handles 10 devices
- [ ] Application handles 100 log entries
- [ ] Application handles 50 triggers
- [ ] UI remains responsive with large datasets
- [ ] No memory leaks after extended use

### Response Time Testing

- [ ] Frontend loads in < 3 seconds
- [ ] API responses in < 500ms
- [ ] Real-time updates in < 1 second
- [ ] Database queries in < 100ms

---

## ✅ Acceptance Criteria

The application is ready for production if:

- ✅ All deployment verification tests pass
- ✅ All UI tests pass
- ✅ All device management tests pass
- ✅ All command execution tests pass
- ✅ All trigger tests pass
- ✅ All logging tests pass
- ✅ Real-time features work correctly
- ✅ Data persistence works
- ✅ No critical bugs found
- ✅ Performance is acceptable

---

## 📝 Test Results Summary

**Tester Name**: _______________
**Date**: _______________
**Environment**: _______________

### Results

| Category | Tests Passed | Tests Failed | Notes |
|----------|--------------|--------------|-------|
| Deployment | __ / __ | | |
| UI | __ / __ | | |
| Device Management | __ / __ | | |
| Commands | __ / __ | | |
| Triggers | __ / __ | | |
| Logging | __ / __ | | |
| Real-time | __ / __ | | |
| Persistence | __ / __ | | |

### Overall Assessment

- [ ] **Ready for Production**
- [ ] **Needs Minor Fixes**
- [ ] **Needs Major Fixes**
- [ ] **Not Ready**

### Comments:

```
[Your feedback here]
```

---

## 🎯 Next Steps

After completing testing:

1. ✅ Fill out test results summary
2. ✅ Report any bugs found
3. ✅ Provide feedback on user experience
4. ✅ Suggest improvements
5. ✅ Share results with development team

---

**Thank you for testing! 🙏**

Your feedback helps make LensClear better!
