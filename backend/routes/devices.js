import express from 'express';
import mongoose from 'mongoose';
import Device from '../models/Device.js';
import SensorData from '../models/SensorData.js';
import crypto from 'crypto';
import { db } from '../firebase.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';

const router = express.Router();

/**
 * GET /api/devices
 * Get all devices for the authenticated user.
 * In the bridge deployment we use Firestore as the source of truth
 * instead of MongoDB to avoid requiring a separate Mongo instance.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id; // Firebase UID or custom user ID

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const devicesRef = collection(db, 'users', userId, 'devices');
        const snapshot = await getDocs(devicesRef);

        const devices = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        return res.json({
            success: true,
            devices,
        });
    } catch (error) {
        console.error('Error fetching devices from Firestore:', error);
        // Fail soft with an empty list so the UI does not break in Docker
        return res.json({
            success: true,
            devices: [],
            note: 'Device API is running in bridge mode without MongoDB; returning Firestore devices only.',
        });
    }
});

/**
 * POST /api/devices
 * Register a new ESP32 device.
 * For the bridge build we store devices in Firestore under users/{userId}/devices/{deviceId}.
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { deviceId, name, type, location } = req.body;

        // Validate required fields
        if (!deviceId || !name) {
            return res.status(400).json({ error: 'Device ID and name are required' });
        }

        const targetId = String(deviceId);
        const deviceRef = doc(db, 'users', userId, 'devices', targetId);
        const existingSnap = await getDoc(deviceRef);

        if (existingSnap.exists()) {
            return res.status(409).json({ error: 'Device ID already registered' });
        }

        // Generate authentication token
        const authToken = crypto.randomBytes(32).toString('hex');

        const deviceData = {
            id: targetId,
            userId,
            deviceId: targetId,
            name,
            type: type || 'combined',
            location: location || '',
            authToken,
            status: 'offline',
            lastOnline: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(deviceRef, deviceData, { merge: true });

        return res.status(201).json({
            success: true,
            device: deviceData,
            message: 'Device registered successfully. Use the authToken in your ESP32 code.',
        });
    } catch (error) {
        console.error('Error creating device in Firestore:', error);
        return res.status(500).json({ error: 'Failed to create device' });
    }
});

/**
 * PUT /api/devices/:id
 * Update device details
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;
        const { name, type, location, configuration } = req.body;

        // Find device and verify ownership (try _id first, then deviceId)
        let device = await Device.findOne({ _id: mongoose.isValidObjectId(id) ? id : null, userId });
        if (!device) {
            device = await Device.findOne({ deviceId: id, userId });
        }

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Update fields
        if (name) device.name = name;
        if (type) device.type = type;
        if (location !== undefined) device.location = location;
        if (configuration) {
            device.configuration = {
                ...device.configuration,
                ...configuration,
            };
        }

        await device.save();

        res.json({
            success: true,
            device,
        });
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ error: 'Failed to update device' });
    }
});

/**
 * DELETE /api/devices/:id
 * Delete a device
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;

        // Find and delete device (try _id first, then deviceId)
        let device = await Device.findOneAndDelete({ _id: mongoose.isValidObjectId(id) ? id : null, userId });
        if (!device) {
            device = await Device.findOneAndDelete({ deviceId: id, userId });
        }

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Optional: Delete associated sensor data and logs
        // await SensorData.deleteMany({ deviceId: id });
        // await DetailedLog.deleteMany({ deviceId: id });

        res.json({
            success: true,
            message: 'Device deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

/**
 * GET /api/devices/:id/sensors
 * Get sensor data history for a device
 */
router.get('/:id/sensors', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;
        const { hours = 24 } = req.query; // Default: last 24 hours

        // Verify device ownership
        const device = await Device.findOne({ deviceId: id, userId });
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Calculate time range
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - parseInt(hours));

        // Fetch sensor data
        const sensorData = await SensorData.find({
            deviceId: id,
            timestamp: { $gte: startTime },
        }).sort({ timestamp: 1 }).limit(1000); // Limit to 1000 points

        res.json({
            success: true,
            deviceId: id,
            data: sensorData,
            count: sensorData.length,
        });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ error: 'Failed to fetch sensor data' });
    }
});

/**
 * GET /api/devices/:id/status
 * Get current device status
 */
router.get('/:id/status', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;

        const device = await Device.findOne({ deviceId: id, userId });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.json({
            success: true,
            deviceId: id,
            status: device.status,
            lastSeen: device.lastSeen,
        });
    } catch (error) {
        console.error('Error fetching device status:', error);
        res.status(500).json({ error: 'Failed to fetch device status' });
    }
});

export default router;
