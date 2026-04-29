import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { env } from '../../../shared/config/env'
import { badRequest } from '../../../shared/errors/ApiError'
import { signToken } from '../../../shared/utils/jwt'
import { getPublicUrl, normalizeImageKey } from '../../../shared/services/image.service'
import { authUserPreferencesFromDb } from '@/shared/auth/authUserPreferences'
import type { AuthUserPreferences } from '@/shared'

interface AuthUserPayload {
  id: string
  username: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  avatarKey?: string | null
  avatarUrl?: string
  bio?: string
  website?: string
  preferences: AuthUserPreferences
}

interface LoginResult {
  token: string
  user: AuthUserPayload
}

export async function loginUser(email: string, password: string): Promise<LoginResult | null> {
  const db = mongoose.connection.useDb(env.DB_NAME)
  const user = await db.collection('users').findOne({ email })

  if (!user || !user.active) return null

  const valid = await bcrypt.compare(password, user.passwordHash as string)
  if (!valid) return null

  const token = signToken({ userId: user._id.toString(), role: user.role as string })

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.username as string,
      email: user.email as string,
      role: user.role as string,
      firstName: (user.firstName as string) ?? undefined,
      lastName: (user.lastName as string) ?? undefined,
      avatarKey: (user.avatarKey as string) ?? null,
      avatarUrl: getPublicUrl(user.avatarKey as string),
      bio: (user.bio as string) ?? undefined,
      website: (user.website as string) ?? undefined,
      preferences: authUserPreferencesFromDb(user.preferences),
    },
  }
}

export async function getUserById(userId: string) {
  const db = mongoose.connection.useDb(env.DB_NAME)
  const user = await db.collection('users').findOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { projection: { passwordHash: 0 } },
  )

  if (!user) return null

  return {
    id: user._id.toString(),
    username: user.username as string,
    email: user.email as string,
    role: user.role as string,
    firstName: (user.firstName as string) ?? undefined,
    lastName: (user.lastName as string) ?? undefined,
    avatarKey: (user.avatarKey as string) ?? null,
    avatarUrl: getPublicUrl(user.avatarKey as string),
    bio: (user.bio as string) ?? undefined,
    website: (user.website as string) ?? undefined,
    preferences: authUserPreferencesFromDb(user.preferences),
  }
}

export interface RegisterWithInviteTokenResult {
  user: NonNullable<Awaited<ReturnType<typeof getUserById>>>
  campaignId?: string
  campaignName?: string
}

/**
 * Registers a new user, optionally with invite token.
 * Validates token, creates user, updates profile, consumes token if valid.
 * All DB access in this service.
 */
export async function registerWithInviteToken(body: {
  username: string
  password: string
  firstName?: string
  lastName?: string
  inviteToken?: string
}): Promise<RegisterWithInviteTokenResult> {
  const { username, password, firstName, lastName, inviteToken } = body

  let email: string | undefined
  let tokenDoc: Awaited<
    ReturnType<typeof import('../../campaign/services/invite.service').validateInviteToken>
  > = null

  if (inviteToken) {
    const { validateInviteToken } = await import('../../campaign/services/invite.service')
    tokenDoc = await validateInviteToken(inviteToken)
    if (!tokenDoc) {
      throw badRequest('Invalid or expired invite token')
    }
    email = tokenDoc.email
  }

  const { createUser } = await import('../../user/services/user.service')
  const user = await createUser({
    username,
    email: email ?? '',
    password,
    role: 'user',
  })

  if (!user) {
    throw new Error('Failed to create user')
  }

  const userId = (user._id as mongoose.Types.ObjectId).toString()

  if (firstName || lastName) {
    await updateProfile(userId, { firstName, lastName })
  }

  let campaignId: string | undefined
  let campaignName: string | undefined

  if (tokenDoc && inviteToken) {
    const { consumeInviteToken } = await import('../../campaign/services/invite.service')
    await consumeInviteToken(inviteToken, userId)
    campaignId = (tokenDoc.campaignId as mongoose.Types.ObjectId).toString()

    const { getCampaignById } = await import('../../campaign/services/campaign.service')
    const campaign = await getCampaignById(campaignId)
    campaignName = campaign?.identity?.name
  }

  const authUser = await getUserById(userId)
  if (!authUser) throw new Error('Failed to load created user')
  return { user: authUser, campaignId, campaignName }
}

export interface AcceptInviteTokenResult {
  campaignId: string
  campaignName: string
}

