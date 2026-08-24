import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

let connectionPromise;

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is missing. Add it to server/.env.');

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log(`[CampusPulse] MongoDB connected: ${mongoose.connection.host}`);
      return mongoose.connection;
    })
    .catch(error => {
      console.error(`[CampusPulse] MongoDB connection failed: ${error.message}`);
      throw error;
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  return connectionPromise;
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export function databaseState() {
  return ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
}
