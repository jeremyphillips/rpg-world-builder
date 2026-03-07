import type { Request, Response } from 'express'
import * as characterService from '../services/character.service'
import { validateRequired } from '../validators/common'

export async function getCharacters(req: Request, res: Response) {
  const type = req.query.type as string | undefined
  const characters = await characterService.getCharactersByUser(req.userId!, type)
  res.json({ characters })
}

export async function getMyCharacters(req: Request, res: Response) {
  const type = req.query.type as string | undefined
  const characters = await characterService.getMyCharactersWithCampaign(req.userId!, type)
  res.json({ characters })
}

export async function getCharactersAvailableForCampaign(req: Request, res: Response) {
  const characters = await characterService.getCharactersAvailableForCampaign(req.userId!)
  res.json({ characters })
}

export async function getCharacter(req: Request, res: Response) {
  const result = await characterService.getCharacterWithContext(
    req.params.id,
    req.userId!,
    req.userRole,
  )
  res.json(result)
}

export async function createCharacter(req: Request, res: Response) {
  const nameCheck = validateRequired(req.body.name, 'Character name')
  if (!nameCheck.valid) {
    res.status(400).json({ error: nameCheck.message })
    return
  }

  const character = await characterService.createCharacterWithCampaignLink(req.userId!, req.body)
  res.status(201).json({ character })
}

export async function updateCharacter(req: Request, res: Response) {
  const updated = await characterService.updateCharacterWithPolicy(
    req.params.id,
    req.userId!,
    req.userRole,
    req.body,
  )
  res.json({ character: updated })
}

export async function deleteCharacter(req: Request, res: Response) {
  const result = await characterService.deleteCharacterWithMemberships(
    req.params.id,
    req.userId!,
    req.userRole,
  )
  res.json(result)
}
