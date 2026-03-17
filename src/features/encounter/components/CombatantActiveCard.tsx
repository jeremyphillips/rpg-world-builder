import { useState } from 'react'

import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { AppBadge } from '@/ui/primitives'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { EnrichedPresentableEffect, CombatStateSection } from '../domain'
import { formatSigned } from '../helpers'

type StatEntry = { label: string; value: string }

type CombatantActiveCardProps = {
  title: string
  subtitle?: string
  stats: StatEntry[]
  actions: CombatActionDefinition[]
  bonusActions: CombatActionDefinition[]
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
  combatEffects: Record<CombatStateSection, EnrichedPresentableEffect[]>
  trackedParts?: Array<{ label: string; current: number; initial: number }>
}

const SECTION_LABELS: Record<CombatStateSection, string> = {
  'critical-now': 'Critical',
  'ongoing-effects': 'Ongoing Effects',
  'restrictions': 'Restrictions',
  'turn-triggers': 'Turn Triggers',
  'system-details': 'System Details',
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Box>
      <ButtonBase
        onClick={() => setOpen((prev) => !prev)}
        sx={{ width: '100%', justifyContent: 'space-between', py: 1, px: 0.5, borderRadius: 1 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">({count})</Typography>
        </Stack>
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ButtonBase>
      <Collapse in={open}>{children}</Collapse>
    </Box>
  )
}

function ActionRow({
  action,
  isSelected,
  onSelect,
}: {
  action: CombatActionDefinition
  isSelected: boolean
  onSelect?: () => void
}) {
  const costParts: string[] = []
  if (action.cost.action) costParts.push('Action')
  if (action.cost.bonusAction) costParts.push('Bonus')
  if (action.cost.reaction) costParts.push('Reaction')
  if (action.cost.movementFeet) costParts.push(`${action.cost.movementFeet} ft`)
  const costLabel = costParts.join(', ') || '—'

  const detailParts: string[] = []
  if (action.attackProfile) {
    detailParts.push(`${formatSigned(action.attackProfile.attackBonus)} to hit`)
    if (action.attackProfile.damage) {
      const dmgStr = action.attackProfile.damageType
        ? `${action.attackProfile.damage} ${action.attackProfile.damageType}`
        : action.attackProfile.damage
      detailParts.push(dmgStr)
    }
  } else if (action.saveProfile) {
    detailParts.push(`DC ${action.saveProfile.dc} ${action.saveProfile.ability.toUpperCase()} save`)
  }
  if (action.damage && !action.attackProfile) {
    const dmgStr = action.damageType ? `${action.damage} ${action.damageType}` : action.damage
    detailParts.push(dmgStr)
  }

  const usageLabel = action.usage?.recharge
    ? `Recharge ${action.usage.recharge.min}–${action.usage.recharge.max}`
    : action.usage?.uses
      ? `${action.usage.uses.remaining}/${action.usage.uses.max} per ${action.usage.uses.period}`
      : null

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        cursor: onSelect ? 'pointer' : 'default',
        borderColor: isSelected ? 'primary.main' : 'divider',
        
        '&:hover': onSelect ? { bgcolor: 'action.hover' } : undefined,
      }}
      onClick={onSelect}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{action.label}</Typography>
          {detailParts.length > 0 && (
            <Typography variant="caption" color="text.secondary">{detailParts.join(' · ')}</Typography>
          )}
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }} alignItems="center">
          {usageLabel && <AppBadge label={usageLabel} tone="default" variant="outlined" size="small" />}
          <Typography variant="caption" color="text.secondary" noWrap>{costLabel}</Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}

export function CombatantActiveCard({
  title,
  subtitle,
  stats,
  actions,
  bonusActions,
  selectedActionId,
  onSelectAction,
  combatEffects,
  trackedParts,
}: CombatantActiveCardProps) {
  const effectSections = (Object.entries(combatEffects) as [CombatStateSection, EnrichedPresentableEffect[]][])
    .filter(([, effects]) => effects.length > 0)
  const totalEffects = effectSections.reduce((sum, [, effects]) => sum + effects.length, 0)

  return (
    <Paper sx={{ 
      p: 3,
      border: '1px solid',
      borderColor: 'primary.main'
    }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {stats.map((s) => (
            <AppBadge key={s.label} label={`${s.label}: ${s.value}`} tone="default" variant="outlined" size="medium" />
          ))}
          {trackedParts?.map((tp) => (
            <AppBadge
              key={tp.label}
              label={`${tp.label}: ${tp.current}/${tp.initial}`}
              tone={tp.current < tp.initial ? 'warning' : 'default'}
              variant="outlined"
              size="medium"
            />
          ))}
        </Stack>

        <Divider />

        <CollapsibleSection title="Actions" count={actions.length}>
          <Stack spacing={1} sx={{ pt: 0.5 }}>
            {actions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No actions available.</Typography>
            ) : (
              actions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  isSelected={action.id === selectedActionId}
                  onSelect={onSelectAction ? () => onSelectAction(action.id) : undefined}
                />
              ))
            )}
          </Stack>
        </CollapsibleSection>

        <CollapsibleSection title="Bonus Actions" count={bonusActions.length} defaultOpen={bonusActions.length > 0}>
          <Stack spacing={1} sx={{ pt: 0.5 }}>
            {bonusActions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No bonus actions available.</Typography>
            ) : (
              bonusActions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  isSelected={action.id === selectedActionId}
                  onSelect={onSelectAction ? () => onSelectAction(action.id) : undefined}
                />
              ))
            )}
          </Stack>
        </CollapsibleSection>

        <CollapsibleSection title="Combat Effects" count={totalEffects} defaultOpen={totalEffects > 0}>
          <Stack spacing={1} sx={{ pt: 0.5 }}>
            {totalEffects === 0 ? (
              <Typography variant="body2" color="text.secondary">No active combat effects.</Typography>
            ) : (
              effectSections.map(([section, effects]) => (
                <Box key={section}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {SECTION_LABELS[section]}
                  </Typography>
                  <Stack spacing={0.5}>
                    {effects.map((effect) => (
                      <Stack key={effect.id} direction="row" spacing={1} alignItems="center">
                        <AppBadge
                          label={effect.label}
                          tone={effect.presentation.tone === 'neutral' ? 'default' : effect.presentation.tone}
                          size="small"
                        />
                        {effect.duration && (
                          <Typography variant="caption" color="text.secondary">{effect.duration}</Typography>
                        )}
                        {effect.summary && (
                          <Typography variant="caption" color="text.secondary">{effect.summary}</Typography>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </CollapsibleSection>
      </Stack>
    </Paper>
  )
}
