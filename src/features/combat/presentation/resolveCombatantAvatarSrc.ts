import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantInstance } from '@/features/mechanics/domain/combat'
import { resolveImageUrl } from '@/shared/lib/media'

/** Stored portrait fields for a character (PC/NPC). */
export type CombatantPortraitEntry = {
  imageKey?: string | null
  imageUrl?: string | null
}

export type CombatantAvatarResolutionContext = {
  monstersById: Record<string, Monster>
  characterPortraitById: Record<string, CombatantPortraitEntry>
}

/**
 * Resolve a displayable image URL for a combatant token/avatar.
 * When `portraitOverride` is set, it is tried first; if it does not resolve, falls back to catalog/roster.
 */
export function resolveCombatantAvatarSrc(
  combatant: CombatantInstance,
  ctx: CombatantAvatarResolutionContext,
  portraitOverride?: CombatantPortraitEntry | null,
): string | undefined {
  if (portraitOverride != null) {
    const fromOverride = resolveImageUrl(portraitOverride.imageKey ?? portraitOverride.imageUrl)
    if (fromOverride) return fromOverride
  }

  const fromInstance = resolveImageUrl(combatant.portraitImageKey)
  if (fromInstance) return fromInstance

  const { kind, sourceId } = combatant.source
  if (kind === 'monster') {
    return resolveImageUrl(ctx.monstersById[sourceId]?.imageKey)
  }
  if (kind === 'pc' || kind === 'npc') {
    const p = ctx.characterPortraitById[sourceId]
    return resolveImageUrl(p?.imageKey ?? p?.imageUrl)
  }
  return undefined
}
