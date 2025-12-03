import express from 'express';
import { publishCommand } from '../services/mqttService.js';
import Device from '../models/Device.js';
import DetailedLog from '../models/DetailedLog.js';
import { emitNewLog } from '../services/socketService.js';

const router = express.Router();

/**
 * POST /api/commands/send
 * Send a command to an ESP32 device
 */
router.post('/send', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { deviceId, command, parameters = {} } = req.body;

        // Validate required fields
        if (!deviceId || !command) {
            return res.status(400).json({ error: 'Device ID and command are required' });
        }

        // Verify device ownership
        const device = await Device.findOne({ deviceId, userId });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Check if device is online
        if (device.status === 'offline') {
            return res.status(400).json({
                error: 'Device is offline',
                deviceId,
                status: device.status,
            });
        }

        // Create log entry
        const log = new DetailedLog({
            deviceId,
            deviceName: device.name,
            action: command,
            triggeredBy: userId,
            status: 'pending',
            timestamp: new Date(),
        });

        await log.save();

        // Emit log to frontend
        emitNewLog(log);

        // Publish command via MQTT (Fire and forget)
        try {
            publishCommand(deviceId, command, parameters);
        } catch (mqttError) {
            console.warn('MQTT publish failed, relying on HTTP polling:', mqttError.message);
        }

        res.json({
            success: true,
            message: 'Command queued successfully',
            logId: log._id,
        });
    } catch (error) {
        console.error('Error sending command:', error);
        res.status(500).json({ error: 'Failed to send command' });
    }
});

/**
 * GET /api/commands/:id/status
 * Check command execution status
 */
router.get('/:id/status', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;

        const log = await DetailedLog.findOne({
            _id: id,
            triggeredBy: userId,
        });

        if (!log) {
            return res.status(404).json({ error: 'Command log not found' });
        }

        res.json({
            success: true,
            log,
        });
    } catch (error) {
        console.error('Error fetching command status:', error);
        res.status(500).json({ error: 'Failed to fetch command status' });
    }
});

export default router;
