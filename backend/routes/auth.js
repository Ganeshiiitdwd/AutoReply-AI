import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import passport from 'passport';
import User from '../models/User.js';

const router = express.Router();

// --- JWT Middleware ---
// This middleware will now check for the token in both the header and query parameters.
export const authMiddleware = (req, res, next) => {
  // 1. Check for token in the 'x-auth-token' header
  let token = req.header('x-auth-token');

  // 2. If not in header, check for token in the 'token' query parameter
  if (!token && req.query.token) {
    token = req.query.token;
  }

  // 3. If no token is found in either location, deny access
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 4. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};


// --- @route   POST api/auth/register ---
// (Your existing register route remains here)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      tenantId: uuidv4(),
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = {
      user: {
        id: user.id,
        tenantId: user.tenantId,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// --- @route   POST api/auth/login ---
// (Your existing login route remains here)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const payload = {
        user: {
          id: user.id,
          tenantId: user.tenantId,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
});


// --- @route   GET api/auth/google ---
// --- @desc    Initiate Google OAuth flow ---
// --- @access  Private (user must be logged in) ---
router.get(
  '/google',
  authMiddleware, // This will now correctly find the token from the query
  (req, res, next) => {
    const authenticator = passport.authenticate('google', {
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify','https://www.googleapis.com/auth/spreadsheets'],  // requesting for read , write,  modify and spreadsheet 
      accessType: 'offline',
      prompt: 'consent',
      state: req.user.id
    });
    authenticator(req, res, next);
  }
);


// --- @route   GET api/auth/google/callback ---
// --- @desc    Google OAuth callback URL ---
// --- @access  Private ---
router.get(
  '/google/callback',
  (req, res, next) => {
      const userId = req.query.state;
      if (!userId) {
          return res.status(400).send('User ID not found in state parameter.');
      }
      req.user = { id: userId };
      next();
  },
  passport.authenticate('google', { failureRedirect: '/dashboard', session: false }),
  (req, res) => {
    res.redirect('http://localhost:3000/dashboard?status=google-connected');
  }
);

export default router;
