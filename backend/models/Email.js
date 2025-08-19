import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  threadId: { type: String },
  subject: String,
  from: String,
  snippet: String,
  receivedAt: Date,
  summary: {
    type: String,
    default: 'Summary not generated yet.',
  },
  processedAt: { // The timestamp when the AI reply was sent
    type: Date,
  },
  responseTime: { // Time in seconds from receipt to reply
    type: Number, 
  },
  fullContent: String, // Storing the full content for future use
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Create a compound index to ensure emails are unique per user
EmailSchema.index({ userId: 1, messageId: 1 }, { unique: true });

export default mongoose.model('Email', EmailSchema);
