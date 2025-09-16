import 'dotenv/config';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  HTTP_TIMEOUT_MS: Number(process.env.HTTP_TIMEOUT_MS || 8000),
};