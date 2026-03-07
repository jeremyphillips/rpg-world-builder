import type { Response } from 'express'
import { env } from '../config/env'

const COOKIE_NAME = 'token'
const MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

export function setTokenCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
  })
}

export function clearTokenCookie(res: Response) {
  res.clearCookie(COOKIE_NAME)
}
