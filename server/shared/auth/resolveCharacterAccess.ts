/**
 * Character-scoped access resolution.
 * Determines read/write/delete permissions based on ownership and campaign admin status.
 */
import mongoose from 'mongoose'
import { isPlatformAdmin as checkPlatformAdmin } from './platformAdmin'

export type CharacterAccess = {
  isOwner: boolean
  isPlatformAdmin: boolean
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
}

export function resolveCharacterAccess(args: {
  character: { userId: mongoose.Types.ObjectId }
  userId: string
  userRole?: string | null
  isCampaignAdmin?: boolean
}): CharacterAccess {
  const isOwner = args.character.userId.equals(new mongoose.Types.ObjectId(args.userId))
  const isPlatformAdmin = checkPlatformAdmin(args.userRole)
  const canRead = isOwner || isPlatformAdmin
  const canWrite = isOwner || isPlatformAdmin || Boolean(args.isCampaignAdmin)
  const canDelete = isOwner || isPlatformAdmin
  return { isOwner, isPlatformAdmin, canRead, canWrite, canDelete }
}
