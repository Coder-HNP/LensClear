import { db } from '../firebase.js';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getIO } from './socketService.js';

let monitorInterval = null;

// Memory Store: { deviceId: { lastSeen: Date, userId: string } }
const activeDevices = new Map();

/**
 * Update the memory map when a device checks in
 */
export function trackDeviceHeartbeat(deviceId, userId) {
    if (!deviceId || !userId) return;
    activeDevices.set(String(deviceId), {
        lastSeen: new Date(),
        userId: String(userId)
    });
}

/**
 * Initialize status monitor
 */
export function initStatusMonitor(checkIntervalMs = 20000) {
    console.log('🔍 Initializing In-Memory Device Status Monitor...');
    monitorInterval = setInterval(checkDeviceStatuses, checkIntervalMs);
    console.log(`✅ Status Monitor running (checking every ${checkIntervalMs / 1000}s)`);
}

/**
 * Checks for timed-out devices in memory
 */
async function checkDeviceStatuses() {
    try {
        const now = new Date();
        const offlineThresholdMs = 30000; // 30 seconds threshold
        let offlineCount = 0;

        for (const [deviceId, data] of activeDevices.entries()) {
            const timeSinceLastSeen = now - data.lastSeen;

            if (timeSinceLastSeen > offlineThresholdMs) {
                // Remove from memory tracking first to prevent duplicates
                activeDevices.delete(deviceId);
                offlineCount++;

                console.log(`📴 Device ${deviceId} (User: ${data.userId}) marked OFFLINE after ${Math.round(timeSinceLastSeen / 1000)}s`);

                // 1. Notify UI via Socket.io
                try {
                    const io = getIO();
                    io.emit('device:status', {
                        deviceId: deviceId,
                        status: 'offline',
                        userId: data.userId
                    });
                } catch (e) { }

                // 2. Mark Offline in Firestore (Optional: Dashboard usually handles this via Proxy Secretary)
                // But we do it here as a backup
                const deviceRef = doc(db, "users", data.userId, "devices", deviceId);
                await updateDoc(deviceRef, {
                    status: 'offline',
                    updatedAt: serverTimestamp()
                }).catch(e => console.log(`[StatusMonitor] Permission note: Cannot write offline for ${deviceId} directly. Waiting for Proxy Secretary.`));
            }
        }

        if (offlineCount > 0) {
            console.log(`[StatusMonitor] Cycle complete. Marked ${offlineCount} devices as offline.`);
        }
    } catch (error) {
        // Suppress permission errors to keep logs clean - the Proxy Secretary pattern handles the actual write
        if (!error.message.includes('permission-denied')) {
            console.error('[StatusMonitor] Error:', error);
        }
    }
}

export function stopStatusMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
}

export default {
    initStatusMonitor,
    trackDeviceHeartbeat,
    stopStatusMonitor
};
