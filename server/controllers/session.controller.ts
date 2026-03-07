import type { Request, Response } from 'express'
import { validateRequired } from '../shared/validators/common'
import * as sessionService from '../services/session.service'

export async function getSessions(req: Request, res: Response) {
  const sessions = await sessionService.getSessionsForUserWithVisibility(
    req.userId!,
    req.userRole!,
  )
  res.json({ sessions })
}

export async function getSession(req: Request, res: Response) {
  const session = await sessionService.getSessionByIdWithAccess(
    req.params.id,
    req.userId!,
    req.userRole!,
  )
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.json({ session })
}

export async function createSession(req: Request, res: Response) {
  const campaignIdCheck = validateRequired(req.body.campaignId, 'campaignId')
  if (!campaignIdCheck.valid) {
    res.status(400).json({ error: campaignIdCheck.message })
    return
  }
  const dateCheck = validateRequired(req.body.date, 'date')
  if (!dateCheck.valid) {
    res.status(400).json({ error: dateCheck.message })
    return
  }

  const { campaignId, date, title, notes, visibility } = req.body
  try {
    const session = await sessionService.createSession(req.userId!, {
      campaignId,
      date,
      title,
      notes,
      visibility,
    })
    res.status(201).json({ session })
  } catch (err) {
    console.error('Failed to create session:', err)
    res.status(500).json({ error: 'Failed to create session' })
  }
}

export async function updateSession(req: Request, res: Response) {
  const { title, notes, date, status } = req.body

  try {
    const session = await sessionService.updateSession(req.params.id, {
      title,
      notes,
      date,
      status,
    })
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
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
