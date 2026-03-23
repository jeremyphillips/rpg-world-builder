import type { CharacterClassSummary } from '@/features/character/read-model/character-read.types'
import type { CharacterDetailDto } from '@/features/character/read-model'

import { formatCharacterIdentityLine } from './formatCharacterIdentityLine'

/**
 * Single source of truth for character list/card subtitles: race, class line (multiclass + subclass via
 * {@link formatCharacterIdentityLine}), optional owner. Use this anywhere a “who is this?” subtitle is shown
 * so race/class/owner stay consistent (encounter modals, setup/active preview cards, etc.).
 */
export type CharacterSubtitleInput = {
  raceName?: string | null
  classes: CharacterClassSummary[]
  ownerName?: string | null
}

export function formatCharacterSubtitleLine(input: CharacterSubtitleInput): string {
  const classLine = formatCharacterIdentityLine(input.classes)
  const parts = [input.raceName, classLine || undefined, input.ownerName].filter(Boolean) as string[]
  return parts.join(' · ')
}

/** Subtitle from a loaded character detail (e.g. setup roster, active lane after `useCharacter`). */
export function formatCharacterDetailSubtitle(
  character: Pick<CharacterDetailDto, 'race' | 'classes'> & { ownerName?: string | null },
): string {
  return formatCharacterSubtitleLine({
    raceName: character.race?.name,
    classes: character.classes,
    ownerName: character.ownerName,
  })
}
