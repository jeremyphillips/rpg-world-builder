import type { Request, Response } from 'express'
import * as sessionInviteService from '../services/sessionInvite.service'

export async function getSessionInvites(req: Request, res: Response) {
  const { sessionId } = req.params
  try {
    const invites = await sessionInviteService.getSessionInvitesForSession(sessionId)
    const normalized = invites.map((doc) => ({
      id: doc._id.toString(),
      sessionId: doc.sessionId.toString(),
      campaignId: doc.campaignId.toString(),
      userId: doc.userId.toString(),
      status: doc.status,
      createdAt: doc.createdAt,
      respondedAt: doc.respondedAt,
    }))
    res.json({ invites: normalized })
  } catch (err) {
    console.error('Failed to load session invites:', err)
    res.status(500).json({ error: 'Failed to load session invites' })
  }
}

export async function getMySessionInvite(req: Request, res: Response) {
  const { sessionId } = req.params
  try {
    const invite = await sessionInviteService.getSessionInviteForUser(sessionId, req.userId!)
    if (!invite) {
      res.json({ invite: null })
      return
    }
    res.json({
      invite: {
        id: invite._id.toString(),
        sessionId: invite.sessionId.toString(),
        campaignId: invite.campaignId.toString(),
        userId: invite.userId.toString(),
        status: invite.status,
        createdAt: invite.createdAt,
        respondedAt: invite.respondedAt,
      },
    })
  } catch (err) {
    console.error('Failed to load session invite:', err)
    res.status(500).json({ error: 'Failed to load session invite' })
  }
}

export async function respondToSessionInvite(req: Request, res: Response) {
  const { id } = req.params
  const { accept } = req.body

  if (typeof accept !== 'boolean') {
    res.status(400).json({ error: 'accept (boolean) is required' })
    return
  }

  try {
    const updated = await sessionInviteService.respondToSessionInvite(id, req.userId!, accept)
    if (!updated) {
      res.status(404).json({ error: 'Session invite not found' })
      return
    }
    res.json({
      invite: {
        id: updated._id.toString(),
        sessionId: updated.sessionId.toString(),
        campaignId: updated.campaignId.toString(),
        userId: updated.userId.toString(),
        status: updated.status,
        createdAt: updated.createdAt,
        respondedAt: updated.respondedAt,
      },
    })
  } catch (err) {
    console.error('Failed to respond to session invite:', err)
    res.status(500).json({ error: 'Failed to respond to session invite' })
  }
}
