import axios from 'axios';
import { emitTriggerExecuted } from '../services/socketService.js';

const BACKEND_URL = `http://localhost:${process.env.PORT || 5000}`;

/**
 * Execute a trigger (send commands to target devices via Local Relay)
 */
export async function executeTrigger(trigger) {
    console.log(`🚀 Executing Trigger: ${trigger.name} (${trigger.action})`);

    try {
        if (!trigger.targetDevices || trigger.targetDevices.length === 0) {
            throw new Error('No target devices specified in trigger');
        }

        // 1. Relay command to the hardware via our local API
        for (const deviceId of trigger.targetDevices) {
            try {
                console.log(`[Executor] Relay command to Device ${deviceId}: ${trigger.action}`);

                await axios.post(`${BACKEND_URL}/api/commands/send`, {
                    deviceId,
                    command: getCommandFromAction(trigger.action),
                    params: trigger.parameters || {}
                });

                // 2. Request Frontend to record this in Logs (Proxy Mode)
                const { getIO } = await import('../services/socketService.js');
                const io = getIO();
                io.emit("proxy:create_log", {
                    deviceId: String(deviceId),
                    type: 'trigger',
                    action: 'Trigger Execution Success',
                    details: `Scheduled Trigger: ${trigger.name}`
                });

                console.log(`✅ Trigger relayed for ${deviceId}`);

            } catch (error) {
                console.error(`❌ Executor error for ${deviceId}:`, error.message);
            }
        }

        // 3. Inform UI
        emitTriggerExecuted(trigger.id, 'success');

        return { success: true };
    } catch (error) {
        console.error('❌ Trigger Executor Failed:', error);
        emitTriggerExecuted(trigger.id, 'failed');
        throw error;
    }
}

/**
 * Map action to command format
 */
export function getCommandFromAction(action) {
    const commandMap = {
        'run_cycle': 'CYCLE',
        'start_motor': 'START',
        'stop_motor': 'STOP',
        'adjust_speed': 'SPEED'
    };

    return commandMap[action] || action.toUpperCase();
}

export default {
    executeTrigger,
    getCommandFromAction,
};
