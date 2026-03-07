import jwt from 'jsonwebtoken'
import { env } from '../config/env'

interface TokenPayload {
  userId: string
  role: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.AUTH_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.AUTH_SECRET) as TokenPayload
}
