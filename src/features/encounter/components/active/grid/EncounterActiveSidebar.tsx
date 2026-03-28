import { useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppTabs, AppTab } from '@/ui/patterns'
import {
  ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR,
  ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX,
} from '@/ui/primitives'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { CombatantPortraitEntry } from '@/features/encounter/helpers/resolveCombatantAvatarSrc'
import type { CombatantInstance, EncounterState } from '@/features/mechanics/domain/encounter'
import { isDefeatedCombatant } from '@/features/mechanics/domain/encounter/state/combatants/combatant-participation'

import { AllyCombatantActivePreviewCard } from '../cards/AllyCombatantActivePreviewCard'
import { OpponentCombatantActivePreviewCard } from '../cards/OpponentCombatantActivePreviewCard'
import { CombatLogPanel } from '../combat-log/CombatLogPanel'

type EncounterActiveSidebarProps = {
  encounterState: EncounterState
  monstersById: Record<string, Monster>
  characterPortraitById: Record<string, CombatantPortraitEntry>
  activeCombatantId: string | null
  selectedTargetId: string | null
  onSelectTarget: (combatantId: string) => void
  spellsById?: Record<string, Spell>
  suppressSameSideHostile?: boolean
}

const SIDEBAR_WIDTH = 320

export function EncounterActiveSidebar({
  encounterState,
  monstersById,
  characterPortraitById,
  activeCombatantId,
  selectedTargetId,
  onSelectTarget,
  spellsById,
  suppressSameSideHostile,
}: EncounterActiveSidebarProps) {
  const [tab, setTab] = useState(0)

  const { roundNumber, turnIndex, initiativeOrder, combatantsById, log } = encounterState
  const turnCount = initiativeOrder.length

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        right: (theme) => theme.spacing(2),
        top: (theme) =>
          `calc(var(${ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR}, ${ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX}px) + ${theme.spacing(2)})`,
        width: SIDEBAR_WIDTH,
        maxHeight: (theme) =>
          `calc(100vh - var(${ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR}, ${ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX}px) - ${theme.spacing(2)} - ${theme.spacing(2)})`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: (theme) => theme.zIndex.appBar,
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
            encounterState={encounterState}
            initiativeOrder={initiativeOrder}
            combatantsById={combatantsById}
            monstersById={monstersById}
            characterPortraitById={characterPortraitById}
            activeCombatantId={activeCombatantId}
            selectedTargetId={selectedTargetId}
            onSelectTarget={onSelectTarget}
            spellsById={spellsById}
            suppressSameSideHostile={suppressSameSideHostile}
          />
        )}
        {tab === 1 && <CombatLogPanel log={log} />}
      </Box>
    </Paper>
  )
}

function InitiativeOrderTab({
  encounterState,
  initiativeOrder,
  combatantsById,
  monstersById,
  characterPortraitById,
  activeCombatantId,
  selectedTargetId,
  onSelectTarget,
  spellsById,
  suppressSameSideHostile,
}: {
  encounterState: EncounterState
  initiativeOrder: string[]
  combatantsById: Record<string, CombatantInstance>
  monstersById: Record<string, Monster>
  characterPortraitById: Record<string, CombatantPortraitEntry>
  activeCombatantId: string | null
  selectedTargetId: string | null
  onSelectTarget: (combatantId: string) => void
  spellsById?: Record<string, Spell>
  suppressSameSideHostile?: boolean
}) {
  const allCombatants = useMemo(() => Object.values(combatantsById), [combatantsById])

  const spatialPresentation = useMemo(
    () =>
      spellsById
        ? {
            encounterState,
            battlefieldSpell: {
              spellLookup: (id: string) => spellsById[id],
              suppressSameSideHostile,
            },
          }
        : undefined,
    [encounterState, spellsById, suppressSameSideHostile],
  )

  const { activeIds, defeatedIds } = useMemo(() => {
    const active: string[] = []
    const defeated: string[] = []
    const seen = new Set<string>()

    for (const id of initiativeOrder) {
      const combatant = combatantsById[id]
      if (!combatant) continue
      seen.add(id)
      if (isDefeatedCombatant(combatant)) defeated.push(id)
      else active.push(id)
    }

    for (const id of Object.keys(combatantsById).sort()) {
      if (seen.has(id)) continue
      const combatant = combatantsById[id]
      if (combatant && isDefeatedCombatant(combatant)) defeated.push(id)
    }

    return { activeIds: active, defeatedIds: defeated }
  }, [initiativeOrder, combatantsById])

  if (initiativeOrder.length === 0 && activeIds.length === 0 && defeatedIds.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No initiative order yet.
      </Typography>
    )
  }

  const renderCard = (id: string) => {
    const combatant = combatantsById[id]
    if (!combatant) return null

    const isCurrentTurn = id === activeCombatantId
    const isSelected = id === selectedTargetId

    if (combatant.side === 'party') {
      return (
        <AllyCombatantActivePreviewCard
          key={id}
          combatant={combatant}
          monstersById={monstersById}
          characterPortraitById={characterPortraitById}
          allCombatants={allCombatants}
          isCurrentTurn={isCurrentTurn}
          isSelected={isSelected}
          spatialPresentation={spatialPresentation}
          onClick={() => onSelectTarget(id)}
        />
      )
    }

    return (
      <OpponentCombatantActivePreviewCard
        key={id}
        combatant={combatant}
        monstersById={monstersById}
        characterPortraitById={characterPortraitById}
        allCombatants={allCombatants}
        isCurrentTurn={isCurrentTurn}
        isSelected={isSelected}
        spatialPresentation={spatialPresentation}
        onClick={() => onSelectTarget(id)}
      />
    )
  }

  return (
    <Stack spacing={1}>
      {activeIds.map((id) => renderCard(id))}

      {defeatedIds.length > 0 && (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              pt: activeIds.length > 0 ? 1.5 : 0,
              pb: 0.5,
              letterSpacing: '0.08em',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            DEFEATED
          </Typography>
          {defeatedIds.map((id) => renderCard(id))}
        </>
      )}
    </Stack>
  )
}
