import express from 'express';
import jwt from 'jsonwebtoken';
import { fetchAndSummarizeEmails } from '../services/gmailService.js';
import Email from '../models/Email.js'
import {generateReply} from '../services/aiService.js'
const router = express.Router();
// --- Reusable JWT Middleware ---
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};


// --- @route   GET api/emails ---
// --- @desc    Fetch and summarize recent emails ---
// --- @access  Private ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Call the new function
    const emails = await fetchAndSummarizeEmails(userId);
    res.json(emails);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: error.message });
  }
});

// --- @route   POST api/emails/:id/draft-reply ---
// --- @desc    Generate a draft reply for a specific email ---
// --- @access  Private ---
router.post('/:id/draft-reply', authMiddleware, async (req, res) => {
    try {
        const email = await Email.findById(req.params.id);
        if (!email || email.userId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Email not found or not authorized.' });
        }

        const draft = await generateReply(email.fullContent, req.user.id);
        res.json({ draft });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: error.message });
    }
});



export default router;