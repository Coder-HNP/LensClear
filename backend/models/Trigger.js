import mongoose from 'mongoose';

const triggerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['immediate', 'scheduled'],
        required: true,
    },
    action: {
        type: String,
        enum: ['run_cycle', 'stop_motor'],
        required: true,
    },
    targetDevices: [{
        type: String, // Array of deviceIds
        required: true,
    }],
    schedule: {
        type: {
            type: String,
            enum: ['once', 'daily', 'weekly', 'custom'],
            default: 'once',
        },
        datetime: Date,
        cronExpression: String,
        timezone: {
            type: String,
            default: 'UTC',
        },
        enabled: {
            type: Boolean,
            default: true,
        },
    },
    parameters: {
        duration: {
            type: Number, // seconds
        },
        speed: Number,
        temperature: Number,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    lastRun: Date,
    nextRun: Date,
    userId: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

// Index for scheduler queries
triggerSchema.index({ enabled: 1, nextRun: 1 });
triggerSchema.index({ userId: 1 });

const Trigger = mongoose.model('Trigger', triggerSchema);

export default Trigger;
