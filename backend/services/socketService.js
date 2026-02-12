import { Server } from 'socket.io';
import { syncMemoryQueue } from './schedulerService.js';
import { trackDeviceHeartbeat } from './statusMonitor.js';

let io = null;

/**
 * Initialize Socket.io server
 */
export function initSocketIO(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost",
                "http://127.0.0.1"
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Proxy Bridge: Connected ${socket.id}`);

        // Handle Trigger Sync from Frontend (Proxy Mode)
        socket.on('proxy:sync_triggers', ({ userId, triggers }) => {
            console.log(`[Socket] 📥 Trigger sync received from UI for user: ${userId}`);
            syncMemoryQueue(userId, triggers);
        });

        // Heartbeat Tracking (Memory Monitor)
        socket.on("proxy:track_heartbeat", ({ deviceId, userId }) => {
            trackDeviceHeartbeat(deviceId, userId);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Proxy Bridge: Disconnected ${socket.id}`);
        });

        // Handle client room joining for targeted updates
        socket.on('join:user', (userId) => {
            socket.join(`user:${userId}`);
            console.log(`User ${userId} joined their room`);
        });
    });

    return io;
}

/**
 * Get Socket.io instance
 */
export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

/**
 * Emit device status update (Real-time Vitual update)
 */
export function emitDeviceStatus(deviceId, status) {
    if (io) io.emit('device:status', { deviceId, status, timestamp: new Date() });
}

/**
 * Emit sensor data (Real-time Vitals)
 */
export function emitSensorData(deviceId, data) {
    if (io) io.emit('sensor:data', { deviceId, data, timestamp: new Date() });
}

/**
 * Emit trigger execution results
 */
export function emitTriggerExecuted(triggerId, status) {
    if (io) io.emit('trigger:executed', { triggerId, status, timestamp: new Date() });
}

/**
 * Broadcast an unlinked device alert
 */
export function emitUnlinkedDevice(deviceId) {
    if (io) io.emit('device:unlinked', { deviceId });
}

export default {
    initSocketIO,
    getIO,
    emitDeviceStatus,
    emitSensorData,
    emitTriggerExecuted,
    emitUnlinkedDevice
};
