import mongoose from 'mongoose'
import { env } from '../../../shared/config/env'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const gameSessionsCollection = () => db().collection('gameSessions')

export type GameSessionStatus =
  | 'draft'
  | 'scheduled'
  | 'lobby'
  | 'active'
  | 'completed'
  | 'cancelled'

export type GameSessionParticipantRole = 'dm' | 'player' | 'observer'

export interface GameSessionParticipantDoc {
  userId: mongoose.Types.ObjectId
  characterId?: mongoose.Types.ObjectId | null
  role: GameSessionParticipantRole
}

export interface GameSessionDoc {
  campaignId: mongoose.Types.ObjectId
  dmUserId: mongoose.Types.ObjectId
  status: GameSessionStatus
  title: string
  scheduledFor: string | null
  locationId?: string | null
  buildingId?: string | null
  floorId?: string | null
  locationLabel?: string | null
  participants: GameSessionParticipantDoc[]
  activeEncounterId?: string | null
  createdAt: Date
  updatedAt: Date
}

export type GameSessionApi = {
  id: string
  campaignId: string
  dmUserId: string
  status: GameSessionStatus
  title: string
  scheduledFor: string | null
  location: {
    locationId: string | null
    buildingId: string | null
    floorId: string | null
    label: string | null
  }
  participants: Array<{
    userId: string
    characterId: string | null
    role: GameSessionParticipantRole
  }>
  activeEncounterId: string | null
  createdAt: string
  updatedAt: string
}

function docToApi(doc: GameSessionDoc & { _id: mongoose.Types.ObjectId }): GameSessionApi {
  return {
    id: doc._id.toString(),
    campaignId: doc.campaignId.toString(),
    dmUserId: doc.dmUserId.toString(),
    status: doc.status,
    title: doc.title,
    scheduledFor: doc.scheduledFor,
    location: {
      locationId: doc.locationId ?? null,
      buildingId: doc.buildingId ?? null,
      floorId: doc.floorId ?? null,
      label: doc.locationLabel ?? null,
    },
    participants: (doc.participants ?? []).map((p) => ({
      userId: p.userId.toString(),
      characterId: p.characterId ? p.characterId.toString() : null,
      role: p.role,
    })),
    activeEncounterId: doc.activeEncounterId ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function listGameSessionsForCampaign(campaignId: string): Promise<GameSessionApi[]> {
  const cid = new mongoose.Types.ObjectId(campaignId)
  const docs = await gameSessionsCollection()
    .find({ campaignId: cid })
    .sort({ scheduledFor: -1, updatedAt: -1 })
    .toArray()
  return docs.map((d) => docToApi(d as GameSessionDoc & { _id: mongoose.Types.ObjectId }))
}

export async function getGameSessionById(
  gameSessionId: string,
  campaignId: string,
): Promise<GameSessionApi | null> {
  let oid: mongoose.Types.ObjectId
  try {
    oid = new mongoose.Types.ObjectId(gameSessionId)
  } catch {
    return null
  }
  const cid = new mongoose.Types.ObjectId(campaignId)
  const doc = await gameSessionsCollection().findOne({
    _id: oid,
    campaignId: cid,
  })
  if (!doc) return null
  return docToApi(doc as GameSessionDoc & { _id: mongoose.Types.ObjectId })
}

export async function createGameSession(
  campaignId: string,
  dmUserId: string,
  data: {
    title: string
    status?: GameSessionStatus
    scheduledFor?: string | null
    locationId?: string | null
    buildingId?: string | null
    floorId?: string | null
    locationLabel?: string | null
  },
): Promise<GameSessionApi> {
  const now = new Date()
  const uid = new mongoose.Types.ObjectId(dmUserId)
  const status: GameSessionStatus =
    data.status !== undefined && isGameSessionStatus(data.status) ? data.status : 'draft'
  const doc: GameSessionDoc = {
    campaignId: new mongoose.Types.ObjectId(campaignId),
    dmUserId: uid,
    status,
    title: data.title.trim(),
    scheduledFor: data.scheduledFor ?? null,
    locationId: data.locationId ?? null,
    buildingId: data.buildingId ?? null,
    floorId: data.floorId ?? null,
    locationLabel: data.locationLabel ?? null,
    participants: [{ userId: uid, role: 'dm', characterId: null }],
    activeEncounterId: null,
    createdAt: now,
    updatedAt: now,
  }
  const result = await gameSessionsCollection().insertOne(doc)
  const inserted = await gameSessionsCollection().findOne({ _id: result.insertedId })
  if (!inserted) throw new Error('Failed to read game session after insert')
  return docToApi(inserted as GameSessionDoc & { _id: mongoose.Types.ObjectId })
}

const STATUS_SET = new Set<GameSessionStatus>([
  'draft',
  'scheduled',
  'lobby',
  'active',
  'completed',
  'cancelled',
])

export function isGameSessionStatus(value: unknown): value is GameSessionStatus {
  return typeof value === 'string' && STATUS_SET.has(value as GameSessionStatus)
}

export async function updateGameSession(
  gameSessionId: string,
  campaignId: string,
  patch: {
    title?: string
    status?: GameSessionStatus
    scheduledFor?: string | null
    locationId?: string | null
    buildingId?: string | null
    floorId?: string | null
    locationLabel?: string | null
    activeEncounterId?: string | null
  },
): Promise<GameSessionApi | null> {
  let oid: mongoose.Types.ObjectId
  try {
    oid = new mongoose.Types.ObjectId(gameSessionId)
  } catch {
    return null
  }
  const cid = new mongoose.Types.ObjectId(campaignId)

  const $set: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.title !== undefined) $set.title = patch.title.trim()
  if (patch.status !== undefined) {
    if (!STATUS_SET.has(patch.status)) return null
    $set.status = patch.status
  }
  if (patch.scheduledFor !== undefined) $set.scheduledFor = patch.scheduledFor
  if (patch.locationId !== undefined) $set.locationId = patch.locationId
  if (patch.buildingId !== undefined) $set.buildingId = patch.buildingId
  if (patch.floorId !== undefined) $set.floorId = patch.floorId
  if (patch.locationLabel !== undefined) $set.locationLabel = patch.locationLabel
  if (patch.activeEncounterId !== undefined) $set.activeEncounterId = patch.activeEncounterId

  const doc = await gameSessionsCollection().findOneAndUpdate(
    { _id: oid, campaignId: cid },
    { $set },
    { returnDocument: 'after' },
  )
  if (!doc) return null
  return docToApi(doc as GameSessionDoc & { _id: mongoose.Types.ObjectId })
}
