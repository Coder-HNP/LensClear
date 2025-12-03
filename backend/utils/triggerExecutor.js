import { publishCommand } from '../services/mqttService.js';
import DetailedLog from '../models/DetailedLog.js';
import Device from '../models/Device.js';
import { emitTriggerExecuted, emitNewLog } from '../services/socketService.js';

/**
 * Execute a trigger (send commands to target devices)
 */
export async function executeTrigger(trigger) {
    const startTime = Date.now();
    const logs = [];

    try {
        // Get target devices
        const devices = await Device.find({
            deviceId: { $in: trigger.targetDevices },
        });

        if (devices.length === 0) {
            throw new Error('No valid target devices found');
        }

        // Execute command for each device
        for (const device of devices) {
            try {
                // Create log entry with pending status
                const log = new DetailedLog({
                    deviceId: device.deviceId,
                    deviceName: device.name,
                    action: trigger.action,
                    triggeredBy: trigger.userId,
                    status: 'pending', // ESP32 will poll and pick this up
                    timestamp: new Date(),
                });

                await log.save();
                logs.push(log);

                // Emit new log to frontend
                emitNewLog(log);

                console.log(`✅ Trigger command queued for ${device.name}: ${trigger.action}`);

                // Also try MQTT as fallback (fire and forget)
                try {
                    publishCommand(device.deviceId, trigger.action, trigger.parameters);
                } catch (mqttError) {
                    console.warn('MQTT publish failed, relying on HTTP polling:', mqttError.message);
                }
            } catch (error) {
                console.error(`Error executing trigger for device ${device.deviceId}:`, error);

                // Update log with error
                const log = logs.find(l => l.deviceId === device.deviceId);
                if (log) {
                    log.status = 'failed';
                    log.errorMessage = error.message;
                    log.responseTime = Date.now() - startTime;
                    await log.save();
                }
            }
        }

        // Emit trigger executed event
        emitTriggerExecuted(trigger._id, 'success');

        return {
            success: true,
            logsCreated: logs.length,
        };
    } catch (error) {
        console.error('Error executing trigger:', error);

        // Emit trigger failed event
        emitTriggerExecuted(trigger._id, 'failed');

        throw error;
    }
}

/**
 * Map action to MQTT command format
 */
export function getCommandFromAction(action) {
    const commandMap = {
        'start_motor': 'START',
        'stop_motor': 'STOP',
        'adjust_speed': 'SPEED',
        'run_cycle': 'CYCLE',
    };

    return commandMap[action] || action.toUpperCase();
}

export default {
    executeTrigger,
    getCommandFromAction,
};
