import express from 'express';
import DetailedLog from '../models/DetailedLog.js';

const router = express.Router();

/**
 * GET /api/logs
 * Get recent logs for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const limit = parseInt(req.query.limit) || 20;

        const logs = await DetailedLog.find({ triggeredBy: userId })
            .sort({ timestamp: -1 })
            .limit(limit);

        res.json({
            success: true,
            logs,
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

export default router;
