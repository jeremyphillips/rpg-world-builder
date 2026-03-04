import type { Request, Response } from 'express'
import { loginUser, getUserById, updateProfile } from '../services/auth.service'
import { setTokenCookie, clearTokenCookie } from '../utils/cookies'
import { signToken, verifyToken } from '../utils/jwt'

export async function login(req: Request, res: Response) {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

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

  try {
    const user = await updateProfile(req.userId, {
      firstName, lastName, username, avatarKey,
      bio, website, email, notificationPreferences,
    })
    res.json({ user })
  } catch (err) {
    console.error('Failed to update profile:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

export async function register(req: Request, res: Response) {
  const { username, firstName, lastName, password, inviteToken } = req.body

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' })
    return
  }

  try {
    // If an invite token is provided, validate it and derive the email
    let email: string | undefined
    let tokenDoc: Awaited<ReturnType<typeof import('../services/invite.service').validateInviteToken>> = null

    if (inviteToken) {
      const inviteService = await import('../services/invite.service')
      tokenDoc = await inviteService.validateInviteToken(inviteToken)
      if (!tokenDoc) {
        res.status(400).json({ error: 'Invalid or expired invite token' })
        return
      }
      email = tokenDoc.email
    }

    // Create the user
    const userService = await import('../services/user.service')
    const user = await userService.createUser({
      username,
      email: email ?? '',
      password,
      role: 'user',
    })

    if (!user) {
      res.status(500).json({ error: 'Failed to create user' })
      return
    }

    // Update profile with first/last name
    if (firstName || lastName) {
      await updateProfile(user._id.toString(), { firstName, lastName })
    }

    // Auto-login
    const token = signToken({ userId: user._id.toString(), role: 'user' })
    setTokenCookie(res, token)

    // If invite token was valid, consume it and add user to campaign
    let campaignId: string | undefined
    let campaignName: string | undefined
    let campaignEdition: string | undefined
    let campaignSetting: string | undefined

    if (tokenDoc && inviteToken) {
      const inviteService = await import('../services/invite.service')
      await inviteService.consumeInviteToken(inviteToken, user._id.toString())

      campaignId = tokenDoc.campaignId.toString()

      // Look up campaign name for the client redirect
      const mongoose = await import('mongoose')
      const { env } = await import('../config/env')
      const db = mongoose.default.connection.useDb(env.DB_NAME)
      const campaign = await db.collection('campaigns').findOne(
        { _id: tokenDoc.campaignId },
        { projection: { 'identity.name': 1 } },
      )
      campaignName = (campaign?.identity?.name as string) ?? undefined
    }

    const authUser = await getUserById(user._id.toString())

    res.status(201).json({
      user: authUser,
      campaignId,
      campaignName,
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      res.status(409).json({ error: 'A user with that email or username already exists' })
      return
    }
    console.error('Failed to register:', err)
    res.status(500).json({ error: 'Failed to create account' })
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

  try {
    const inviteService = await import('../services/invite.service')
    const mongoose = await import('mongoose')
    const { env } = await import('../config/env')
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
  } catch (err) {
    console.error('Failed to resolve invite:', err)
    res.status(500).json({ error: 'Failed to resolve invite' })
  }
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

  try {
    const inviteService = await import('../services/invite.service')
    const tokenDoc = await inviteService.validateInviteToken(inviteToken)

    if (!tokenDoc) {
      res.status(400).json({ error: 'Invalid or expired invite token' })
      return
    }

    // Consume token
    await inviteService.consumeInviteToken(inviteToken, req.userId)

    const mongoose = await import('mongoose')
    const { env } = await import('../config/env')
    const db = mongoose.default.connection.useDb(env.DB_NAME)

    const campaign = await db.collection('campaigns').findOne(
      { _id: tokenDoc.campaignId },
      { projection: { 'identity.name': 1 } },
    )

    res.json({
      campaignId: tokenDoc.campaignId.toString(),
      campaignName: (campaign?.identity?.name as string) ?? '',
    })
  } catch (err) {
    console.error('Failed to accept invite:', err)
    res.status(500).json({ error: 'Failed to accept invite' })
  }
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