/**
 * Consumes an invite token for a logged-in user.
 * Validates token, consumes it, returns campaign info.
 */
export async function acceptInviteToken(
  token: string,
  userId: string,
): Promise<AcceptInviteTokenResult> {
  const { validateInviteToken, consumeInviteToken } = await import(
    '../../campaign/services/invite.service'
  )
  const tokenDoc = await validateInviteToken(token)
  if (!tokenDoc) {
    throw badRequest('Invalid or expired invite token')
  }

  await consumeInviteToken(token, userId)

  const campaignId = (tokenDoc.campaignId as mongoose.Types.ObjectId).toString()
  const { getCampaignById } = await import('../../campaign/services/campaign.service')
  const campaign = await getCampaignById(campaignId)

  return {
    campaignId,
    campaignName: campaign?.identity?.name ?? '',
  }
}

function applyPreferencesPatch(
  $set: Record<string, unknown>,
  preferences: Partial<AuthUserPreferences>,
) {
  if (preferences.notifications) {
    for (const [key, val] of Object.entries(preferences.notifications)) {
      if (val !== undefined) {
        $set[`preferences.notifications.${key}`] = val
      }
    }
  }
  const hideSpells = preferences.ui?.contentLists?.spells?.hideDisallowed
  if (hideSpells !== undefined) {
    $set['preferences.ui.contentLists.spells.hideDisallowed'] = hideSpells
  }
  const hideClasses = preferences.ui?.contentLists?.classes?.hideDisallowed
  if (hideClasses !== undefined) {
    $set['preferences.ui.contentLists.classes.hideDisallowed'] = hideClasses
  }
  const hideRaces = preferences.ui?.contentLists?.races?.hideDisallowed
  if (hideRaces !== undefined) {
    $set['preferences.ui.contentLists.races.hideDisallowed'] = hideRaces
  }
  const hideMonsters = preferences.ui?.contentLists?.monsters?.hideDisallowed
  if (hideMonsters !== undefined) {
    $set['preferences.ui.contentLists.monsters.hideDisallowed'] = hideMonsters
  }
  const hideLocations = preferences.ui?.contentLists?.locations?.hideDisallowed
  if (hideLocations !== undefined) {
    $set['preferences.ui.contentLists.locations.hideDisallowed'] = hideLocations
  }
  const hideSkillProficiencies = preferences.ui?.contentLists?.skillProficiencies?.hideDisallowed
  if (hideSkillProficiencies !== undefined) {
    $set['preferences.ui.contentLists.skillProficiencies.hideDisallowed'] = hideSkillProficiencies
  }
  const hideArmor = preferences.ui?.contentLists?.armor?.hideDisallowed
  if (hideArmor !== undefined) {
    $set['preferences.ui.contentLists.armor.hideDisallowed'] = hideArmor
  }
  const hideGear = preferences.ui?.contentLists?.gear?.hideDisallowed
  if (hideGear !== undefined) {
    $set['preferences.ui.contentLists.gear.hideDisallowed'] = hideGear
  }
  const hideWeapons = preferences.ui?.contentLists?.weapons?.hideDisallowed
  if (hideWeapons !== undefined) {
    $set['preferences.ui.contentLists.weapons.hideDisallowed'] = hideWeapons
  }
  const hideMagicItems = preferences.ui?.contentLists?.magicItems?.hideDisallowed
  if (hideMagicItems !== undefined) {
    $set['preferences.ui.contentLists.magicItems.hideDisallowed'] = hideMagicItems
  }
}

export async function updateProfile(
  userId: string,
  data: {
    firstName?: string
    lastName?: string
    username?: string
    avatarKey?: string | null
    bio?: string
    website?: string
    email?: string
    preferences?: Partial<AuthUserPreferences>
  },
) {
  const db = mongoose.connection.useDb(env.DB_NAME)
  const $set: Record<string, unknown> = {}

  if (data.firstName !== undefined) $set.firstName = data.firstName
  if (data.lastName !== undefined) $set.lastName = data.lastName
  if (data.username !== undefined) $set.username = data.username
  if (data.avatarKey !== undefined) $set.avatarKey = normalizeImageKey(data.avatarKey)
  if (data.bio !== undefined) $set.bio = data.bio
  if (data.website !== undefined) $set.website = data.website
  if (data.email !== undefined) $set.email = data.email

  if (data.preferences) {
    applyPreferencesPatch($set, data.preferences)
  }

  if (Object.keys($set).length === 0) return getUserById(userId)

  await db.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $set },
  )

  return getUserById(userId)
}
