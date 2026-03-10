import mongoose from 'mongoose'
import { env } from '../../../shared/config/env'

const collection = () => mongoose.connection.useDb(env.DB_NAME).collection('settingData')

/**
 * Each campaignId gets one document that holds:
 *  - worldMapUrl
 *  - customLocations[]
 *  - locationOverrides (keyed by location id) for editing data-defined locations
 *
 * Migrated from settingId scope to campaignId scope (Phase 2).
 */

export interface LocationDoc {
  id: string
  campaignId: string
  name: string
  type: string
  description?: string
  imageKey?: string
  parentLocationId?: string
  visibility: { allCharacters: boolean; characterIds: string[] }
  isCustom?: boolean
}

export interface LocationOverride {
  name?: string
  type?: string
  description?: string
  imageKey?: string | null
  visibility?: { allCharacters: boolean; characterIds: string[] }
}

export interface SettingDataDoc {
  campaignId: string
  worldMapUrl?: string | null
  customLocations: LocationDoc[]
  locationOverrides: Record<string, LocationOverride>
}

export async function getSettingData(campaignId: string): Promise<SettingDataDoc | null> {
  const doc = await collection().findOne({ campaignId })
  return doc as unknown as SettingDataDoc | null
}

export async function ensureSettingData(campaignId: string): Promise<SettingDataDoc> {
  const existing = await getSettingData(campaignId)
  if (existing) return existing

  const doc: SettingDataDoc = {
    campaignId,
    worldMapUrl: null,
    customLocations: [],
    locationOverrides: {},
  }
  await collection().insertOne(doc as Record<string, unknown>)
  return doc
}

export async function updateWorldMapUrl(campaignId: string, worldMapUrl: string | null) {
  await collection().updateOne(
    { campaignId },
    { $set: { worldMapUrl } },
    { upsert: true }
  )
}

export async function addCustomLocation(campaignId: string, location: LocationDoc) {
  await collection().updateOne(
    { campaignId },
    {
      $push: { customLocations: location } as Record<string, unknown>,
      $setOnInsert: { worldMapUrl: null, locationOverrides: {} },
    },
    { upsert: true }
  )
}

export async function updateCustomLocation(campaignId: string, locationId: string, updates: Partial<LocationDoc>) {
  await collection().updateOne(
    { campaignId, 'customLocations.id': locationId },
    {
      $set: Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [`customLocations.$.${k}`, v])
      ),
    }
  )
}

export async function deleteCustomLocation(campaignId: string, locationId: string) {
  await collection().updateOne(
    { campaignId },
    { $pull: { customLocations: { id: locationId } } as Record<string, unknown> }
  )
}

export async function setLocationOverride(campaignId: string, locationId: string, override: LocationOverride) {
  await collection().updateOne(
    { campaignId },
    { $set: { [`locationOverrides.${locationId}`]: override } },
    { upsert: true }
  )
}
