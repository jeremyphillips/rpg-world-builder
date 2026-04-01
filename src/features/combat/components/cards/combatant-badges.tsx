import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge, AppTooltipWrap } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'
import type { CombatStateTone } from '@/features/mechanics/domain/combat/presentation/effects/presentable-effects.types'
import type {
  CombatantStatBadge,
  CombatantTrackedPartBadge,
  PreviewChip,
  PreviewTone,
} from '@/features/mechanics/domain/combat/presentation/view/tactical-preview.types'

export type { CombatantStatBadge, CombatantTrackedPartBadge }

/** Shared tone mapper: CombatStateTone / PreviewTone → AppBadgeTone. */
export function combatToneToAppBadgeTone(
  tone: PreviewTone | CombatStateTone | undefined,
): AppBadgeTone {
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

function chipDisplayLabel(chip: PreviewChip): string {
  return chip.timeLabel ? `${chip.label} ${chip.timeLabel}` : chip.label
}

/** Preview card condition / state chips with optional +N overflow. */
export function CombatantPreviewChipRow({
  chips,
  maxVisible,
}: {
  chips: PreviewChip[]
  maxVisible?: number
}) {
  if (!chips.length) return null
  const visible = maxVisible != null ? chips.slice(0, maxVisible) : chips
  const overflow = maxVisible != null ? Math.max(0, chips.length - maxVisible) : 0
  const overflowTooltip =
    overflow > 0 ? chips.slice(maxVisible).map((c) => c.label).join(', ') : undefined

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
      {visible.map((chip) => (
        <AppTooltipWrap key={chip.id} tooltip={chip.tooltip}>
          <AppBadge
            label={chipDisplayLabel(chip)}
            tone={combatToneToAppBadgeTone(chip.tone)}
            size="small"
          />
        </AppTooltipWrap>
      ))}
      {overflow > 0 && (
        <AppTooltipWrap tooltip={overflowTooltip}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            +{overflow}
          </Typography>
        </AppTooltipWrap>
      )}
    </Stack>
  )
}
