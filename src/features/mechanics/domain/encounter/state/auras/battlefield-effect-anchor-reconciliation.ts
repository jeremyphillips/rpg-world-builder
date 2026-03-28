import { findGridObstacleById, moveGridObstacleToCell } from '@/features/encounter/space/space.helpers'

import { reconcileEnvironmentZonesFromAttachedAuras } from '@/features/mechanics/domain/environment/environment-zones-battlefield-sync'
import { dropConcentration } from '../effects/concentration-mutations'
import { resolveBattlefieldEffectOriginCellId } from '../battlefield/battlefield-effect-anchor'
import { reconcileStealthAfterMovementOrEnvironmentChange } from '../stealth/stealth-rules'
import type { BattlefieldEffectInstance, EncounterState } from '../types'

/**
 * Shared lifecycle pass for {@link EncounterState.attachedAuraInstances}:
 *
 * - **Valid anchors** — Keeps the row. For **`object`**, refreshes **`snapshotCellId`** when the live
 *   obstacle cell differs (so persisted state matches the grid).
 * - **Invalid anchors** — Removes the row. **Spell**-sourced rows tied to concentration call
 *   {@link dropConcentration} so the caster’s concentration and linked effects end together with the aura.
 *   Other sources are dropped silently (no concentration).
 *
 * **Policy (intentional):** If an anchor can no longer be resolved (creature off the grid, place cell
 * removed, object id gone), the battlefield effect **ends** — we do not leave a stale origin or
 * “suspended” ghost row.
 *
 * Call after mutations that can move or remove anchor targets: placements, obstacles, or turn boundaries.
 *
 * Ends with {@link reconcileStealthAfterMovementOrEnvironmentChange} after zone projection so
 * placement/aura-driven environment changes update hidden state consistently.
 */
export function reconcileBattlefieldEffectAnchors(state: EncounterState): EncounterState {
  const auras = state.attachedAuraInstances
  if (!auras?.length) {
    return reconcileStealthAfterMovementOrEnvironmentChange(reconcileEnvironmentZonesFromAttachedAuras(state))
  }

  const { space, placements } = state
  const kept: BattlefieldEffectInstance[] = []
  const removed: BattlefieldEffectInstance[] = []

  for (const aura of auras) {
    const origin = resolveBattlefieldEffectOriginCellId(space, placements, aura.anchor)
    if (origin === undefined) {
      removed.push(aura)
      continue
    }

    if (aura.anchor.kind === 'object' && space) {
      const live = findGridObstacleById(space, aura.anchor.objectId)
      if (live && aura.anchor.snapshotCellId !== live.cellId) {
        kept.push({
          ...aura,
          anchor: { kind: 'object', objectId: aura.anchor.objectId, snapshotCellId: live.cellId },
        })
        continue
      }
    }

    kept.push(aura)
  }

  const unchanged =
    removed.length === 0 &&
    kept.length === auras.length &&
    kept.every((k, i) => k === auras[i])
  if (unchanged) {
    return reconcileStealthAfterMovementOrEnvironmentChange(reconcileEnvironmentZonesFromAttachedAuras(state))
  }

  let next: EncounterState = {
    ...state,
    attachedAuraInstances: kept.length > 0 ? kept : undefined,
  }

  const spellConcentrationDropped = new Set<string>()
  for (const r of removed) {
    if (r.source.kind !== 'spell') continue
    if (spellConcentrationDropped.has(r.casterCombatantId)) continue

    const caster = next.combatantsById[r.casterCombatantId]
    if (caster?.concentration?.spellId !== r.source.spellId) continue

    spellConcentrationDropped.add(r.casterCombatantId)
    next = dropConcentration(next, r.casterCombatantId)
  }

  return reconcileStealthAfterMovementOrEnvironmentChange(reconcileEnvironmentZonesFromAttachedAuras(next))
}

/**
 * Apply a grid obstacle move and run {@link reconcileBattlefieldEffectAnchors} so object-anchored
 * effects follow the obstacle (and invalid anchors are cleaned up).
 */
export function moveGridObstacleInEncounterState(
  state: EncounterState,
  obstacleId: string,
  cellId: string,
): EncounterState {
  if (!state.space) return state
  const nextSpace = moveGridObstacleToCell(state.space, obstacleId, cellId)
  if (!nextSpace) return state
  return reconcileBattlefieldEffectAnchors({ ...state, space: nextSpace })
}
