import { useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import type { CombatantInstance } from '@/features/mechanics/domain/combat'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/combat/state'
import { SelectEntityModal, type SelectEntityOption } from '@/ui/patterns'

type AttachedEmanationSetupPanelProps = {
  actionLabel: string
  activeCombatantId: string
  allCombatants: readonly CombatantInstance[]
  combatantOptions: SelectEntityOption[]
  unaffectedCombatantIds: string[]
  onUnaffectedChange: (ids: string[]) => void
  suppressSameSideHostile: boolean
  partyCombatantIds: string[]
}

export function AttachedEmanationSetupPanel({
  actionLabel,
  activeCombatantId,
  allCombatants,
  combatantOptions,
  unaffectedCombatantIds,
  onUnaffectedChange,
  suppressSameSideHostile,
  partyCombatantIds,
}: AttachedEmanationSetupPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const labelById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of allCombatants) {
      m.set(c.instanceId, getCombatantDisplayLabel(c, [...allCombatants]))
    }
    return m
  }, [allCombatants])

  const addAllAllies = () => {
    const allyIds = partyCombatantIds.filter((id) => id !== activeCombatantId)
    const next = new Set([...unaffectedCombatantIds, ...allyIds])
    onUnaffectedChange([...next])
  }

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Unaffected creatures ({actionLabel})
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Choose allies and enemies that ignore this emanation. The aura follows you on the grid after you cast.
      </Typography>
      {suppressSameSideHostile && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Same-side creatures are automatically unaffected by campaign rules.
        </Typography>
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Button size="small" variant="outlined" onClick={() => setModalOpen(true)}>
          Add unaffected
        </Button>
        {!suppressSameSideHostile && (
          <Button size="small" variant="text" onClick={addAllAllies}>
            Add all allies
          </Button>
        )}
      </Stack>
      {unaffectedCombatantIds.length > 0 ? (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {unaffectedCombatantIds.map((id) => (
            <Chip
              key={id}
              size="small"
              label={labelById.get(id) ?? id}
              onDelete={() => onUnaffectedChange(unaffectedCombatantIds.filter((x) => x !== id))}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary">
          None selected (only campaign defaults apply when enabled).
        </Typography>
      )}
      <SelectEntityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        headline="Select unaffected creatures"
        options={combatantOptions}
        selectedIds={unaffectedCombatantIds}
        onApply={onUnaffectedChange}
        footerNote={`${unaffectedCombatantIds.length} selected`}
      />
    </Box>
  )
}
