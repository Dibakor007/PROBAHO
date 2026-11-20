import app from './app.js';
import { config } from './config/env.js';
import { db } from './services/db.js';

if (process.env.NODE_ENV !== 'test') {
  db.init().then(() => {
    app.listen(config.port, () => {
      console.log(`[PROBAHO Backend] Gateway listening on port ${config.port} (${config.nodeEnv})`);
      console.log(`[PROBAHO Backend] Connected to AI Service at ${config.aiServiceUrl}`);
    });
  });
}

export default app;
