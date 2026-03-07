import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  DB_NAME: process.env.DB_NAME ?? 'dnd',
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://localhost:27017',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  AUTH_SECRET: process.env.AUTH_SECRET ?? '',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
  IMAGE_BASE_URL: process.env.IMAGE_BASE_URL ?? '/uploads/',
  INVITE_TOKEN_EXPIRY_DAYS: Number(process.env.INVITE_TOKEN_EXPIRY_DAYS) || 14,
} as const
