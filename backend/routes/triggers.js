import express from 'express';
import Trigger from '../models/Trigger.js';
import Device from '../models/Device.js';
import { executeTrigger } from '../utils/triggerExecutor.js';
import { scheduleTrigger, cancelTrigger } from '../services/schedulerService.js';

const router = express.Router();

/**
 * GET /api/triggers
 * Get all triggers for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const triggers = await Trigger.find({ userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            triggers,
        });
    } catch (error) {
        console.error('Error fetching triggers:', error);
        res.status(500).json({ error: 'Failed to fetch triggers' });
    }
});

/**
 * POST /api/triggers
 * Create a new trigger
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            name,
            type,
            action,
            targetDevices,
            schedule,
            parameters,
            enabled = true,
        } = req.body;

        // Validate required fields
        if (!name || !type || !action || !targetDevices || targetDevices.length === 0) {
            return res.status(400).json({
                error: 'Name, type, action, and target devices are required',
            });
        }

        // Verify target devices belong to user
        const devices = await Device.find({
            deviceId: { $in: targetDevices },
            userId,
        });

        if (devices.length !== targetDevices.length) {
            return res.status(400).json({
                error: 'One or more target devices not found or not owned by user',
            });
        }

        // Create trigger
        const trigger = new Trigger({
            name,
            type,
            action,
            targetDevices,
            schedule: schedule || {},
            parameters: parameters || {},
            enabled,
            userId,
        });

        // Set nextRun for scheduled triggers
        if (type === 'scheduled' && schedule?.datetime) {
            trigger.nextRun = new Date(schedule.datetime);
        }

        await trigger.save();

        // Execute immediate triggers right away
        if (type === 'immediate' && enabled) {
            try {
                await executeTrigger(trigger);
                console.log(`✅ Immediate trigger "${name}" executed successfully`);
            } catch (execError) {
                console.error(`Error executing immediate trigger "${name}":`, execError);
                // Don't fail the creation if execution fails
            }
        }

        // Schedule if needed
        if (type === 'scheduled' && enabled) {
            await scheduleTrigger(trigger._id);
        }

        res.status(201).json({
            success: true,
            trigger,
        });
    } catch (error) {
        console.error('Error creating trigger:', error);
        res.status(500).json({ error: 'Failed to create trigger' });
    }
});

/**
 * PUT /api/triggers/:id
 * Update a trigger
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;
        const updates = req.body;

        // Find trigger and verify ownership
        const trigger = await Trigger.findOne({ _id: id, userId });

        if (!trigger) {
            return res.status(404).json({ error: 'Trigger not found' });
        }

        // Update fields
        Object.keys(updates).forEach(key => {
            if (key !== '_id' && key !== 'userId') {
                trigger[key] = updates[key];
            }
        });

        // Update nextRun if schedule changed
        if (updates.schedule?.datetime) {
            trigger.nextRun = new Date(updates.schedule.datetime);
        }

        await trigger.save();

        // Reschedule if needed
        if (trigger.type === 'scheduled' && trigger.enabled) {
            await scheduleTrigger(trigger._id);
        }

        res.json({
            success: true,
            trigger,
        });
    } catch (error) {
        console.error('Error updating trigger:', error);
        res.status(500).json({ error: 'Failed to update trigger' });
    }
});

/**
 * DELETE /api/triggers/:id
 * Delete a trigger
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;

        const trigger = await Trigger.findOneAndDelete({ _id: id, userId });

        if (!trigger) {
            return res.status(404).json({ error: 'Trigger not found' });
        }

        // Cancel if scheduled
        if (trigger.type === 'scheduled') {
            await cancelTrigger(id);
        }

        res.json({
            success: true,
            message: 'Trigger deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting trigger:', error);
        res.status(500).json({ error: 'Failed to delete trigger' });
    }
});

/**
 * POST /api/triggers/:id/execute
 * Execute a trigger immediately
 */
router.post('/:id/execute', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;

        const trigger = await Trigger.findOne({ _id: id, userId });

        if (!trigger) {
            return res.status(404).json({ error: 'Trigger not found' });
        }

        // Execute trigger
        const result = await executeTrigger(trigger);

        // Update lastRun
        trigger.lastRun = new Date();
        await trigger.save();

        res.json({
            success: true,
            message: 'Trigger executed successfully',
            result,
        });
    } catch (error) {
        console.error('Error executing trigger:', error);
        res.status(500).json({ error: 'Failed to execute trigger' });
    }
});

/**
 * PATCH /api/triggers/:id/toggle
 * Enable/disable a trigger
 */
router.patch('/:id/toggle', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        const { id } = req.params;

        const trigger = await Trigger.findOne({ _id: id, userId });

        if (!trigger) {
            return res.status(404).json({ error: 'Trigger not found' });
        }

        // Toggle enabled status
        trigger.enabled = !trigger.enabled;
        await trigger.save();

        // Schedule or cancel based on new status
        if (trigger.type === 'scheduled') {
            if (trigger.enabled) {
                await scheduleTrigger(trigger._id);
            } else {
                await cancelTrigger(trigger._id);
            }
        }

        res.json({
            success: true,
            trigger,
        });
    } catch (error) {
        console.error('Error toggling trigger:', error);
        res.status(500).json({ error: 'Failed to toggle trigger' });
    }
});

export default router;
