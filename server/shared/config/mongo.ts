import mongoose from 'mongoose'
import { env } from './env'

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, { dbName: env.DB_NAME })
    console.log(`Connected to MongoDB (${env.DB_NAME})`)
  } catch (err) {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  }
}
