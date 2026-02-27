import type { Request, Response } from 'express'
import * as sessionService from '../services/session.service'
import { getUserCharacterIds, getUserMembershipsMap } from '../services/campaignMember.service'
import { getCampaignById, getOwnedCampaignIds } from '../services/campaign.service'
import { canViewSession, type ViewerContext } from '../../shared/domain/capabilities'
import type { CampaignRole } from '../../shared/types'

function isPlatformAdmin(req: Request): boolean {
  return req.userRole === 'admin' || req.userRole === 'superadmin'
}

function normalizeSession(s: Record<string, any>) {
  return {
    id: s._id.toString(),
    campaignId: s.campaignId?.toString(),
    date: s.date,
    title: s.title,
    notes: s.notes,
    status: s.status,
  }
}

export async function getSessions(req: Request, res: Response) {
  try {
    const sessions = await sessionService.getSessionsForUser(req.userId!, req.userRole!)

    if (isPlatformAdmin(req)) {
      res.json({ sessions: sessions.map(normalizeSession) })
      return
    }

    const campaignIds = [
      ...new Set(
        sessions
          .map((s) => s.campaignId?.toString())
          .filter((id): id is string => !!id),
      ),
    ]

    const [membershipsMap, ownedIds] = await Promise.all([
      getUserMembershipsMap(req.userId!, campaignIds),
      getOwnedCampaignIds(req.userId!, campaignIds),
    ])

    const filtered = sessions.filter((s) => {
      const cid = s.campaignId?.toString()
      if (!cid) return false
      const membership = membershipsMap.get(cid)
      const ctx: ViewerContext = {
        campaignRole: (membership?.campaignRole as CampaignRole) ?? null,
        isOwner: ownedIds.has(cid),
        isPlatformAdmin: false,
        characterIds: membership?.characterIds ?? [],
      }
      return canViewSession(ctx, s.visibility as sessionService.SessionDoc['visibility'])
    })

    res.json({ sessions: filtered.map(normalizeSession) })
  } catch (err) {
    console.error('Failed to get sessions:', err)
    res.status(500).json({ error: 'Failed to load sessions' })
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const doc = await sessionService.getSessionById(req.params.id)
    if (!doc) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    if (!isPlatformAdmin(req)) {
      const cid = doc.campaignId?.toString()
      if (cid) {
        const campaign = await getCampaignById(cid)
        const ownerStr = campaign?.membership?.ownerId?.toString()
        const isOwner = ownerStr === req.userId
        const charIds = await getUserCharacterIds(cid, req.userId!)

        const members = await getUserMembershipsMap(req.userId!, [cid])
        const membership = members.get(cid)

        const ctx: ViewerContext = {
          campaignRole: (membership?.campaignRole as CampaignRole) ?? null,
          isOwner,
          isPlatformAdmin: false,
          characterIds: charIds,
        }

        if (!canViewSession(ctx, doc.visibility as sessionService.SessionDoc['visibility'])) {
          res.status(404).json({ error: 'Session not found' })
          return
        }
      }
    }

    res.json({ session: normalizeSession(doc) })
  } catch (err) {
    console.error('Failed to get session:', err)
    res.status(500).json({ error: 'Failed to load session' })
  }
}

export async function createSession(req: Request, res: Response) {
  const { campaignId, date, title, notes, visibility } = req.body

  if (!campaignId) {
    res.status(400).json({ error: 'campaignId is required' })
    return
  }
  if (!date) {
    res.status(400).json({ error: 'date is required' })
    return
  }

  try {
    const doc = await sessionService.createSession(req.userId!, {
      campaignId,
      date,
      title,
      notes,
      visibility,
    })

    const session = doc
      ? {
          id: doc._id.toString(),
          campaignId: doc.campaignId?.toString(),
          date: doc.date,
          title: doc.title,
          notes: doc.notes,
          status: doc.status,
        }
      : null

    res.status(201).json({ session })
  } catch (err) {
    console.error('Failed to create session:', err)
    res.status(500).json({ error: 'Failed to create session' })
  }
}

export async function updateSession(req: Request, res: Response) {
  const { title, notes, date, status } = req.body

  try {
    const doc = await sessionService.updateSession(req.params.id, { title, notes, date, status })
    if (!doc) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    const session = {
      id: doc._id.toString(),
      campaignId: doc.campaignId?.toString(),
      date: doc.date,
      title: doc.title,
      notes: doc.notes,
      status: doc.status,
    }
    res.json({ session })
  } catch (err) {
    console.error('Failed to update session:', err)
    res.status(500).json({ error: 'Failed to update session' })
  }
}

export async function deleteSession(req: Request, res: Response) {
  try {
    await sessionService.deleteSession(req.params.id, req.userId!)
    res.json({ message: 'Session deleted' })
  } catch (err) {
    console.error('Failed to delete session:', err)
    res.status(500).json({ error: 'Failed to delete session' })
  }
}
