import 'dotenv/config';
console.log('[CampusPulse] Loading environment');
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB, databaseState, isDatabaseReady } from './config/db.js';
import { ensureIndexes } from './config/ensureIndexes.js';
import { configurePassport } from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import { initSocket } from './services/socket/socketService.js';

console.log('[CampusPulse] Initializing Express');
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
if (!clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
  throw new Error('CLIENT_URL must be a valid http(s) URL.');
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_with_a_long_random_secret') {
  throw new Error('JWT_SECRET is missing or still using the placeholder value. Update server/.env.');
}

console.log('[CampusPulse] Loading middleware');
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
configurePassport();
app.use(passport.initialize());

console.log('[CampusPulse] Loading routes');
app.get('/api/health', (req, res) => {
  const database = databaseState();
  const ready = isDatabaseReady();
  return res.status(ready ? 200 : 503).json({
    success: ready,
    message: ready ? 'CampusPulse API is running' : 'CampusPulse API is running, but MongoDB is unavailable',
    database
  });
});
app.use('/api', (req, res, next) => {
  if (isDatabaseReady()) return next();
  return res.status(503).json({
    success: false,
    message: 'Database is temporarily unavailable. Check MONGO_URI or start MongoDB, then try again.'
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', notificationRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(`Request error: ${err.message}`);
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {}).filter(f => f !== 'provider')[0];
    const message = field === 'email'
      ? 'An account with this email already exists'
      : field
        ? `A record with this ${field} already exists`
        : 'A record with the same unique value already exists';
    return res.status(409).json({ success: false, message });
  }
  if (err?.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : (err?.message || 'Internal server error');
  console.error('Detailed request error:', err);
  return res.status(500).json({ success: false, message });
});

let reconnectTimer;
let portRetryTimer;
let shuttingDown = false;

async function connectWithRetry() {
  if (shuttingDown || isDatabaseReady()) return;
  console.log('[CampusPulse] Connecting MongoDB');
  try {
    await connectDB();
    await ensureIndexes();
  } catch (error) {
    console.error('[CampusPulse] MongoDB is unreachable. The API remains online and will retry in 10 seconds.');
    console.error(`[CampusPulse] ${error.message}`);
    reconnectTimer = setTimeout(connectWithRetry, 10000);
  }
}

function start() {
  console.log('[CampusPulse] Starting HTTP server');
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: clientUrl, credentials: true },
    transports: ['websocket', 'polling']
  });
  initSocket(io);
  const server = httpServer.listen(PORT, () => {
    console.log(`[CampusPulse] Server running on port ${PORT}`);
    console.log(`CampusPulse API listening on http://localhost:${PORT}`);
    console.log('[CampusPulse] Socket.IO enabled');
    void connectWithRetry();
  });

  server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[CampusPulse] Port ${PORT} is already in use. Another server is listening on this port.`);
      console.error('[CampusPulse] Backend will not crash. Stop the existing listener, then restart this process.');
      clearTimeout(portRetryTimer);
      portRetryTimer = setTimeout(() => {
        if (!shuttingDown && !server.listening) {
          server.listen(PORT);
        }
      }, 3000);
      return;
    }
    console.error(`[CampusPulse] HTTP server error: ${error.stack || error}`);
  });

  const shutdown = async signal => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearTimeout(reconnectTimer);
    clearTimeout(portRetryTimer);
    console.log(`[CampusPulse] ${signal}: shutting down`);
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close().catch(() => undefined);
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

start();
