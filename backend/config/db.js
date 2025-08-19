// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DATABASE CONNECTED SUCCESSFULLY...');
  } catch (err) {
    console.error('DATABASE CONNECTION ERROR:', err.message);
    process.exit(1);
  }
};

export default connectDB;
