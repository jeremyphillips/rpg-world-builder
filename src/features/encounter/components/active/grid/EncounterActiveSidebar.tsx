import { useState } from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppTabs, AppTab } from '@/ui/patterns'
import type { CombatantInstance, EncounterState } from '@/features/mechanics/domain/encounter'

import { AllyCombatantActivePreviewCard } from '../cards/AllyCombatantActivePreviewCard'
import { OpponentCombatantActivePreviewCard } from '../cards/OpponentCombatantActivePreviewCard'
import { CombatLogPanel } from '../combat-log/CombatLogPanel'

type EncounterActiveSidebarProps = {
  encounterState: EncounterState
  activeCombatantId: string | null
  selectedTargetId: string | null
  onSelectTarget: (combatantId: string) => void
}

const SIDEBAR_WIDTH = 320

export function EncounterActiveSidebar({
  encounterState,
  activeCombatantId,
  selectedTargetId,
  onSelectTarget,
}: EncounterActiveSidebarProps) {
  const [tab, setTab] = useState(0)

  const { roundNumber, turnIndex, initiativeOrder, combatantsById, log } = encounterState
  const turnCount = initiativeOrder.length

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: SIDEBAR_WIDTH,
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 'appBar',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Round {roundNumber}, Turn {turnIndex + 1}/{turnCount}
        </Typography>
      </Box>

      <AppTabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth" sx={{ flexShrink: 0 }}>
        <AppTab label="Initiative Order" />
        <AppTab label="Logs" />
      </AppTabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {tab === 0 && (
          <InitiativeOrderTab
            initiativeOrder={initiativeOrder}
            combatantsById={combatantsById}
            activeCombatantId={activeCombatantId}
            selectedTargetId={selectedTargetId}
            onSelectTarget={onSelectTarget}
          />
        )}
        {tab === 1 && <CombatLogPanel log={log} />}
      </Box>
    </Paper>
  )
}

function InitiativeOrderTab({
  initiativeOrder,
  combatantsById,
  activeCombatantId,
  selectedTargetId,
  onSelectTarget,
}: {
  initiativeOrder: string[]
  combatantsById: Record<string, CombatantInstance>
  activeCombatantId: string | null
  selectedTargetId: string | null
  onSelectTarget: (combatantId: string) => void
}) {
  if (initiativeOrder.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No initiative order yet.
      </Typography>
    )
  }

  return (
    <Stack spacing={1}>
      {initiativeOrder.map((id) => {
        const combatant = combatantsById[id]
        if (!combatant) return null

        const isCurrentTurn = id === activeCombatantId
        const isSelected = id === selectedTargetId

        if (combatant.side === 'party') {
          return (
            <AllyCombatantActivePreviewCard
              key={id}
              combatant={combatant}
              isCurrentTurn={isCurrentTurn}
              isSelected={isSelected}
              onClick={() => onSelectTarget(id)}
            />
          )
        }

        return (
          <OpponentCombatantActivePreviewCard
            key={id}
            combatant={combatant}
            isCurrentTurn={isCurrentTurn}
            isSelected={isSelected}
            onClick={() => onSelectTarget(id)}
          />
        )
      })}
    </Stack>
  )
}
