//  It runs on a schedule and adds jobs to the queue. 
// anologous to the cron that we have in the linux used for the shell script scheduling
import cron from 'node-cron';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import { emailCheckQueue } from './config/queue.js';

dotenv.config();
connectDB();

console.log('Scheduler started. Will run job every 3 minutes.');

// Schedule a task to run every 3 minutes
cron.schedule('*/3 * * * *', async () => {
  console.log('Running scheduled job: Finding users with automation enabled...');
  try {
    const usersToProcess = await User.find({
      isAutomationEnabled: true,
      googleRefreshToken: { $ne: null } // Ensure they have a connected account
    });

    if (usersToProcess.length === 0) {
        console.log("No users with automation enabled found.");
        return;
    }

    // For each user, add a job to the queue
    for (const user of usersToProcess) {
      await emailCheckQueue.add('check-user-inbox', { userId: user._id.toString() });
      console.log(`Added email check job for user: ${user.email}`);
    }
  } catch (error) {
    console.error('Error during scheduled job:', error);
  }
});
