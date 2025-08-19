import express from 'express';
import cors from 'cors';
import passport from 'passport';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import passportConfig from './config/passport.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/email.js'
import knowledgeRoutes from './routes/knowledge.js'
import userRoutes from './routes/user.js';
import stripeRoutes from './routes/stripe.js';
import analyticsRoutes from './routes/analytics.js';
// Load env vars
dotenv.config();

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Passport config
passportConfig(passport);

// --- Middlewares ---
app.use(cors());
app.use(express.json({ extended: false }));
app.use(passport.initialize()); // Initialize Passport

// --- Define Routes ---
app.get('/', (req, res) => res.send('API is running...'));
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/knowledge', knowledgeRoutes); 
app.use('/api/user', userRoutes);
//The webhook needs the raw body, so add this BEFORE your other express.json() middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/stripe', stripeRoutes);
// analytics
app.use('/api/analytics', analyticsRoutes);
// Define the Port
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));