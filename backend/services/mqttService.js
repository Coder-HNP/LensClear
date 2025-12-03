import aedes from 'aedes';
import { createServer } from 'net';
import Device from '../models/Device.js';
import SensorData from '../models/SensorData.js';
import DetailedLog from '../models/DetailedLog.js';

let mqttBroker = null;
let mqttServer = null;
let io = null; // Socket.io instance (set from server.js)

/**
 * Initialize MQTT broker with Aedes
 */
export function initMQTT(port = 1883) {
    mqttBroker = aedes();
    mqttServer = createServer(mqttBroker.handle);

    mqttServer.listen(port, () => {
        console.log(`✅ MQTT Broker running on port ${port}`);
    });

    // Client connection event
    mqttBroker.on('client', async (client) => {
        console.log(`📱 MQTT Client connected: ${client.id}`);

        // Update device status to online
        try {
            const deviceId = client.id;
            await Device.findOneAndUpdate(
                { deviceId },
                { status: 'online', lastSeen: new Date() },
                { new: true }
            );

            // Emit to frontend via Socket.io
            if (io) {
                io.emit('device:status', { deviceId, status: 'online' });
            }
        } catch (error) {
            console.error('Error updating device status:', error);
        }
    });

    // Client disconnection event
    mqttBroker.on('clientDisconnect', async (client) => {
        console.log(`📴 MQTT Client disconnected: ${client.id}`);

        // Update device status to offline
        try {
            const deviceId = client.id;
            await Device.findOneAndUpdate(
                { deviceId },
                { status: 'offline', lastSeen: new Date() },
                { new: true }
            );

            // Emit to frontend via Socket.io
            if (io) {
                io.emit('device:status', { deviceId, status: 'offline' });
            }
        } catch (error) {
            console.error('Error updating device status:', error);
        }
    });

    // Message published event
    mqttBroker.on('publish', async (packet, client) => {
        if (!client) return; // Ignore broker's own messages

        const topic = packet.topic;
        const message = packet.payload.toString();

        // Handle sensor data
        if (topic.includes('/sensors/data')) {
            await handleSensorData(topic, message, client.id);
        }

        // Handle status updates
        if (topic.includes('/status')) {
            await handleStatusUpdate(topic, message, client.id);
        }

        // Handle command acknowledgments
        if (topic.includes('/response')) {
            await handleCommandResponse(topic, message, client.id);
        }
    });

    // Authentication (optional - validate device tokens)
    mqttBroker.authenticate = async (client, username, password, callback) => {
        try {
            const deviceId = client.id;
            const token = password?.toString();

            // Find device and validate token
            const device = await Device.findOne({ deviceId });

            if (!device) {
                console.log(`❌ Authentication failed: Device ${deviceId} not found`);
                return callback(new Error('Device not registered'), false);
            }

            if (device.authToken !== token) {
                console.log(`❌ Authentication failed: Invalid token for ${deviceId}`);
                return callback(new Error('Invalid authentication token'), false);
            }

            console.log(`✅ Device authenticated: ${deviceId}`);
            callback(null, true);
        } catch (error) {
            console.error('Authentication error:', error);
            callback(error, false);
        }
    };

    return mqttBroker;
}

/**
 * Set Socket.io instance for real-time updates
 */
export function setSocketIO(socketIO) {
    io = socketIO;
}

/**
 * Publish command to device
 */
export function publishCommand(deviceId, command, parameters = {}) {
    if (!mqttBroker) {
        throw new Error('MQTT broker not initialized');
    }

    const topic = `devices/${deviceId}/commands/motor`;
    const payload = JSON.stringify({
        command,
        parameters,
        timestamp: new Date().toISOString(),
    });

    mqttBroker.publish({
        topic,
        payload,
        qos: 1, // At least once delivery
        retain: false,
    }, (error) => {
        if (error) {
            console.error(`Error publishing command to ${deviceId}:`, error);
        } else {
            console.log(`📤 Command sent to ${deviceId}: ${command}`);
        }
    });
}

/**
 * Handle sensor data from ESP32
 */
async function handleSensorData(topic, message, deviceId) {
    try {
        const data = JSON.parse(message);

        // Save to database
        const sensorData = new SensorData({
            deviceId,
            temperature: data.temperature,
            rpm: data.rpm,
            powerConsumption: data.powerConsumption,
            vibration: data.vibration,
            errorCode: data.errorCode || '',
            timestamp: new Date(data.timestamp || Date.now()),
        });

        await sensorData.save();

        // Emit to frontend via Socket.io
        if (io) {
            io.emit('sensor:data', {
                deviceId,
                data: sensorData,
            });
        }

        console.log(`📊 Sensor data saved for ${deviceId}`);
    } catch (error) {
        console.error('Error handling sensor data:', error);
    }
}

/**
 * Handle status updates from ESP32
 */
async function handleStatusUpdate(topic, message, deviceId) {
    try {
        const data = JSON.parse(message);

        await Device.findOneAndUpdate(
            { deviceId },
            {
                status: data.status,
                lastSeen: new Date(),
            },
            { new: true }
        );

        // Emit to frontend
        if (io) {
            io.emit('device:status', {
                deviceId,
                status: data.status,
            });
        }

        console.log(`📡 Status update for ${deviceId}: ${data.status}`);
    } catch (error) {
        console.error('Error handling status update:', error);
    }
}

/**
 * Handle command acknowledgment from ESP32
 */
async function handleCommandResponse(topic, message, deviceId) {
    try {
        const data = JSON.parse(message);

        // Update log entry with response
        await DetailedLog.findOneAndUpdate(
            {
                deviceId,
                status: 'pending',
            },
            {
                status: data.success ? 'success' : 'failed',
                responseTime: data.responseTime,
                errorMessage: data.error || '',
            },
            { sort: { timestamp: -1 } } // Update most recent pending log
        );

        // Emit to frontend
        if (io) {
            io.emit('log:updated', {
                deviceId,
                status: data.success ? 'success' : 'failed',
            });
        }

        console.log(`✅ Command response from ${deviceId}: ${data.success ? 'Success' : 'Failed'}`);
    } catch (error) {
        console.error('Error handling command response:', error);
    }
}

/**
 * Close MQTT broker
 */
export function closeMQTT() {
    if (mqttServer) {
        mqttServer.close(() => {
            console.log('MQTT broker closed');
        });
    }
}

export default {
    initMQTT,
    setSocketIO,
    publishCommand,
    closeMQTT,
};
