import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'probaho_dev_jwt_secret_key_change_in_production_2026',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

