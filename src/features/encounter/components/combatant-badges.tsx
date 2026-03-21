import { type ReactElement } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { AppBadge, AppTooltip } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'
import type {
  CombatantStatBadge,
  CombatantTrackedPartBadge,
  PreviewChip,
  PreviewTone,
} from '../domain'

export type { CombatantStatBadge, CombatantTrackedPartBadge } from '../domain'

export function BadgeWithOptionalTooltip({
  tooltip,
  children,
}: {
  tooltip?: string
  children: ReactElement
}) {
  if (!tooltip?.trim()) return children
  return (
    <AppTooltip title={tooltip} placement="top">
      <Box component="span" sx={{ display: 'inline-flex' }}>
        {children}
      </Box>
    </AppTooltip>
  )
}

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
        <BadgeWithOptionalTooltip key={s.label} tooltip={s.tooltip}>
          <AppBadge
            label={`${s.label}: ${s.value}`}
            tone="default"
            variant="outlined"
            size={size}
          />
        </BadgeWithOptionalTooltip>
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
        <BadgeWithOptionalTooltip key={tp.label} tooltip={tp.tooltip}>
          <AppBadge
            label={`${tp.label}: ${tp.current}/${tp.initial}`}
            tone={tp.current < tp.initial ? 'warning' : 'default'}
            variant="outlined"
            size={size}
          />
        </BadgeWithOptionalTooltip>
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
        <BadgeWithOptionalTooltip key={s.label} tooltip={s.tooltip}>
          <AppBadge
            label={`${s.label}: ${s.value}`}
            tone="default"
            variant="outlined"
            size={size}
          />
        </BadgeWithOptionalTooltip>
      ))}
      {hasParts &&
        trackedParts!.map((tp) => (
          <BadgeWithOptionalTooltip key={tp.label} tooltip={tp.tooltip}>
            <AppBadge
              label={`${tp.label}: ${tp.current}/${tp.initial}`}
              tone={tp.current < tp.initial ? 'warning' : 'default'}
              variant="outlined"
              size={size}
            />
          </BadgeWithOptionalTooltip>
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
        <BadgeWithOptionalTooltip key={chip.id} tooltip={chip.tooltip}>
          <AppBadge
            label={chip.label}
            tone={previewToneToAppBadgeTone(chip.tone)}
            size="small"
          />
        </BadgeWithOptionalTooltip>
      ))}
    </Stack>
  )
}
