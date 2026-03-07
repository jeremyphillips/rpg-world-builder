/**
 * Shared database utilities.
 * Centralizes DB access and ObjectId conversion.
 */
import mongoose from 'mongoose'
import { env } from '../config/env'

/** Get the application database instance. */
export function getDb() {
  return mongoose.connection.useDb(env.DB_NAME)
}

/** Convert a string ID to MongoDB ObjectId. */
export function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id)
}
