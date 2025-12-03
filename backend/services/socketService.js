import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io server
 */
export function initSocketIO(httpServer, corsOrigin) {
    io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket.io client connected: ${socket.id}`);

        // Handle client disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 Socket.io client disconnected: ${socket.id}`);
        });

        // Optional: Handle room joining for user-specific updates
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
 * Emit device status update
 */
export function emitDeviceStatus(deviceId, status) {
    if (io) {
        io.emit('device:status', { deviceId, status, timestamp: new Date() });
    }
}

/**
 * Emit sensor data update
 */
export function emitSensorData(deviceId, data) {
    if (io) {
        io.emit('sensor:data', { deviceId, data, timestamp: new Date() });
    }
}

/**
 * Emit trigger execution
 */
export function emitTriggerExecuted(triggerId, status) {
    if (io) {
        io.emit('trigger:executed', { triggerId, status, timestamp: new Date() });
    }
}

/**
 * Emit new log entry
 */
export function emitNewLog(log) {
    if (io) {
        io.emit('log:new', log);
    }
}

export default {
    initSocketIO,
    getIO,
    emitDeviceStatus,
    emitSensorData,
    emitTriggerExecuted,
    emitNewLog,
};
