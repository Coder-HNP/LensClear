import express from 'express';
import { db } from '../firebase.js';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';

const router = express.Router();

/**
 * GET /api/logs
 * Returns recent logs for the authenticated user.
 * This is a lightweight endpoint primarily to satisfy the
 * timeline sidebar in the Docker build; it is safe to return
 * an empty list if no logs are present.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const rawLimit = parseInt(req.query.limit, 10);
        const max = Number.isNaN(rawLimit) ? 5 : Math.min(rawLimit, 50);

        const logsRef = collection(db, 'users', userId, 'logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(max));
        const snapshot = await getDocs(q);

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.json({
            success: true,
            logs,
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        // Fail soft with empty list so UI doesn't break.
        return res.json({
            success: true,
            logs: [],
        });
    }
});

export default router;

