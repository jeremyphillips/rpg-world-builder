import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { AppAvatar, type AvatarSize } from '@/ui/primitives'

import {
  resolveCombatantAvatarSrc,
  type CombatantPortraitEntry,
} from '../../helpers/resolveCombatantAvatarSrc'

export type CombatantAvatarProps = {
  combatant: CombatantInstance
  monstersById: Record<string, Monster>
  characterPortraitById: Record<string, CombatantPortraitEntry>
  /** When set (e.g. from `useCharacter`), tried before roster/catalog. */
  portraitOverride?: CombatantPortraitEntry | null
  /** Duplicate-aware or display label; defaults to `combatant.source.label`. */
  displayName?: string
  size?: AvatarSize
}

export function CombatantAvatar({
  combatant,
  monstersById,
  characterPortraitById,
  portraitOverride,
  displayName,
  size = 'sm',
}: CombatantAvatarProps) {
  const src = resolveCombatantAvatarSrc(
    combatant,
    { monstersById, characterPortraitById },
    portraitOverride,
  )
  return (
    <AppAvatar
      src={src}
      name={displayName ?? combatant.source.label}
      size={size}
    />
  )
}
