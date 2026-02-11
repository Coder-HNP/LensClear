import cron from 'node-cron';
import moment from 'moment-timezone';
import { executeTrigger } from '../utils/triggerExecutor.js';

// --- TRIGGER MEMORY QUEUE (Bypasses Permission Denied) ---
// Structure: { userId: [triggers] }
let memoryTriggerStore = {};

/**
 * Initialize scheduler service
 */
export function initScheduler() {
    console.log('⏰ Starting Multi-Tenant Memory Scheduler...');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const userIds = Object.keys(memoryTriggerStore);

            for (const userId of userIds) {
                const triggers = memoryTriggerStore[userId] || [];
                const dueTriggers = triggers.filter(trigger => {
                    if (!trigger.enabled || trigger.type !== 'scheduled') return false;

                    let nextRunDate = null;
                    const nr = trigger.nextRun;

                    if (nr) {
                        if (typeof nr.toDate === 'function') {
                            nextRunDate = nr.toDate();
                        } else if (nr.seconds !== undefined) {
                            // Serialized Firestore Timestamp from Socket.io
                            nextRunDate = new Date(nr.seconds * 1000);
                        } else {
                            nextRunDate = new Date(nr);
                        }
                    }

                    return nextRunDate && nextRunDate <= now;
                });

                if (dueTriggers.length === 0) continue;

                console.log(`[Scheduler] 🚀 Handling ${dueTriggers.length} triggers for User: ${userId}`);

                for (const trigger of dueTriggers) {
                    console.log(`⏰ Executing Trigger: ${trigger.name} (Action: ${trigger.action})`);

                    // 1. Physically execute the hardware command
                    // We ensure the trigger has userId for context
                    const triggerWithContext = { ...trigger, userId };
                    await executeTrigger(triggerWithContext).catch(e => console.error(`[Scheduler] Hardware fail: ${e.message}`));

                    // 2. Request Frontend to update state
                    const { getIO } = await import('./socketService.js');
                    const io = getIO();
                    const nextRunInfo = calculateNextRun(trigger);

                    io.emit("proxy:update_trigger_state", {
                        triggerId: trigger.id,
                        userId: userId,
                        updates: {
                            lastRun: new Date(),
                            nextRun: nextRunInfo.nextRun,
                            enabled: nextRunInfo.enabled
                        }
                    });

                    // Update local copy
                    trigger.enabled = nextRunInfo.enabled;
                    trigger.nextRun = nextRunInfo.nextRun;
                }
            }
        } catch (error) {
            console.error('[Scheduler] ❌ Internal Error:', error.message);
        }
    });

    console.log('✅ Multi-Tenant Scheduler initialized');
}

/**
 * Update the local queue (Called by Socket listener)
 */
export function syncMemoryQueue(userId, triggers) {
    if (!userId) return;
    memoryTriggerStore[userId] = triggers;
    console.log(`[Scheduler] 📥 Queue Refreshed for ${userId}: ${triggers.length} items`);
}

/**
 * Logic to calculate next run (Mirroring frontend for consistency)
 */
function calculateNextRun(trigger) {
    const timezone = trigger.schedule?.timezone || 'UTC';
    let nextRun = null;
    let enabled = trigger.enabled;

    const baseTime = trigger.schedule?.datetime ? moment.tz(trigger.schedule.datetime, timezone) : moment.tz(timezone);

    switch (trigger.schedule?.type) {
        case 'once':
            enabled = false;
            nextRun = null;
            break;
        case 'daily':
            nextRun = moment.tz(timezone).add(1, 'days').set({
                hour: baseTime.hour(),
                minute: baseTime.minute(),
                second: 0
            }).toDate();
            break;
        case 'weekly':
            const weeklyNext = moment.tz(timezone).add(1, 'weeks').set({
                hour: baseTime.hour(),
                minute: baseTime.minute(),
                second: 0
            });
            weeklyNext.day(baseTime.day());
            if (weeklyNext.isBefore(moment.tz(timezone))) weeklyNext.add(1, 'weeks');
            nextRun = weeklyNext.toDate();
            break;
        default:
            enabled = false;
            nextRun = null;
    }

    return { enabled, nextRun };
}

export default {
    initScheduler,
    syncMemoryQueue
};
