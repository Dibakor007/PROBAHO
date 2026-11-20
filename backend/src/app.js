import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';

const app = express();

// Rate limiter protecting free-tier resources
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'probaho-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount consolidated API router
app.use('/api', apiRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[PROBAHO Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

export default app;

