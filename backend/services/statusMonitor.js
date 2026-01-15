
import Device from '../models/Device.js';
import { getIO } from './socketService.js';

let monitorInterval = null;


export function initStatusMonitor(checkIntervalMs = 30000) {
    console.log('🔍 Initializing Device Status Monitor...');
    checkDeviceStatuses();
    monitorInterval = setInterval(checkDeviceStatuses, checkIntervalMs);
    console.log(`✅ Status Monitor running (checking every ${checkIntervalMs / 1000}s)`);
}


async function checkDeviceStatuses() {
    try {
        const now = new Date();
        const offlineThreshold = 10000;
        console.log('[StatusMonitor] Checking device statuses...');
        const trackedStatuses = ['online', 'active', 'idle'];
        const devicesToCheck = await Device.find({ status: { $in: trackedStatuses } });
        let offlineCount = 0;
        for (const device of devicesToCheck) {
            const timeSinceLastSeen = now - new Date(device.lastSeen);
            if (timeSinceLastSeen > offlineThreshold) {
                await Device.findOneAndUpdate(
                    { deviceId: device.deviceId },
                    { status: 'offline', lastSeen: device.lastSeen },
                    { new: true }
                );
                offlineCount++;
                const secondsAgo = Math.round(timeSinceLastSeen / 1000);
                console.log(`📴 Device ${device.deviceId} marked offline (last seen: ${secondsAgo}s ago)`);
                try {
                    const io = getIO();
                    const payload = {
                        deviceId: device.deviceId,
                        status: 'offline',
                        lastSeen: device.lastSeen,
                        timestamp: now
                    };
                    console.log('📡 Emitting device:status', payload);
                    io.to(`user:${device.userId}`).emit('device:status', payload);
                } catch (error) {
                    console.error('Error emitting status update:', error.message);
                }
            }
        }
        if (offlineCount > 0) {
            console.log(`[StatusMonitor] Marked ${offlineCount} device(s) as offline`);
        }
    } catch (error) {
        console.error('Error checking device statuses:', error);
    }
}


export function stopStatusMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        console.log('⏹️  Status Monitor stopped');
    }
}


export async function manualStatusCheck() {
    console.log('[StatusMonitor] Manual status check triggered');
    await checkDeviceStatuses();
}

export default {
    initStatusMonitor,
    stopStatusMonitor,
    manualStatusCheck
};
