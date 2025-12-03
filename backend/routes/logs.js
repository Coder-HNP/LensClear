import express from 'express';
import DetailedLog from '../models/DetailedLog.js';
import Device from '../models/Device.js';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * GET /api/logs
 * Get logs with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            deviceId,
            action,
            status,
            startDate,
            endDate,
            search,
            page = 1,
            limit = 20,
        } = req.query;

        // Build query
        const query = { triggeredBy: userId };

        if (deviceId) query.deviceId = deviceId;
        if (action) query.action = action;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { deviceName: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const logs = await DetailedLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await DetailedLog.countDocuments(query);

        res.json({
            success: true,
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

/**
 * POST /api/logs/export
 * Export logs to CSV or PDF
 */
router.post('/export', async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { format = 'csv', filters = {} } = req.body;

        // Build query from filters
        const query = { triggeredBy: userId };
        if (filters.deviceId) query.deviceId = filters.deviceId;
        if (filters.action) query.action = filters.action;
        if (filters.status) query.status = filters.status;
        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
        }

        // Fetch logs
        const logs = await DetailedLog.find(query).sort({ timestamp: -1 }).limit(10000);

        if (format === 'csv') {
            return await exportToCSV(logs, res);
        } else if (format === 'pdf') {
            return await exportToPDF(logs, res);
        } else {
            return res.status(400).json({ error: 'Invalid format. Use "csv" or "pdf"' });
        }
    } catch (error) {
        console.error('Error exporting logs:', error);
        res.status(500).json({ error: 'Failed to export logs' });
    }
});

/**
 * Export logs to CSV
 */
async function exportToCSV(logs, res) {
    const filename = `logs_${Date.now()}.csv`;
    const filepath = path.join(process.cwd(), 'temp', filename);

    // Ensure temp directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
        fs.mkdirSync(path.join(process.cwd(), 'temp'));
    }

    const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: [
            { id: 'timestamp', title: 'Timestamp' },
            { id: 'deviceId', title: 'Device ID' },
            { id: 'deviceName', title: 'Device Name' },
            { id: 'action', title: 'Action' },
            { id: 'status', title: 'Status' },
            { id: 'responseTime', title: 'Response Time (ms)' },
            { id: 'errorMessage', title: 'Error Message' },
        ],
    });

    const records = logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        deviceId: log.deviceId,
        deviceName: log.deviceName,
        action: log.action,
        status: log.status,
        responseTime: log.responseTime || 'N/A',
        errorMessage: log.errorMessage || '',
    }));

    await csvWriter.writeRecords(records);

    res.download(filepath, filename, (err) => {
        if (err) {
            console.error('Error sending file:', err);
        }
        // Clean up file after download
        fs.unlinkSync(filepath);
    });
}

/**
 * Export logs to PDF
 */
async function exportToPDF(logs, res) {
    const filename = `logs_${Date.now()}.pdf`;
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('LensClear Activity Logs', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    doc.fontSize(8);
    logs.forEach((log, index) => {
        if (index > 0) doc.moveDown(0.5);

        doc.text(`[${log.timestamp.toLocaleString()}] ${log.deviceName} (${log.deviceId})`, {
            continued: false,
        });
        doc.text(`Action: ${log.action} | Status: ${log.status.toUpperCase()}`, {
            indent: 20,
        });

        if (log.errorMessage) {
            doc.fillColor('red').text(`Error: ${log.errorMessage}`, { indent: 20 });
            doc.fillColor('black');
        }

        // Add page break if needed
        if (doc.y > 700) {
            doc.addPage();
        }
    });

    doc.end();
}

export default router;
