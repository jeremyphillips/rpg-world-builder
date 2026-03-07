import mongoose from 'mongoose'
import { env } from '../shared/config/env'

const collection = () => mongoose.connection.useDb(env.DB_NAME).collection('settingData')

/**
 * Each settingId gets one document that holds:
 *  - worldMapUrl
 *  - customLocations[]
 *  - locationOverrides (keyed by location id) for editing data-defined locations
 */

export interface LocationDoc {
  id: string
  settingId: string
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
  settingId: string
  worldMapUrl?: string | null
  customLocations: LocationDoc[]
  locationOverrides: Record<string, LocationOverride>
}

export async function getSettingData(settingId: string): Promise<SettingDataDoc | null> {
  const doc = await collection().findOne({ settingId })
  return doc as unknown as SettingDataDoc | null
}

export async function ensureSettingData(settingId: string): Promise<SettingDataDoc> {
  const existing = await getSettingData(settingId)
  if (existing) return existing

  const doc: SettingDataDoc = {
    settingId,
    worldMapUrl: null,
    customLocations: [],
    locationOverrides: {},
  }
  await collection().insertOne(doc as any)
  return doc
}

export async function updateWorldMapUrl(settingId: string, worldMapUrl: string | null) {
  await collection().updateOne(
    { settingId },
    { $set: { worldMapUrl } },
    { upsert: true }
  )
}

export async function addCustomLocation(settingId: string, location: LocationDoc) {
  await collection().updateOne(
    { settingId },
    {
      $push: { customLocations: location } as any,
      $setOnInsert: { worldMapUrl: null, locationOverrides: {} },
    },
    { upsert: true }
  )
}

export async function updateCustomLocation(settingId: string, locationId: string, updates: Partial<LocationDoc>) {
  // Use arrayFilters to update specific item in customLocations array
  await collection().updateOne(
    { settingId, 'customLocations.id': locationId },
    {
      $set: Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [`customLocations.$.${k}`, v])
      ),
    }
  )
}

export async function deleteCustomLocation(settingId: string, locationId: string) {
  await collection().updateOne(
    { settingId },
    { $pull: { customLocations: { id: locationId } } as any }
  )
}

export async function setLocationOverride(settingId: string, locationId: string, override: LocationOverride) {
  await collection().updateOne(
    { settingId },
    { $set: { [`locationOverrides.${locationId}`]: override } },
    { upsert: true }
  )
}
