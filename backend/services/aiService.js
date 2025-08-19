import { GoogleGenerativeAI } from '@google/generative-ai';
import KnowledgeBase from '../models/KnowledgeBase.js';
import mongoose from 'mongoose';
// Initialize the Google Generative AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001"}); // for advance rag setup
export const generateEmbedding = async (text) => {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
};

/**
 * Generates a concise summary of an email's content using the Gemini model.
 * @param {string} emailContent - The full text content of the email.
 * @returns {Promise<string>} The AI-generated summary.
 */
export const summarizeEmail = async (emailContent) => {
  try {
    // For text-only input, use the gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // This is our prompt. We're asking the AI to act as an assistant and provide specific outputs.
    const prompt = `
      As a highly efficient personal assistant, analyze the following email content.
      Provide a concise, one-sentence summary of the key takeaway.
      Then, list any clear action items for the recipient, each on a new line starting with a dash.
      If there are no action items, simply state "No action items."

      Email Content:
      ---
      ${emailContent}
      ---
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();

    return summaryText.trim();
  } catch (error) {
    console.error('Error generating summary from AI service:', error);
    throw new Error('Failed to generate email summary.');
  }
};


/**
 * Generates a context-aware reply draft using a RAG pattern.
 * @param {string} emailContent - The content of the email to reply to.
 * @param {string} userId - The ID of the user to retrieve their knowledge base.
 * @returns {Promise<string>} The AI-generated reply draft.
 */
export const generateReply = async (emailContent, userId) => {
  try {
    // 1. Create an embedding for the incoming email content
    const emailEmbedding = await generateEmbedding(emailContent);
     // 2. Use MongoDB's $vectorSearch to find similar knowledge
    const knowledgeItems = await KnowledgeBase.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index', // The name of the index we will create in MongoDB Atlas
          path: 'contentEmbedding',
          queryVector: emailEmbedding,
          numCandidates: 100, // Number of candidates to consider
          limit: 3, // Return top 3 most similar documents
          filter: { userId: new mongoose.Types.ObjectId(userId) } // Ensure we only search this user's data
        }
      }
    ]);
    let retrievedKnowledge = "No specific knowledge found.";
    if (knowledgeItems.length > 0) {
      retrievedKnowledge = knowledgeItems.map(item => `- Regarding "${item.topic}": ${item.content}`).join('\n');
    }

    // --- 3. Generation Step (Augmented Prompt) ---
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are a helpful personal assistant drafting an email reply.
      Your tone should be professional, friendly, and concise.
      Analyze the original email and use the provided personal knowledge base to draft a relevant and helpful response.
      Do not invent information. If the knowledge base doesn't provide an answer, state that you don't have the information on hand.
      
      **Personal Knowledge Base Snippets:**
      ---
      ${retrievedKnowledge}
      ---

      **Original Email to Reply To:**
      ---
      ${emailContent}
      ---

      **Draft your reply below:**
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const replyText = response.text();

    return replyText.trim();
  } catch (error) {
    console.error('Error generating reply from AI service:', error);
    throw new Error('Failed to generate email reply.');
  }
};
 