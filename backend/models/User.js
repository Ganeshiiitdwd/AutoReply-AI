import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Password is not required if signing up with Google
    required: function() { return !this.googleId; },
  },
  tenantId: {
    type: String,
    required: true,
    default: uuidv4,
  },
  // --- Google OAuth Fields ---
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents to have a null value for this field
  },
  googleAccessToken: {
    type: String,
  },
  googleRefreshToken: {
    type: String,
  },
  isAutomationEnabled: {
    type: Boolean,
    default: false,
  },
  spreadsheetId: {
    type: String,
    default: null,
  },
  stripeCustomerId: String,
  subscriptionId: String,
  subscriptionStatus: {
    type: String,
    default: 'inactive', // e.g., active, inactive, past_due
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', UserSchema);