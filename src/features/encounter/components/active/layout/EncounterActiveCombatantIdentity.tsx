import type { Monster } from '@/features/content/monsters/domain/types'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import { formatCharacterDetailSubtitle } from '@/features/character/formatters'
import { useCharacter } from '@/features/character/hooks'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import type { PreviewTone } from '../../../domain'
import { buildCombatantPreviewChips } from '../../../helpers'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'

const MAX_CHIPS = 4

function mapPreviewTone(t: PreviewTone | undefined): AppBadgeTone {
  switch (t) {
    case 'info':
      return 'info'
    case 'warning':
      return 'warning'
    case 'danger':
      return 'danger'
    case 'success':
      return 'success'
    default:
      return 'default'
  }
}

type EncounterActiveCombatantIdentityProps = {
  combatant: CombatantInstance
  displayLabel: string
  monstersById: Record<string, Monster | undefined>
}

export function EncounterActiveCombatantIdentity({
  combatant,
  displayLabel,
  monstersById,
}: EncounterActiveCombatantIdentityProps) {
  const characterId =
    combatant.source.kind === 'pc' || combatant.source.kind === 'npc'
      ? combatant.source.sourceId
      : undefined
  const { character } = useCharacter(characterId)

  const subtitle =
    combatant.source.kind === 'monster'
      ? (() => {
          const block = monstersById[combatant.source.sourceId]
          return block ? formatMonsterIdentityLine(block) : undefined
        })()
      : character
        ? formatCharacterDetailSubtitle(character)
        : undefined

  const chips = buildCombatantPreviewChips(combatant, {
    maxConditions: 3,
    includeStates: false,
    maxDefenseChips: 2,
    maxTotalChips: MAX_CHIPS,
    includeTooltips: false,
  }).map((c) => ({
    ...c,
    tone: mapPreviewTone(c.tone),
  }))

  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
        {displayLabel}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {subtitle}
        </Typography>
      )}
      <Typography variant="body1" color="text.secondary">
        HP: <strong>{combatant.stats.currentHitPoints}/{combatant.stats.maxHitPoints}</strong> · AC: <strong>{combatant.stats.armorClass}</strong>
      </Typography>
      {chips.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {chips.map((c) => (
            <AppBadge key={c.id} label={c.label} tone={c.tone} variant="outlined" size="small" />
          ))}
        </Box>
      )}
    </Stack>
  )
}
