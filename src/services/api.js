import axios from 'axios';

// Base URL for backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Get Firebase ID token from localStorage or context
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - redirect to login
            console.error('Unauthorized access');
            // You can dispatch a logout action here
        }
        return Promise.reject(error);
    }
);

// ==================== DEVICE APIs ====================
export const deviceAPI = {
    // Get all devices
    getAll: () => api.get('/devices'),

    // Add new device
    create: (deviceData) => api.post('/devices', deviceData),

    // Update device
    update: (deviceId, updates) => api.put(`/devices/${deviceId}`, updates),

    // Delete device
    delete: (deviceId) => api.delete(`/devices/${deviceId}`),

    // Get sensor data
    getSensorData: (deviceId, hours = 24) =>
        api.get(`/devices/${deviceId}/sensors`, { params: { hours } }),

    // Get device status
    getStatus: (deviceId) => api.get(`/devices/${deviceId}/status`),
};

// ==================== TRIGGER APIs ====================
export const triggerAPI = {
    // Get all triggers
    getAll: () => api.get('/triggers'),

    // Create trigger
    create: (triggerData) => api.post('/triggers', triggerData),

    // Update trigger
    update: (triggerId, updates) => api.put(`/triggers/${triggerId}`, updates),

    // Delete trigger
    delete: (triggerId) => api.delete(`/triggers/${triggerId}`),

    // Execute trigger immediately
    execute: (triggerId) => api.post(`/triggers/${triggerId}/execute`),

    // Toggle trigger enabled/disabled
    toggle: (triggerId) => api.patch(`/triggers/${triggerId}/toggle`),
};

// ==================== COMMAND APIs ====================
export const commandAPI = {
    // Send command to device
    send: (deviceId, command, parameters = {}) =>
        api.post('/commands/send', { deviceId, command, parameters }),

    // Get command status
    getStatus: (commandId) => api.get(`/commands/${commandId}/status`),
};

// ==================== LOG APIs ====================
export const logAPI = {
    // Get logs with filters
    getAll: (filters = {}) => api.get('/logs', { params: filters }),

    // Export logs
    export: (format, filters = {}) =>
        api.post('/logs/export', { format, filters }, { responseType: 'blob' }),
};

export default api;
