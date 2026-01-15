import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { initMQTT, setSocketIO } from './services/mqttService.js';
import { initSocketIO } from './services/socketService.js';
import { initScheduler } from './services/schedulerService.js';
import { initStatusMonitor } from './services/statusMonitor.js';
import authMiddleware from './middleware/auth.js';

// Import routes
import devicesRouter from './routes/devices.js';
import triggersRouter from './routes/triggers.js';
import commandsRouter from './routes/commands.js';
import logsRouter from './routes/logs.js';
import sensorDataRouter from './routes/sensorData.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lensclear';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
    origin: true, // Allow any origin in development (enables access from IP)
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// API routes
// ESP32-specific routes (no auth required, uses device token)
app.get('/api/commands/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const DetailedLog = (await import('./models/DetailedLog.js')).default;

        // Find oldest pending command
        const pendingCommand = await DetailedLog.findOne({
            deviceId,
            status: 'pending'
        }).sort({ timestamp: 1 });

        if (!pendingCommand) {
            return res.status(404).json({ message: 'No pending commands' });
        }

        // Mark as sent/processing
        pendingCommand.status = 'sent';
        await pendingCommand.save();

        res.json({
            command: pendingCommand.action,
            parameters: {}, // Add parameters if stored in log
            id: pendingCommand._id
        });
    } catch (error) {
        console.error('Error fetching pending commands:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User-facing routes (require auth)
app.use('/api/devices', authMiddleware, devicesRouter);
app.use('/api/triggers', authMiddleware, triggersRouter);
app.use('/api/commands', authMiddleware, commandsRouter);
app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/sensor-data', sensorDataRouter); // Handles its own auth via token

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize services
async function startServer() {
    try {
        // Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Initialize scheduler
        console.log('⏰ Initializing scheduler...');
        initScheduler();
        console.log('✅ Scheduler initialized');

        // Initialize device status monitor
        console.log('🔍 Initializing device status monitor...');
        initStatusMonitor(5000); // Check every 5 seconds
        console.log('✅ Status monitor initialized');

        // Initialize Socket.io
        console.log('🔌 Initializing Socket.io...');
        const io = initSocketIO(httpServer, FRONTEND_URL);
        console.log('✅ Socket.io initialized');

        // Initialize MQTT broker (optional)
        if (process.env.ENABLE_MQTT !== 'false') {
            console.log('📡 Initializing MQTT broker...');
            initMQTT(MQTT_PORT);
            setSocketIO(io); // Link MQTT to Socket.io
            console.log('✅ MQTT broker initialized');
        } else {
            console.log('📡 MQTT broker disabled by ENABLE_MQTT env');
        }

        // Start HTTP server - LISTEN ON ALL INTERFACES (0.0.0.0)
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 LensClear Backend Server Running');
            console.log('='.repeat(50));
            console.log(`📍 HTTP Server: http://0.0.0.0:${PORT}`);
            console.log(`📍 Local: http://localhost:${PORT}`);
            console.log(`📍 Network: http://172.28.112.1:${PORT}`);
            console.log(`📡 MQTT Broker: mqtt://localhost:${MQTT_PORT}`);
            console.log(`🔌 Socket.io: Enabled`);
            console.log(`📦 MongoDB: Connected`);
            console.log('='.repeat(50) + '\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down gracefully...');

    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');

        httpServer.close(() => {
            console.log('✅ HTTP server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer();
