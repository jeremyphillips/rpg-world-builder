import { useEffect, useMemo, useState, type ReactNode } from 'react'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import StairsIcon from '@mui/icons-material/Stairs'

import type { CombatIntent } from '@/features/mechanics/domain/combat'
import { getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers'
import { STAIR_TRAVERSAL_MOVEMENT_COST_FT } from '@/shared/domain/locations/transitions/stairTraversal.constants'

import { EncounterContextPrompt } from '../components'
import type { EncounterContextPromptEnvironment } from '../domain/encounterContextPrompt.types'
import { resolveAdjacentClosedDoorPrompt } from '../combat/resolveEncounterAdjacentDoorPrompt'
import { resolveEncounterStairTraversalPayload } from '../combat/resolveEncounterStairTraversalPayload'

export type UseEncounterContextPromptArgs = {
  env: EncounterContextPromptEnvironment | null | undefined
  /** Session seat; simulator typically uses `dm`. Observers should not see movement affordances. */
  viewerRole: 'dm' | 'player' | 'observer' | null
  capabilities: { canMoveActiveCombatant?: boolean } | null | undefined
  activeCombatantMovementRemainingFt: number
  handleStairTraversal: ((intent: Extract<CombatIntent, { kind: 'stair-traversal' }>) => void) | undefined
  handleOpenDoor?: (intent: Extract<CombatIntent, { kind: 'open-door' }>) => void
}

/**
 * Resolves contextual under-header prompts (stairs first; door; future: portals, objectives, …).
 *
 * **Temporary precedence:** when stair traversal and an adjacent door are both available, the stairs
 * strip is shown. Revisit when multi-action strips exist.
 */
export function useEncounterContextPromptStrip({
  env,
  viewerRole,
  capabilities,
  activeCombatantMovementRemainingFt,
  handleStairTraversal,
  handleOpenDoor,
}: UseEncounterContextPromptArgs): ReactNode | null {
  const [stairPayload, setStairPayload] = useState<
    Awaited<ReturnType<typeof resolveEncounterStairTraversalPayload>> | null
  >(null)

  const activeCombatantCellId = useMemo(() => {
    const es = env?.encounterState
    if (!es?.space || !es.activeCombatantId || !es.placements?.length) return null
    return getCellForCombatant(es.placements, es.activeCombatantId, es.space)
  }, [env?.encounterState?.placements, env?.encounterState?.space, env?.encounterState?.activeCombatantId])

  useEffect(() => {
    let cancelled = false
    const campaignId = env?.campaignId
    if (!campaignId || !env?.encounterState || !env?.locations?.length) {
      setStairPayload(null)
      return
    }
    void resolveEncounterStairTraversalPayload({
      campaignId,
      locations: env.locations,
      locationContext: env.locationContext,
      encounterState: env.encounterState,
    }).then((r) => {
      if (!cancelled) setStairPayload(r)
    })
    return () => {
      cancelled = true
    }
  }, [
    env?.campaignId,
    env?.locations,
    env?.locationContext?.buildingId,
    env?.locationContext?.locationId,
    env?.locationContext?.floorId,
    env?.encounterState,
    env?.encounterState?.activeCombatantId,
    activeCombatantCellId,
  ])

  return useMemo(() => {
    if (viewerRole === 'observer') return null

    const controlsActive = Boolean(capabilities?.canMoveActiveCombatant)
    const activeId = env?.encounterState?.activeCombatantId ?? null

    // stairs-first (temporary): only show door when stairs traversal is not available.
    if (stairPayload?.ok && handleStairTraversal) {
      const canAfford = activeCombatantMovementRemainingFt >= STAIR_TRAVERSAL_MOVEMENT_COST_FT
      const canUse = controlsActive && canAfford
      return (
        <EncounterContextPrompt
          title="Use stairs"
          subtitle={stairPayload.destinationFloorLabel}
          icon={<StairsIcon fontSize="small" color="action" aria-hidden />}
          primaryAction={{
            label: 'Go',
            onClick: () => handleStairTraversal(stairPayload.intent),
          }}
          disabled={!canUse}
          unavailableReason={
            canUse
              ? null
              : !controlsActive
                ? viewerRole === 'dm'
                  ? 'Only the controlling player can move this combatant.'
                  : 'You cannot control this combatant right now.'
                : `Need at least ${STAIR_TRAVERSAL_MOVEMENT_COST_FT} ft of movement remaining to use stairs.`
          }
        />
      )
    }

    const door = resolveAdjacentClosedDoorPrompt(env?.encounterState ?? null, activeId)
    if (door && handleOpenDoor && activeId) {
      const canUse = controlsActive
      return (
        <EncounterContextPrompt
          title="Open door"
          icon={<DoorFrontIcon fontSize="small" color="action" aria-hidden />}
          primaryAction={{
            label: 'Open door',
            onClick: () =>
              handleOpenDoor({
                kind: 'open-door',
                combatantId: activeId,
                cellIdA: door.cellIdA,
                cellIdB: door.cellIdB,
              }),
          }}
          disabled={!canUse}
          unavailableReason={
            canUse
              ? null
              : viewerRole === 'dm'
                ? 'Only the controlling player can move this combatant.'
                : 'You cannot control this combatant right now.'
          }
        />
      )
    }

    return null
  }, [
    stairPayload,
    viewerRole,
    capabilities?.canMoveActiveCombatant,
    activeCombatantMovementRemainingFt,
    handleStairTraversal,
    handleOpenDoor,
    env?.encounterState,
    env?.encounterState?.activeCombatantId,
    activeCombatantCellId,
  ])
}

