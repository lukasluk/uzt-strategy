require('express-async-errors');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { WebSocketServer } = require('ws');
const { query } = require('./db');
const { registerV1Routes } = require('./v1');
const { trafficMonitor } = require('./trafficMonitor');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

const PORT = process.env.PORT || 3000;
const CORS_ORIGINS = String(process.env.CORS_ORIGINS || [
  'https://www.digistrategija.lt',
  'https://digistrategija.lt',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return CORS_ORIGINS.includes(origin);
}

app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Superadmin-Code']
}));
app.use(express.json({ limit: '256kb' }));
app.use('/api/v1', trafficMonitor.createApiRequestMiddleware());

function uuid() {
  return crypto.randomUUID();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

registerV1Routes({ app, query, broadcast, uuid });

app.use((error, req, res, next) => {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  if (res.headersSent) return next(error);

  console.error(`[api-error] ${req.method} ${req.originalUrl}`, error);
  if (statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({ error: error.message || 'request failed' });
  }
  return res.status(500).json({ error: 'internal server error' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'hello' }));
});

server.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
