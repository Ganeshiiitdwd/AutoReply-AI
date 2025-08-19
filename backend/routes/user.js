import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const authMiddleware = (req, res, next) => { const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  } };

// @route   GET api/user/settings
// @desc    Get user settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
         const user = await User.findById(req.user.id).select('isAutomationEnabled spreadsheetId');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ 
            isAutomationEnabled: user.isAutomationEnabled,
            spreadsheetId: user.spreadsheetId 
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/user/settings/toggle-automation
// @desc    Toggle automation setting
router.put('/settings/toggle-automation', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.isAutomationEnabled = !user.isAutomationEnabled;
        await user.save();
        res.json({ isAutomationEnabled: user.isAutomationEnabled });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

export default router;