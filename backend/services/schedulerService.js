import cron from 'node-cron';
import Trigger from '../models/Trigger.js';
import { executeTrigger } from '../utils/triggerExecutor.js';

let scheduledJobs = new Map();

/**
 * Initialize scheduler service
 */
export function initScheduler() {
    console.log('⏰ Initializing trigger scheduler...');

    // Run every minute to check for pending triggers
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Find enabled triggers that are due
            const dueTriggers = await Trigger.find({
                enabled: true,
                'schedule.enabled': true,
                nextRun: { $lte: now },
            });

            for (const trigger of dueTriggers) {
                console.log(`⏰ Executing scheduled trigger: ${trigger.name}`);
                await executeTrigger(trigger);

                // Update nextRun based on schedule type
                await updateNextRun(trigger);
            }
        } catch (error) {
            console.error('Error in scheduler:', error);
        }
    });

    console.log('✅ Scheduler initialized');
}

/**
 * Update next run time for recurring triggers
 */
async function updateNextRun(trigger) {
    const now = new Date();
    let nextRun = null;

    switch (trigger.schedule.type) {
        case 'once':
            // One-time trigger - disable after execution
            trigger.enabled = false;
            break;

        case 'daily':
            // Run at same time tomorrow
            nextRun = new Date(trigger.schedule.datetime);
            nextRun.setDate(nextRun.getDate() + 1);
            break;

        case 'weekly':
            // Run at same time next week
            nextRun = new Date(trigger.schedule.datetime);
            nextRun.setDate(nextRun.getDate() + 7);
            break;

        case 'custom':
            // Parse cron expression (simplified - you can use a library like 'cron-parser')
            // For now, just set to null and require manual update
            nextRun = null;
            trigger.enabled = false;
            break;

        default:
            nextRun = null;
    }

    trigger.lastRun = now;
    trigger.nextRun = nextRun;
    await trigger.save();
}

/**
 * Schedule a new trigger
 */
export async function scheduleTrigger(triggerId) {
    try {
        const trigger = await Trigger.findById(triggerId);

        if (!trigger || !trigger.enabled || trigger.type !== 'scheduled') {
            return;
        }

        // Calculate next run time
        const nextRun = new Date(trigger.schedule.datetime);
        trigger.nextRun = nextRun;
        await trigger.save();

        console.log(`📅 Trigger scheduled: ${trigger.name} at ${nextRun}`);
    } catch (error) {
        console.error('Error scheduling trigger:', error);
    }
}

/**
 * Cancel a scheduled trigger
 */
export async function cancelTrigger(triggerId) {
    try {
        await Trigger.findByIdAndUpdate(triggerId, {
            enabled: false,
            nextRun: null,
        });

        console.log(`❌ Trigger cancelled: ${triggerId}`);
    } catch (error) {
        console.error('Error cancelling trigger:', error);
    }
}

export default {
    initScheduler,
    scheduleTrigger,
    cancelTrigger,
};
