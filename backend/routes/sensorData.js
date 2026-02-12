import express from 'express';
import { emitSensorData, emitUnlinkedDevice, getIO } from '../services/socketService.js';
import { trackDeviceHeartbeat } from '../services/statusMonitor.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { deviceId, authToken, temperature, rpm, vibration, status, power } = req.body;

        if (!deviceId) return res.status(400).json({ error: 'Missing deviceId' });

        console.log(`[Relay] Hardware Data via HTTP for ${deviceId} (${status})`);

        // 1. INSTANT FEEDBACK (Real-time Gauge Vitals)
        emitSensorData(deviceId, {
            temperature: temperature || 0,
            rpm: rpm || 0,
            vibration: vibration || 0,
            power: power || 0,
            status: status || 'online'
        });

        // 2. BROADCAST SYNC REQUEST (Proxy Mode)
        const io = getIO();
        const mappedStatus = status === 'running' ? 'active' : 'online';

        io.emit("device:sync", {
            deviceId,
            payload: {
                status: mappedStatus,
                lastSeen: new Date(),
                temperature: temperature || 0,
                rpm: rpm || 0,
                power: power || 0,
                authToken: authToken || null
            }
        });

        // 3. INTERNAL HEARTBEAT TRACKING (Hardware-driven)
        // Every sensor report is treated as a heartbeat. If the hardware stops
        // sending data for a while, the in-memory monitor will mark it offline.
        trackDeviceHeartbeat(deviceId);

        // 3. BROADCAST LOG REQUEST
        io.emit("proxy:create_log", {
            deviceId,
            type: 'sensor',
            action: 'Status Update',
            details: `Vitals - T: ${temperature || 0}, R: ${rpm || 0}`
        });

        res.json({ success: true, mode: 'proxy' });
    } catch (error) {
        console.error('[Relay] Error:', error.message);
        res.status(500).json({ error: 'Bridge Relay Error' });
    }
});

export default router;
