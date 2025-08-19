import express from 'express';
import { startOfToday, subDays } from 'date-fns';
import jwt from 'jsonwebtoken'; // Assuming authMiddleware is defined here or imported
import Email from '../models/Email.js';
import mongoose from 'mongoose';

const router = express.Router();

const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET).user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const thirtyDaysAgo = subDays(startOfToday(), 30);

        // Convert userId string to a Mongoose ObjectId for aggregation queries
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Total emails processed
        const totalProcessed = await Email.countDocuments({ userId: userObjectId, processedAt: { $ne: null } });

        // 2. Average response time (in seconds)
        const avgResponseResult = await Email.aggregate([
            { $match: { userId: userObjectId, responseTime: { $ne: null } } },
            { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
        ]);
        const averageResponseTime = avgResponseResult[0]?.avgTime || 0;

        // 3. Emails processed per day for the last 30 days
        const dailyVolume = await Email.aggregate([
            { $match: { userId: userObjectId, processedAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$processedAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', count: 1, _id: 0 } }
        ]);

        // 4. Average Response Time Per Day
        const dailyResponseTimes = await Email.aggregate([
            { $match: { userId: userObjectId, processedAt: { $gte: thirtyDaysAgo }, responseTime: { $ne: null } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$processedAt' } },
                    avgTime: { $avg: '$responseTime' }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', avgTime: 1, _id: 0 } }
        ]);

        res.json({
            totalProcessed,
            averageResponseTime,
            dailyVolume,
            dailyResponseTimes // This was missing
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;