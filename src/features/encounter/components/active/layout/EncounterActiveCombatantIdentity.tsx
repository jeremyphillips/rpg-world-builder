import type { Monster } from '@/features/content/monsters/domain/types'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import { formatCharacterDetailSubtitle } from '@/features/character/formatters'
import { useCharacter } from '@/features/character/hooks'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import { buildCombatantPreviewChips } from '@/features/encounter/helpers/presentation'
import { formatEncounterHeaderSensesLine } from './formatEncounterHeaderSenses'
import { combatToneToAppBadgeTone } from '../../shared/cards/combatant-badges'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'

const MAX_CHIPS = 4

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

  const allChips = buildCombatantPreviewChips(combatant, {
    maxConditions: 3,
    includeStates: false,
    maxDefenseChips: 2,
  })
  const chips = allChips.slice(0, MAX_CHIPS).map((c) => ({
    ...c,
    tone: combatToneToAppBadgeTone(c.tone),
  }))

  const sensesLine = formatEncounterHeaderSensesLine(combatant)

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
      {sensesLine && (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {sensesLine}
        </Typography>
      )}
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
