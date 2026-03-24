import { useMemo, useState } from 'react'

import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AppModal } from '@/ui/patterns'
import { AppBadge } from '@/ui/primitives'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

type TargetOption = {
  combatantId: string
  label: string
  side: 'party' | 'enemies'
  armorClass: number
  currentHitPoints: number
  maxHitPoints: number
  isDefeated: boolean
}

type CombatTargetSelectModalProps = {
  open: boolean
  onClose: () => void
  targets: TargetOption[]
  selectedTargetId: string
  onSelectTarget: (targetId: string) => void
}

export function CombatTargetSelectModal({
  open,
  onClose,
  targets,
  selectedTargetId,
  onSelectTarget,
}: CombatTargetSelectModalProps) {
  const [filter, setFilter] = useState('')
  const [localSelection, setLocalSelection] = useState(selectedTargetId)

  const filtered = useMemo(() => {
    if (!filter.trim()) return targets
    const lower = filter.toLowerCase()
    return targets.filter((t) => t.label.toLowerCase().includes(lower))
  }, [targets, filter])

  const allies = filtered.filter((t) => t.side === 'party')
  const opponents = filtered.filter((t) => t.side === 'enemies')

  const handleApply = () => {
    onSelectTarget(localSelection)
    onClose()
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      headline="Select Target"
      subheadline="Filter by current initiative order"
      size="standard"
      primaryAction={{ label: 'Apply', onClick: handleApply, disabled: !localSelection }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter combatants…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoFocus
        />

        {allies.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">Allies</Typography>
            {allies.map((t) => (
              <TargetRow
                key={t.combatantId}
                target={t}
                isSelected={t.combatantId === localSelection}
                onClick={() => setLocalSelection(t.combatantId)}
              />
            ))}
          </Stack>
        )}

        {allies.length > 0 && opponents.length > 0 && <Divider />}

        {opponents.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">Opponents</Typography>
            {opponents.map((t) => (
              <TargetRow
                key={t.combatantId}
                target={t}
                isSelected={t.combatantId === localSelection}
                onClick={() => setLocalSelection(t.combatantId)}
              />
            ))}
          </Stack>
        )}

        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary">No combatants match the filter.</Typography>
        )}
      </Stack>
    </AppModal>
  )
}

function TargetRow({
  target,
  isSelected,
  onClick,
}: {
  target: TargetOption
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        borderColor: isSelected ? 'primary.main' : 'divider',
        opacity: target.isDefeated ? 0.5 : 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{target.label}</Typography>
        <Stack direction="row" spacing={0.5}>
          <AppBadge label={`AC ${target.armorClass}`} tone="default" variant="outlined" size="small" />
          <AppBadge
            label={`HP ${target.currentHitPoints}/${target.maxHitPoints}`}
            tone={target.isDefeated ? 'danger' : 'default'}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

export function buildTargetOptions(
  combatantsById: Record<string, CombatantInstance>,
  initiativeOrder: string[],
): TargetOption[] {
  return initiativeOrder
    .map((id) => combatantsById[id])
    .filter(Boolean)
    .map((c) => ({
      combatantId: c.instanceId,
      label: c.source.label,
      side: c.side,
      armorClass: c.stats.armorClass,
      currentHitPoints: c.stats.currentHitPoints,
      maxHitPoints: c.stats.maxHitPoints,
      isDefeated: c.stats.currentHitPoints <= 0,
    }))
}
