import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { aiClient } from './services/aiClient.js';
import { auditChainInstance } from './services/auditChain.js';
import { getFallbackInventory } from './services/fallbackInventory.js';

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

// Root greeting & status endpoint (avoids "Cannot GET /")
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PROBAHO Backend API Gateway',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: '/api/health',
      facilities: '/api/facilities',
      medicines: '/api/medicines',
      inventory: '/api/inventory',
      suppliers: '/api/suppliers',
      dashboard_summary: '/api/dashboard/summary'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'probaho-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// AI compatibility routes for direct frontend consumption
app.get('/ai/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'probaho-ai-gateway',
    timestamp: new Date().toISOString()
  });
});

app.get('/ai/inventory', async (req, res) => {
  try {
    const data = await aiClient.getInventory();
    res.json(data);
  } catch {
    res.json(getFallbackInventory());
  }
});

app.get('/ai/audit', (req, res) => {
  res.json({
    data_label: 'Synthetic audit log',
    events: auditChainInstance.getLogs()
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

