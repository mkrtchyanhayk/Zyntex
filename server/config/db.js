import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/zyntex';

async function connectWithRetry(retry = 0) {
  try {
    await mongoose.connect(mongoUri, { autoIndex: true });
    console.log('MongoDB connected');
  } catch (err) {
    const delayMs = Math.min(1000 * Math.pow(2, retry), 15000);
    console.error(`MongoDB connection error (retry in ${delayMs}ms):`, err.message);
    setTimeout(() => connectWithRetry(retry + 1), delayMs);
  }
}

connectWithRetry();

