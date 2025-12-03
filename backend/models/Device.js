import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // ESP32 MAC address or custom ID
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['motor', 'sensor', 'combined'],
        default: 'combined',
    },
    location: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'active', 'idle'],
        default: 'offline',
    },
    lastSeen: {
        type: Date,
        default: Date.now,
    },
    configuration: {
        motorSpeed: {
            type: Number,
            min: 0,
            max: 255,
            default: 128,
        },
        sensorInterval: {
            type: Number,
            default: 5, // seconds
        },
        alerts: {
            type: Boolean,
            default: true,
        },
    },
    userId: {
        type: String,
        required: true,
        // Firebase UID or MongoDB User ID
    },
    authToken: {
        type: String,
        required: true,
        // Device authentication token for MQTT
    },
}, {
    timestamps: true, // adds createdAt and updatedAt
});

// Index for faster queries
deviceSchema.index({ userId: 1, status: 1 });
deviceSchema.index({ deviceId: 1 });

const Device = mongoose.model('Device', deviceSchema);

export default Device;
