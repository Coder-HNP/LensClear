import { io } from 'socket.io-client';

// Determine socket URL dynamically if not provided in env
const getSocketUrl = () => {
    if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
    }
    // If running on localhost, default to localhost:5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    // Otherwise, assume backend is on the same host at port 5000
    return `http://${window.location.hostname}:5000`;
};

const SOCKET_URL = getSocketUrl();

let socket = null;

/**
 * Initialize Socket.io connection
 */
export function initSocket(userId) {
    if (socket) {
        if (userId && socket.connected) {
            socket.emit('join:user', userId);
        }
        return socket;
    }

    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('✅ Socket.io connected:', socket.id);

        // Join user-specific room
        if (userId) {
            socket.emit('join:user', userId);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket.io disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
    });

    return socket;
}

/**
 * Get Socket.io instance
 */
export function getSocket() {
    if (!socket) {
        console.warn('Socket not initialized. Call initSocket() first.');
    }
    return socket;
}

/**
 * Subscribe to device status updates
 */
export function onDeviceStatus(callback) {
    if (socket) {
        socket.on('device:status', callback);
    }
}

/**
 * Subscribe to sensor data updates
 */
export function onSensorData(callback) {
    if (socket) {
        socket.on('sensor:data', callback);
    }
}

/**
 * Subscribe to trigger execution events
 */
export function onTriggerExecuted(callback) {
    if (socket) {
        socket.on('trigger:executed', callback);
    }
}

/**
 * Subscribe to new log entries
 */
export function onNewLog(callback) {
    if (socket) {
        socket.on('log:new', callback);
    }
}

/**
 * Unsubscribe from event
 */
export function off(event, callback) {
    if (socket) {
        socket.off(event, callback);
    }
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export default {
    initSocket,
    getSocket,
    onDeviceStatus,
    onSensorData,
    onTriggerExecuted,
    onNewLog,
    off,
    disconnectSocket,
};
