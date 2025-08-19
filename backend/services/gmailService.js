import { google } from 'googleapis';
import User from '../models/User.js';
import Email from '../models/Email.js'
import { summarizeEmail } from './aiService.js';
/**
 * Creates an authenticated OAuth2 client for the user.
 * It retrieves the user's tokens and sets up the client, refreshing the access token if necessary.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<google.auth.OAuth2>} An authenticated OAuth2 client.
 */
export const getAuthenticatedClient = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.googleRefreshToken) {
    throw new Error('User not found or Google account not connected.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/api/auth/google/callback' // Must match your console URI
  );

  // Set the credentials from the user's stored tokens
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  // The googleapis library automatically handles token refreshing.
  // When you make an API request with an expired access token, it will use the
  // refresh token to get a new one and retry the request. We can also listen for the
  // 'tokens' event to save the new access token if one is generated.
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      console.log('Access token refreshed!');
      user.googleAccessToken = tokens.access_token;
      // You might also get a new refresh token in some cases
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
      await user.save();
    }
  });

  return oauth2Client;
};

/**
 * Decodes a base64url encoded string.
 * @param {string} encodedStr - The base64url encoded string.
 * @returns {string} The decoded string.
 */
const decodeBase64Url = (encodedStr) => {
  if (!encodedStr) return '';
  // Replace base64url specific characters and decode
  const base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
};

/**
 * Extracts the plain text content from an email's payload.
 * @param {object} payload - The message payload from the Gmail API.
 * @returns {string} The plain text content.
 */
const getEmailBody = (payload) => {
    if (payload.body && payload.body.data) {
        return decodeBase64Url(payload.body.data);
    }
    if (payload.parts) {
        const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart && textPart.body && textPart.body.data) {
            return decodeBase64Url(textPart.body.data);
        }
    }
    return ''; // Return empty string if no text part is found
};


/**
 * Fetches recent emails, generates summaries, and saves them to the database.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<Object>>} A list of email documents from the database.
 */
export const fetchAndSummarizeEmails = async (userId) => {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  const user = await User.findById(userId);

  // 1. Get list of recent message IDs
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults: 5, // Let's start with 5 to manage API usage during development
  });

  const messages = listResponse.data.messages;
  if (!messages || messages.length === 0) return [];

  // 2. Process each message
  for (const message of messages) {
    // Check if we've already processed this email
    const existingEmail = await Email.findOne({ userId, messageId: message.id });
    if (existingEmail) {
      console.log(`Skipping already processed email: ${message.id}`);
      continue;
    }

    // 3. Fetch the full email content
    const msgResponse = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full', // Fetch the full content
    });

    const { id, snippet, payload } = msgResponse.data;
    const headers = payload.headers;
    const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
    const dateHeader = headers.find((h) => h.name === 'Date')?.value;
    const receivedAt = dateHeader ? new Date(dateHeader) : new Date();

    // 4. Decode the body and generate a summary
    const fullContent = getEmailBody(payload);
    const summary = await summarizeEmail(fullContent);

    // 5. Save to database
    const newEmail = new Email({
      userId,
      tenantId: user.tenantId,
      messageId: id,
      subject,
      from,
      snippet,
      receivedAt,
      summary,
      fullContent,
    });
    await newEmail.save();
    console.log(`Successfully summarized and saved email: ${subject}`);
  }

  // 6. Return all saved emails for this user, sorted by date
  return Email.find({ userId }).sort({ receivedAt: -1 });
};



/**
 * Fetches the most recent emails from the user's Gmail account.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<Object>>} A list of email objects with id, snippet, and headers.
 */
export const fetchNewUnreadEmails = async (userId) => {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  const user = await User.findById(userId);

  // Get list of messages that are BOTH unread AND newer than 30 minutes
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults: 5, // Process a max of 5 emails per run
    q: 'is:unread newer_than:30m' // <-- Combined filter
  });

  const messages = listResponse.data.messages;
  if (!messages || messages.length === 0) {
    // This is the message you requested
    console.log("No unread messages newer than 30 minutes found.");
    return [];
  }

  const newEmailsSaved = [];
  for (const message of messages) {
    const existingEmail = await Email.findOne({ userId, messageId: message.id });
    if (existingEmail) continue;

    const msgResponse = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full',
    });

    const { id, snippet, payload, threadId } = msgResponse.data;
    const headers = payload.headers;
    const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
    const dateHeader = headers.find((h) => h.name === 'Date')?.value;
    const receivedAt = dateHeader ? new Date(dateHeader) : new Date();

    const fullContent = getEmailBody(payload);
    if (!fullContent) continue;

    const summary = await summarizeEmail(fullContent);

    const newEmail = new Email({
      userId,
      tenantId: user.tenantId,
      messageId: id,
      threadId: threadId, // <-- Saving the threadId
      subject,
      from,
      snippet,
      receivedAt,
      summary,
      fullContent,
    });
    await newEmail.save();
    newEmailsSaved.push(newEmail);
  }
  return newEmailsSaved;
};


export const sendEmailReply = async (userId, { to, subject, message, threadId }) => {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const rawMessage = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        message,
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
            threadId: threadId, // Ensures the reply is part of the correct conversation
        },
    });
};



/**
 * Creates a new Google Sheet for the user to log actions.
 * @param {string} userId - The user's ID.
 * @returns {Promise<string>} The ID of the newly created spreadsheet.
 */
export const createSpreadsheetForUser = async (userId) => {
  const user = await User.findById(userId);
  if (user.spreadsheetId) return user.spreadsheetId; // Already exists

  const auth = await getAuthenticatedClient(userId);
  const sheets = google.sheets({ version: 'v4', auth });

  const resource = {
    properties: {
      title: `${user.name} - AI Email Log`,
    },
  };

  try {
    const spreadsheet = await sheets.spreadsheets.create({ resource });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log(`Created new spreadsheet with ID: ${spreadsheetId}`);

    // Add headers to the new sheet
    const headers = [['Timestamp', 'Sender', 'Subject', 'AI Summary', 'Reply Sent']];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:E1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: headers },
    });
    
    // Save the ID to the user's profile
    user.spreadsheetId = spreadsheetId;
    await user.save();

    return spreadsheetId;
  } catch (err) {
    console.error('Error creating spreadsheet:', err);
    throw new Error('Could not create Google Sheet for logging.');
  }
};

/**
 * Appends a log entry to the user's Google Sheet.
 * @param {string} userId - The user's ID.
 * @param {object} logData - The data to log { from, subject, summary, reply }.
 */
export const logToActionSheet = async (userId, logData) => {
  const user = await User.findById(userId);
  if (!user.spreadsheetId) {
    console.error('No spreadsheet ID found for user to log action.');
    return;
  }

  const auth = await getAuthenticatedClient(userId);
  const sheets = google.sheets({ version: 'v4', auth });

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'IST' });
  const values = [[
    timestamp,
    logData.from,
    logData.subject,
    logData.summary,
    logData.reply,
  ]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: user.spreadsheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    console.log(`Successfully logged action to sheet for user ${userId}`);
  } catch (err) {
    console.error('Error appending data to spreadsheet:', err);
  }
};
