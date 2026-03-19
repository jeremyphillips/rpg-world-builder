import { useMemo, useState } from 'react'

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
import type { CombatActionDefinition, CombatActionKind } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { EnrichedPresentableEffect, CombatStateSection } from '../domain'
import { ActionRow } from './ActionRow'

type StatEntry = { label: string; value: string }

type CombatantActiveCardProps = {
  title: string
  subtitle?: string
  stats: StatEntry[]
  actions: CombatActionDefinition[]
  bonusActions: CombatActionDefinition[]
  availableActionIds?: Set<string>
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

const ACTION_KIND_ORDER: CombatActionKind[] = ['weapon-attack', 'monster-action', 'spell', 'combat-effect']

const ACTION_KIND_LABELS: Partial<Record<CombatActionKind, string>> = {
  'weapon-attack': 'Weapons',
  'monster-action': 'Natural',
  'spell': 'Spells',
  'combat-effect': 'Effects',
}

function groupActionsByKind(actions: CombatActionDefinition[]) {
  const groups = new Map<CombatActionKind, CombatActionDefinition[]>()
  for (const action of actions) {
    const list = groups.get(action.kind)
    if (list) list.push(action)
    else groups.set(action.kind, [action])
  }
  return ACTION_KIND_ORDER
    .filter((kind) => groups.has(kind))
    .map((kind) => ({ kind, label: ACTION_KIND_LABELS[kind] ?? kind, actions: groups.get(kind)! }))
}

function GroupedActionList({
  actions,
  availableActionIds,
  selectedActionId,
  onSelectAction,
}: {
  actions: CombatActionDefinition[]
  availableActionIds?: Set<string>
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
}) {
  const groups = useMemo(() => groupActionsByKind(actions), [actions])
  const needsHeaders = groups.length > 1
  const allTreatAsAvailable = availableActionIds == null

  return (
    <Stack spacing={1} sx={{ pt: 0.5 }}>
      {actions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No actions available.</Typography>
      ) : (
        groups.map(({ kind, label, actions: groupActions }) => (
          <Box key={kind}>
            {needsHeaders && (
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {label}
              </Typography>
            )}
            <Stack spacing={1}>
              {groupActions.map((action) => {
                const isAvailable = allTreatAsAvailable || availableActionIds!.has(action.id)
                return (
                  <ActionRow
                    key={action.id}
                    action={action}
                    isSelected={action.id === selectedActionId}
                    isAvailable={isAvailable}
                    onSelect={
                      onSelectAction && isAvailable ? () => onSelectAction(action.id) : undefined
                    }
                  />
                )
              })}
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  )
}

export function CombatantActiveCard({
  title,
  subtitle,
  stats,
  actions,
  bonusActions,
  availableActionIds,
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
          <GroupedActionList
            actions={actions}
            availableActionIds={availableActionIds}
            selectedActionId={selectedActionId}
            onSelectAction={onSelectAction}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Bonus Actions" count={bonusActions.length} defaultOpen={bonusActions.length > 0}>
          <GroupedActionList
            actions={bonusActions}
            availableActionIds={availableActionIds}
            selectedActionId={selectedActionId}
            onSelectAction={onSelectAction}
          />
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
