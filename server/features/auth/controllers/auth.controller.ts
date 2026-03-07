import type { Request, Response } from 'express'
import { validateRequired } from '../../../shared/validators/common'
import { loginUser, getUserById, updateProfile } from '../services/auth.service'
import { setTokenCookie, clearTokenCookie } from '../../../shared/utils/cookies'
import { signToken, verifyToken } from '../../../shared/utils/jwt'

export async function login(req: Request, res: Response) {
  const emailCheck = validateRequired(req.body.email, 'email')
  if (!emailCheck.valid) {
    res.status(400).json({ error: emailCheck.message })
    return
  }
  const passwordCheck = validateRequired(req.body.password, 'password')
  if (!passwordCheck.valid) {
    res.status(400).json({ error: passwordCheck.message })
    return
  }

  const { email, password } = req.body
  const result = await loginUser(email, password)

  if (!result) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  setTokenCookie(res, result.token)
  res.json({ user: result.user })
}

export async function logout(_req: Request, res: Response) {
  clearTokenCookie(res)
  res.json({ message: 'Logged out' })
}

export async function getMe(req: Request, res: Response) {
  const token = req.cookies?.token

  if (!token) {
    res.json({ user: null })
    return
  }

  try {
    const payload = verifyToken(token)
    const user = await getUserById(payload.userId)

    if (!user) {
      res.json({ user: null })
      return
    }

    res.json({ user })
  } catch {
    res.json({ user: null })
  }
}

export async function updateMe(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const {
    firstName, lastName, username, avatarKey,
    bio, website, email, notificationPreferences,
  } = req.body

  const user = await updateProfile(req.userId, {
    firstName, lastName, username, avatarKey,
    bio, website, email, notificationPreferences,
  })
  res.json({ user })
}

export async function register(req: Request, res: Response) {
  const { username, firstName, lastName, password, inviteToken } = req.body

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' })
    return
  }

  try {
    const { registerWithInviteToken } = await import('../services/auth.service')
    const result = await registerWithInviteToken({
      username,
      password,
      firstName,
      lastName,
      inviteToken,
    })

    const token = signToken({
      userId: result.user.id,
      role: result.user.role,
    })
    setTokenCookie(res, token)

    res.status(201).json({
      user: result.user,
      campaignId: result.campaignId,
      campaignName: result.campaignName,
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      res.status(409).json({ error: 'A user with that email or username already exists' })
      return
    }
    throw err
  }
}

/**
 * Resolves an invite token — returns the token status, campaign info,
 * whether the user exists, is logged in, is a member, and has a character.
 * Works for both authenticated and unauthenticated callers.
 */
export async function resolveInvite(req: Request, res: Response) {
  const { token: inviteToken } = req.body

  if (!inviteToken) {
    res.status(400).json({ error: 'token is required' })
    return
  }

  const mongoose = await import('mongoose')
  const { env } = await import('../../../shared/config/env')
  const db = mongoose.default.connection.useDb(env.DB_NAME)

  // Check if token was already consumed
  const rawDoc = await db.collection('inviteTokens').findOne({ token: inviteToken })
  if (!rawDoc) {
    res.json({ status: 'invalid' })
    return
  }
  if (rawDoc.usedAt) {
    res.json({ status: 'used' })
    return
  }
  if (new Date() > (rawDoc.expiresAt as Date)) {
    res.json({ status: 'expired' })
    return
  }

  // Token is valid — gather campaign info
  const campaign = await db.collection('campaigns').findOne(
    { _id: rawDoc.campaignId },
    { projection: { 'identity.name': 1 } },
  )

  const campaignInfo = {
    campaignId: rawDoc.campaignId.toString(),
    campaignName: (campaign?.identity?.name as string) ?? '',
  }

  // Check if an account with this email already exists
  const existingUser = await db.collection('users').findOne(
    { email: rawDoc.email },
    { projection: { _id: 1 } },
  )

  // Is the caller logged in?
  let loggedInUserId: string | null = null
  const cookieToken = req.cookies?.token
  if (cookieToken) {
    try {
      const payload = verifyToken(cookieToken)
      loggedInUserId = payload.userId
    } catch { /* expired/invalid session — treat as unauthenticated */ }
  }

  // Not logged in
  if (!loggedInUserId) {
    res.json({
      status: 'valid',
      userExists: !!existingUser,
      loggedIn: false,
      email: rawDoc.email,
      ...campaignInfo,
    })
    return
  }

  // Logged in — check campaign membership and character
  const member = await db.collection('campaignMembers').findOne({
    campaignId: rawDoc.campaignId,
    userId: new mongoose.default.Types.ObjectId(loggedInUserId),
  })

  let hasCharacter = false
  if (member?.characterId) {
    const character = await db.collection('characters').findOne(
      { _id: member.characterId, deletedAt: { $exists: false } },
      { projection: { _id: 1 } },
    )
    hasCharacter = !!character
  }

  res.json({
    status: 'valid',
    userExists: true,
    loggedIn: true,
    email: rawDoc.email,
    isMember: !!member,
    hasCharacter,
    ...campaignInfo,
  })
}

/**
 * Consumes an invite token for a logged-in user and joins the campaign.
 * Used when the user already has an account (vs. registration which also consumes).
 */
export async function acceptInvite(req: Request, res: Response) {
  const { token: inviteToken } = req.body

  if (!inviteToken || !req.userId) {
    res.status(400).json({ error: 'token is required and user must be authenticated' })
    return
  }

  const { acceptInviteToken } = await import('../services/auth.service')
  const result = await acceptInviteToken(inviteToken, req.userId)
  res.json(result)
}

/** Returns the token for Socket.io auth. Client must call with credentials. */
export async function getSocketToken(req: Request, res: Response) {
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  try {
    verifyToken(token)
    res.json({ token })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
