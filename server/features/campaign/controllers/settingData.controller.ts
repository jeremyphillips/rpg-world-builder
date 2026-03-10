import type { Request, Response } from 'express'
import * as settingDataService from '../services/settingData.service'
import { getPublicUrl } from '../../../shared/services/image.service'

function normalizeLocation(loc: Record<string, unknown> | null | undefined) {
  const { imageKey, ...rest } = loc ?? {}
  return { ...rest, imageUrl: getPublicUrl(imageKey as string) }
}

function normalizeOverrides(overrides: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const [id, o] of Object.entries(overrides)) {
    const { imageKey, ...rest } = (o as Record<string, unknown>) ?? {}
    result[id] = { ...rest, imageUrl: getPublicUrl(imageKey as string) }
  }
  return result
}

// GET /api/campaigns/:id/setting-data
export async function getSettingData(req: Request, res: Response) {
  try {
    const campaignId = req.params.id
    const data = await settingDataService.getSettingData(campaignId)

    res.json({
      worldMapUrl: data?.worldMapUrl ?? null,
      customLocations: (data?.customLocations ?? []).map(normalizeLocation),
      locationOverrides: normalizeOverrides(data?.locationOverrides ?? {}),
    })
  } catch (err) {
    console.error('Failed to get setting data:', err)
    res.status(500).json({ error: 'Failed to load setting data' })
  }
}

// PATCH /api/campaigns/:id/setting-data/world-map
export async function updateWorldMap(req: Request, res: Response) {
  try {
    const campaignId = req.params.id
    const { worldMapUrl } = req.body

    await settingDataService.updateWorldMapUrl(campaignId, worldMapUrl ?? null)
    res.json({ worldMapUrl: worldMapUrl ?? null })
  } catch (err) {
    console.error('Failed to update world map:', err)
    res.status(500).json({ error: 'Failed to update world map' })
  }
}

// POST /api/campaigns/:id/setting-data/locations
export async function createLocation(req: Request, res: Response) {
  try {
    const campaignId = req.params.id
    const location = req.body

    if (!location.id || !location.name) {
      res.status(400).json({ error: 'Location id and name are required' })
      return
    }

    await settingDataService.addCustomLocation(campaignId, {
      ...location,
      campaignId,
      isCustom: true,
    })

    res.status(201).json({ location })
  } catch (err) {
    console.error('Failed to create location:', err)
    res.status(500).json({ error: 'Failed to create location' })
  }
}

// PATCH /api/campaigns/:id/setting-data/locations/:locationId
export async function updateLocation(req: Request, res: Response) {
  try {
    const campaignId = req.params.id
    const { locationId } = req.params
    const updates = req.body
    const isCustom = updates.isCustom

    if (isCustom) {
      await settingDataService.updateCustomLocation(campaignId, locationId, updates)
    } else {
      await settingDataService.setLocationOverride(campaignId, locationId, updates)
    }

    res.json({ message: 'Location updated' })
  } catch (err) {
    console.error('Failed to update location:', err)
    res.status(500).json({ error: 'Failed to update location' })
  }
}

// DELETE /api/campaigns/:id/setting-data/locations/:locationId
export async function deleteLocation(req: Request, res: Response) {
  try {
    const campaignId = req.params.id
    const { locationId } = req.params
    await settingDataService.deleteCustomLocation(campaignId, locationId)
    res.json({ message: 'Location deleted' })
  } catch (err) {
    console.error('Failed to delete location:', err)
    res.status(500).json({ error: 'Failed to delete location' })
  }
}
