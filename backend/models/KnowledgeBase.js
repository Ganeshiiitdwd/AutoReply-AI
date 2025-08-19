import mongoose from 'mongoose';

const KnowledgeBaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
  },
  // A keyword or question to help retrieve this snippet
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  // The snippet of information or answer
  content: {
    type: String,
    required: true,
    trim: true,
  },
  contentEmbedding: { // for advance rag
    type: [Number],
    required: true,
  },
}, { timestamps: true });

// Add a text index to the topic and content for efficient searching
KnowledgeBaseSchema.index({ topic: 'text', content: 'text' });

export default mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
