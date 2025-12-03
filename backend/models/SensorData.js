import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    temperature: {
        type: Number,
        default: null,
    },
    rpm: {
        type: Number,
        default: null,
    },
    powerConsumption: {
        type: Number,
        default: null,
    },
    vibration: {
        type: Number,
        default: null,
    },
    errorCode: {
        type: String,
        default: '',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false, // We use custom timestamp field
});

// Compound index for efficient time-series queries
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });

// TTL index - automatically delete documents older than 30 days
sensorDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const SensorData = mongoose.model('SensorData', sensorDataSchema);

export default SensorData;
