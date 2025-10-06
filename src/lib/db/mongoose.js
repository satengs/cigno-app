import mongoose from 'mongoose';
import { getConfig } from '../config';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const config = getConfig();
    if (!config.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }

    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      family: 4,
      retryWrites: true,
      retryReads: true
    };

    cached.promise = mongoose.connect(config.MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log('✅ MongoDB connected successfully');
    
    // Add connection event listeners
    cached.conn.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      cached.conn = null;
      cached.promise = null;
    });
    
    cached.conn.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      cached.conn = null;
      cached.promise = null;
    });
    
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
