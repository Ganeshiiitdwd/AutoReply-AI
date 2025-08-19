import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null
});

// A queue to handle checking a user's inbox
export const emailCheckQueue = new Queue('email-check', { connection });

// A queue to handle processing a single email (summary + reply)
export const emailProcessQueue = new Queue('email-process', { connection });
