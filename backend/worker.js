// worker.js
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import connectDB from './config/db.js';
import { emailCheckQueue, emailProcessQueue } from './config/queue.js';
import {  getAuthenticatedClient, fetchNewUnreadEmails, sendEmailReply  } from './services/gmailService.js'; // We'll reuse this
import Email from './models/Email.js'
import {generateReply} from './services/aiService.js'
import { createSpreadsheetForUser, logToActionSheet } from './services/gmailService.js';
dotenv.config();
connectDB();

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null
});

console.log('Worker is listening for jobs...');

// --- Worker for Checking a User's Inbox ---
new Worker('email-check', async job => {
  const { userId } = job.data;
  console.log(`Checking emails for user: ${userId}`);
  try {
    // This function now returns newly saved emails
    const newEmails = await fetchNewUnreadEmails(userId); 
    for (const email of newEmails) {
      // For each new email, add a job to the processing queue
      await emailProcessQueue.add('process-single-email', { emailId: email._id, userId });
      console.log(`Added email ${email.subject} to processing queue.`);
    }
  } catch (error) {
    console.error(`Failed to check emails for user ${userId}:`, error.message);
  }
}, { connection });


// --- Worker for Processing a Single Email ---
new Worker('email-process', async job => {
    const { emailId, userId } = job.data;
    console.log(`Processing emailId: ${emailId}`);
    try {
      // Capture the exact start time when the worker picks up the job
        const processingStartTime = new Date();  
        // Ensure a spreadsheet exists for the user, create if not.
        await createSpreadsheetForUser(userId);
        const email = await Email.findById(emailId);
        if (!email) throw new Error('Email not found');

        const draft = await generateReply(email.fullContent, userId);
        
        await sendEmailReply(userId, {
            to: email.from,
            subject: `Re: ${email.subject}`,
            message: draft,
            threadId: email.threadId // <-- Using the correct threadId
        });
        console.log(`Successfully replied to email: "${email.subject}"`);
        //  Capture the exact end time after the reply is sent
        const processedAt = new Date();
        //  Calculate the new response time based on the worker's processing
        const responseTime = (processedAt.getTime() - processingStartTime.getTime()) / 1000;
        
        email.processedAt = processedAt;
        email.responseTime = responseTime; // Now stores only the processing time
        await email.save();
        // --- Log the action to Google Sheets ---
        await logToActionSheet(userId, {
            from: email.from,
            subject: email.subject,
            summary: email.summary,
            reply: draft,
        });

        // Mark the original email as read to prevent loops
        const auth = await getAuthenticatedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth });
        await gmail.users.messages.modify({
            userId: 'me',
            id: email.messageId,
            requestBody: { removeLabelIds: ['UNREAD'] }
        });
        console.log(`Marked email "${email.subject}" as read.`);
    } catch (error) {
        console.error(`Failed to process email ${emailId}:`, error.message);
    }
}, { connection });