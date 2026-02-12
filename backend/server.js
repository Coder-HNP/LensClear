import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './firebase.js';

// Import services
import { initSocketIO } from './services/socketService.js';
import { initScheduler } from './services/schedulerService.js';
import { initStatusMonitor } from './services/statusMonitor.js';

// Import routes
import sensorDataRouter from './routes/sensorData.js';
import commandsRouter from './routes/commands.js';
import devicesRouter from './routes/devices.js';
import authMiddleware from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io (Real-time bridge)
initSocketIO(httpServer);

// Configuration
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'firebase',
        scheduler: 'active'
    });
});

// API routes
app.use('/api/sensor-data', sensorDataRouter);
app.use('/api/commands', commandsRouter);

// Protected device management routes
// These require an Authorization: Bearer <token> header.
// For now the auth middleware treats the token value itself as the user ID.
app.use('/api/devices', authMiddleware, devicesRouter);

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
        console.log('🔥 Initializing LensClear Bridge Services...');

        // Start Scheduler (for Automated Triggers)
        initScheduler();

        // Start Status Monitor (for Offline detection)
        initStatusMonitor(20000);

        // 3. BROADCAST LOG REQUEST (Optional: Removed redundancy)
        // Manual logging handled by the frontend secretary via proxy:create_log

        // Start HTTP server
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 LensClear Backend Bridge Running');
            console.log('='.repeat(50));
            console.log(`📍 HTTP Server: http://0.0.0.0:${PORT}`);
            console.log(`📍 Local: http://localhost:${PORT}`);
            console.log(`📦 Database: Firebase Firestore`);
            console.log(`⏰ Scheduler: ACTIVE`);
            console.log('='.repeat(50) + '\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
