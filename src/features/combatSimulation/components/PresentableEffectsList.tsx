import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'

import {
  collectPresentableEffects,
  enrichPresentableEffects,
  getSectionOrder,
  groupBySection,
  sortByPriority,
} from '../domain'
import type { CombatStateSection, EnrichedPresentableEffect } from '../domain'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

const SECTION_LABELS: Record<CombatStateSection, string> = {
  'critical-now': 'Critical Now',
  'ongoing-effects': 'Ongoing Effects',
  restrictions: 'Restrictions',
  'turn-triggers': 'Turn Triggers',
  'system-details': 'System Details',
}

function toneToAppBadgeTone(
  tone: EnrichedPresentableEffect['presentation']['tone'],
): AppBadgeTone {
  if (tone === 'neutral') return 'default'
  return tone
}

function EffectChip({ effect }: { effect: EnrichedPresentableEffect }) {
  const boundaryPrefix =
    effect.kind === 'trigger' && 'boundary' in effect
      ? `${effect.boundary === 'start' ? 'Start' : 'End'}: `
      : ''
  const displayLabel = effect.summary ?? effect.label
  const withBoundary = `${boundaryPrefix}${displayLabel}`
  const withDuration = effect.duration ? `${withBoundary} (${effect.duration})` : withBoundary
  return (
    <AppBadge
      label={withDuration}
      tone={toneToAppBadgeTone(effect.presentation.tone)}
      variant="outlined"
      size="small"
    />
  )
}

function EffectSection({
  section,
  effects,
  showEmpty = false,
}: {
  section: CombatStateSection
  effects: EnrichedPresentableEffect[]
  showEmpty?: boolean
}) {
  if (effects.length === 0 && !showEmpty) return null

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {SECTION_LABELS[section]}
      </Typography>
      {effects.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          None.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {effects.map((effect) => (
            <EffectChip key={effect.id} effect={effect} />
          ))}
        </Stack>
      )}
    </Box>
  )
}

type PresentableEffectsListProps = {
  combatant: CombatantInstance
  /** When true, only show user-facing effects. Default: false (show all for debug) */
  userFacingOnly?: boolean
}

export function PresentableEffectsList({
  combatant,
  userFacingOnly = false,
}: PresentableEffectsListProps) {
  const presentable = collectPresentableEffects(combatant)
  const enriched = enrichPresentableEffects(presentable)
  const filtered = userFacingOnly
    ? enriched.filter((e) => e.presentation.userFacing !== false)
    : enriched
  const sorted = sortByPriority(filtered)
  const grouped = groupBySection(sorted)
  const sectionOrder = getSectionOrder()

  return (
    <Stack spacing={2}>
      {sectionOrder.map((section) => (
        <EffectSection
          key={section}
          section={section}
          effects={grouped[section]}
          showEmpty={false}
        />
      ))}
    </Stack>
  )
}

type PresentableEffectsHeaderChipsProps = {
  combatant: CombatantInstance
}

/** Chips for showInHeader effects to display in the card header. */
export function PresentableEffectsHeaderChips({
  combatant,
}: PresentableEffectsHeaderChipsProps) {
  const presentable = collectPresentableEffects(combatant)
  const enriched = enrichPresentableEffects(presentable)
  const headerEffects = enriched.filter(
    (e) => e.presentation.showInHeader && e.presentation.userFacing !== false,
  )

  if (headerEffects.length === 0) return null

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {headerEffects.map((effect) => (
        <EffectChip key={effect.id} effect={effect} />
      ))}
    </Stack>
  )
}
