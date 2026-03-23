import Stack from '@mui/material/Stack'

import { AppBadge, AppTooltipWrap } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'
import type {
  CombatantStatBadge,
  CombatantTrackedPartBadge,
  PreviewChip,
  PreviewTone,
} from '../../domain'

export type { CombatantStatBadge, CombatantTrackedPartBadge } from '../../domain'

function previewToneToAppBadgeTone(tone: PreviewTone | undefined): AppBadgeTone {
  if (!tone || tone === 'neutral') return 'default'
  return tone
}

type StatBadgeSize = 'small' | 'medium'

export function CombatantStatBadgeRow({
  stats,
  size = 'medium',
  stackSpacing = 1,
}: {
  stats: CombatantStatBadge[]
  size?: StatBadgeSize
  stackSpacing?: number
}) {
  if (stats.length === 0) return null
  return (
    <Stack direction="row" spacing={stackSpacing} flexWrap="wrap" useFlexGap>
      {stats.map((s) => (
        <AppTooltipWrap key={s.label} tooltip={s.tooltip}>
          <AppBadge
            label={`${s.label}: ${s.value}`}
            tone="default"
            variant="outlined"
            size={size}
          />
        </AppTooltipWrap>
      ))}
    </Stack>
  )
}

export function CombatantTrackedPartBadgeRow({
  parts,
  size = 'medium',
  stackSpacing = 1,
}: {
  parts: CombatantTrackedPartBadge[]
  size?: StatBadgeSize
  stackSpacing?: number
}) {
  if (parts.length === 0) return null
  return (
    <Stack direction="row" spacing={stackSpacing} flexWrap="wrap" useFlexGap>
      {parts.map((tp) => (
        <AppTooltipWrap key={tp.label} tooltip={tp.tooltip}>
          <AppBadge
            label={`${tp.label}: ${tp.current}/${tp.initial}`}
            tone={tp.current < tp.initial ? 'warning' : 'default'}
            variant="outlined"
            size={size}
          />
        </AppTooltipWrap>
      ))}
    </Stack>
  )
}

/** Stat + optional tracked-part badges in one wrap row (active combatant card header). */
export function CombatantCoreBadgeRow({
  stats,
  trackedParts,
  size = 'medium',
}: {
  stats: CombatantStatBadge[]
  trackedParts?: CombatantTrackedPartBadge[]
  size?: StatBadgeSize
}) {
  const hasParts = trackedParts && trackedParts.length > 0
  if (stats.length === 0 && !hasParts) return null
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {stats.map((s) => (
        <AppTooltipWrap key={s.label} tooltip={s.tooltip}>
          <AppBadge
            label={`${s.label}: ${s.value}`}
            tone="default"
            variant="outlined"
            size={size}
          />
        </AppTooltipWrap>
      ))}
      {hasParts &&
        trackedParts!.map((tp) => (
          <AppTooltipWrap key={tp.label} tooltip={tp.tooltip}>
            <AppBadge
              label={`${tp.label}: ${tp.current}/${tp.initial}`}
              tone={tp.current < tp.initial ? 'warning' : 'default'}
              variant="outlined"
              size={size}
            />
          </AppTooltipWrap>
        ))}
    </Stack>
  )
}

/** Preview card condition / state chips (roster lane). */
export function CombatantPreviewChipRow({ chips }: { chips: PreviewChip[] }) {
  if (!chips.length) return null
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {chips.map((chip) => (
        <AppTooltipWrap key={chip.id} tooltip={chip.tooltip}>
          <AppBadge
            label={chip.label}
            tone={previewToneToAppBadgeTone(chip.tone)}
            size="small"
          />
        </AppTooltipWrap>
      ))}
    </Stack>
  )
}
