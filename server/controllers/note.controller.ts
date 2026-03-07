import type { Request, Response } from 'express'
import { validateRequired } from '../shared/validators/common'
import * as noteService from '../services/note.service'

export async function getNotes(req: Request, res: Response) {
  // req.campaign attached by requireCampaignRole('observer')
  const notes = await noteService.getNotesByCampaign(req.params.id)
  res.json({ notes })
}

export async function createNote(req: Request, res: Response) {
  // req.campaign attached by requireCampaignRole('admin')
  const titleCheck = validateRequired(req.body.title, 'title')
  if (!titleCheck.valid) {
    res.status(400).json({ error: titleCheck.message })
    return
  }
  const { title, body } = req.body
  const note = await noteService.createNote(req.params.id, req.userId!, { title, body })
  res.status(201).json({ note })
}

export async function updateNote(req: Request, res: Response) {
  // req.campaign attached by requireCampaignRole('admin')
  const existing = await noteService.getNoteById(req.params.noteId)
  if (!existing) {
    res.status(404).json({ error: 'Note not found' })
    return
  }

  const { title, body } = req.body
  const note = await noteService.updateNote(req.params.noteId, { title, body })
  res.json({ note })
}

export async function deleteNote(req: Request, res: Response) {
  // req.campaign attached by requireCampaignRole('admin')
  const existing = await noteService.getNoteById(req.params.noteId)
  if (!existing) {
    res.status(404).json({ error: 'Note not found' })
    return
  }

  await noteService.deleteNote(req.params.noteId)
  res.json({ message: 'Note deleted' })
}
