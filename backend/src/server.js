import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDbMode } from './db/connection.js';
import { orderWsServer } from './websocket/server.js';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import kitchenRoutes from './routes/kitchen.js';
import walletRoutes from './routes/wallet.js';
import feedbackRoutes from './routes/feedback.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import recommendationsRoutes from './routes/recommendations.js';
import groupOrderRoutes from './routes/groupOrder.js';
import notificationsRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with 10mb limit for base64 image uploads
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/group', groupOrderRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health & System status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CampusBite Automated Canteen Platform v2.5 (Smart Campus Edition)',
    databaseEngine: getDbMode(),
    timestamp: new Date().toISOString()
  });
});

// Create HTTP and WebSocket Server
const server = http.createServer(app);

// Attach WebSocket server on /ws/orders
orderWsServer.init(server);

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/ws/orders' || pathname === '/ws') {
    orderWsServer.wss.handleUpgrade(request, socket, head, (ws) => {
      orderWsServer.wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Boot up server
async function startServer() {
  await initDatabase();
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 CampusBite Server running on http://localhost:${PORT}`);
    console.log(`📡 Live Order Tracking WebSockets on ws://localhost:${PORT}/ws/orders`);
    console.log(`💾 Database Engine: ${getDbMode()}`);
    console.log(`=======================================================`);
  });
}

startServer();
