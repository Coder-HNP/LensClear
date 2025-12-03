import mongoose from 'mongoose';

const detailedLogSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    deviceName: {
        type: String,
        default: 'Unknown Device',
    },
    action: {
        type: String,
        required: true,
    },
    triggeredBy: {
        type: String, // Firebase UID or user identifier
        required: true,
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'pending', 'sent'],
        default: 'pending',
    },
    responseTime: {
        type: Number, // milliseconds
        default: null,
    },
    errorMessage: {
        type: String,
        default: '',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
});

// Compound indexes for filtering
detailedLogSchema.index({ deviceId: 1, timestamp: -1 });
detailedLogSchema.index({ triggeredBy: 1, timestamp: -1 });
detailedLogSchema.index({ status: 1, timestamp: -1 });

const DetailedLog = mongoose.model('DetailedLog', detailedLogSchema);

export default DetailedLog;
