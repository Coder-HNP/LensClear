import express from 'express';
import { db } from '../firebase.js';
import {
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';

const router = express.Router();

// Memory store for commands (Replaced Firestore for the local bridge)
const pendingCommands = {};

/**
 * GET /api/commands/:deviceId
 * Polling endpoint for ESP32
 */
router.get('/:deviceId', (req, res) => {
    const { deviceId } = req.params;

    if (pendingCommands[deviceId]) {
        const cmd = pendingCommands[deviceId];
        console.log(`[Relay] 🚀 Sending command to Hardware: ${cmd.command}`);

        // Remove from queue after sending (one-time poll)
        delete pendingCommands[deviceId];

        return res.json(cmd);
    }

    res.status(404).json({ message: 'No pending commands' });
});

/**
 * POST /api/commands/send
 * Endpoint for the WEB APP to send commands
 */
router.post('/send', (req, res) => {
    const { deviceId, command, params } = req.body;

    if (!deviceId || !command) {
        return res.status(400).json({ error: 'deviceId and command required' });
    }

    // Queue the command in local memory
    pendingCommands[deviceId] = {
        id: `local_${Date.now()}`,
        command,
        parameters: params || {}
    };

    console.log(`[Relay] 📥 Queued command from Website: ${command} for ${deviceId}`);
    res.json({ success: true, message: 'Command queued locally' });
});

/**
 * POST /api/commands/ack
 */
router.post('/ack', async (req, res) => {
    const { deviceId, commandId, success } = req.body;
    console.log(`[Relay] ✅ Hardware Acknowledged: ${commandId} (Success: ${success})`);

    // Log this event to Firestore via the Frontend Bridge
    const { getIO } = await import('../services/socketService.js');
    const io = getIO();
    io.emit("proxy:create_log", {
        deviceId: String(deviceId),
        type: 'hardware',
        action: success ? 'Hardware Acknowledged' : 'Hardware Failed Command',
        details: `Command ID: ${commandId}`
    });

    res.json({ success: true });
});

export default router;
