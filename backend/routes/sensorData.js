import express from 'express';
import Device from '../models/Device.js';
import SensorData from '../models/SensorData.js';
import { getIO } from '../services/socketService.js';

const router = express.Router();

/**
 * GET /api/sensor-data
 * Check if endpoint is active
 */
router.get('/', (req, res) => {
    res.json({ message: 'Sensor Data API is active. Send POST request with data.' });
});

/**
 * POST /api/sensor-data
 * Receive sensor data from ESP32
 * No auth middleware here because ESP32 uses authToken in body
 */
router.post('/', async (req, res) => {
    try {
        const { deviceId, authToken, temperature, rpm, vibration, status, power } = req.body;

        if (!deviceId || !authToken) {
            return res.status(400).json({ error: 'Missing deviceId or authToken' });
        }

        // Verify device and token
        const device = await Device.findOne({ deviceId });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        if (device.authToken !== authToken) {
            return res.status(401).json({ error: 'Invalid auth token' });
        }

        // Save sensor data
        const sensorData = new SensorData({
            deviceId,
            temperature,
            rpm,
            vibration,
            powerConsumption: power,
            timestamp: new Date()
        });

        await sensorData.save();

        // Update device status and lastSeen
        device.lastSeen = new Date();
        if (status) {
            device.status = status === 'running' ? 'active' : (status === 'idle' ? 'idle' : 'online');
        } else {
            device.status = 'online';
        }
        await device.save();

        // Emit real-time update via Socket.io
        const io = getIO();
        if (io) {
            // Emit sensor data with device info
            io.to(`user:${device.userId}`).emit('sensor:data', {
                deviceId,
                data: {
                    id: deviceId,
                    name: device.name,
                    status: device.status,
                    temperature: sensorData.temperature,
                    rpm: sensorData.rpm,
                    vibration: sensorData.vibration,
                    power: sensorData.powerConsumption,
                    lastUpdate: sensorData.timestamp
                }
            });

            // Emit device status update
            io.to(`user:${device.userId}`).emit('device:status', {
                deviceId,
                status: device.status,
                lastSeen: device.lastSeen
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing sensor data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
