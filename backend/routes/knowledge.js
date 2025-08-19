import express from 'express';
import jwt from 'jsonwebtoken';
import KnowledgeBase from '../models/KnowledgeBase.js';
import User from '../models/User.js';
import { generateEmbedding } from '../services/aiService.js';
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

// @route   GET api/knowledge
// @desc    Get all knowledge base items for a user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await KnowledgeBase.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/knowledge
// @desc    Add a new knowledge base item
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { topic, content } = req.body;
  if (!topic || !content) {
    return res.status(400).json({ msg: 'Please provide both a topic and content.' });
  }
  try {
    const user = await User.findById(req.user.id);
     const contentEmbedding = await generateEmbedding(content);  //embeddings
    const newItem = new KnowledgeBase({
      userId: req.user.id,
      tenantId: user.tenantId,
      topic,
      content,
      contentEmbedding
    });
    const item = await newItem.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/knowledge/:id
// @desc    Delete a knowledge base item
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    let item = await KnowledgeBase.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    // Ensure user owns the item
    if (item.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await KnowledgeBase.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
