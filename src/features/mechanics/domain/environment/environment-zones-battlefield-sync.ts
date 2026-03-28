/**
 * Derives `EncounterState.environmentZones` rows from `attachedAuraInstances` with
 * {@link AttachedEnvironmentZoneProfile} — world-state projection of gameplay sources, not UI.
 * Call from {@link reconcileBattlefieldEffectAnchors} so anchors and zones stay aligned.
 */

import { resolveBattlefieldEffectOriginCellId } from '../encounter/state/battlefield/battlefield-effect-anchor'
import type { BattlefieldEffectInstance, EncounterState } from '../encounter/state/types/encounter-state.types'

import type {
  AttachedEnvironmentZoneProfile,
  EncounterEnvironmentZone,
} from './environment.types'

/** Deterministic id: one zone per attached-aura instance; upsert replaces by id. */
export function environmentZoneIdForAttachedAuraInstance(instanceId: string): string {
  return `attached-aura-env:${instanceId}`
}

function isAttachedAuraManagedZone(z: EncounterEnvironmentZone): boolean {
  return z.sourceKind === 'attached-aura' && Boolean(z.sourceId)
}

function buildZoneForProfile(
  instance: BattlefieldEffectInstance & { environmentZoneProfile: AttachedEnvironmentZoneProfile },
  originCellId: string,
): EncounterEnvironmentZone {
  if (instance.environmentZoneProfile === 'magical-darkness') {
    return {
      id: environmentZoneIdForAttachedAuraInstance(instance.id),
      kind: 'patch',
      priority: 0,
      sourceKind: 'attached-aura',
      sourceId: instance.id,
      area: { kind: 'sphere-ft', originCellId, radiusFt: instance.area.size },
      overrides: {
        lightingLevel: 'darkness',
        visibilityObscured: 'heavy',
      },
      magical: { magical: true, magicalDarkness: true, blocksDarkvision: true },
    }
  }
  const _exhaustive: never = instance.environmentZoneProfile
  return _exhaustive
}

function zoneProjectionEqual(a: EncounterEnvironmentZone, b: EncounterEnvironmentZone): boolean {
  return (
    a.id === b.id &&
    a.sourceKind === b.sourceKind &&
    a.sourceId === b.sourceId &&
    JSON.stringify(a.area) === JSON.stringify(b.area) &&
    JSON.stringify(a.overrides) === JSON.stringify(b.overrides) &&
    JSON.stringify(a.magical) === JSON.stringify(b.magical)
  )
}

function managedZonesMatch(
  prev: EncounterEnvironmentZone[],
  next: EncounterEnvironmentZone[],
): boolean {
  if (prev.length !== next.length) return false
  const nextById = new Map(next.map((z) => [z.id, z]))
  return prev.every((p) => {
    const n = nextById.get(p.id)
    return n !== undefined && zoneProjectionEqual(p, n)
  })
}

/**
 * Rebuilds **attached-aura–sourced** environment zones from current `attachedAuraInstances`.
 * Preserves zones from other `sourceKind`s (manual, spell, terrain-feature, etc.).
 * Removes managed zones when the instance list no longer carries a matching profile or origin.
 */
export function reconcileEnvironmentZonesFromAttachedAuras(state: EncounterState): EncounterState {
  const existing = state.environmentZones ?? []
  const preserved = existing.filter((z) => !isAttachedAuraManagedZone(z))
  const prevManaged = existing.filter(isAttachedAuraManagedZone)

  const auras = state.attachedAuraInstances ?? []
  const { space, placements } = state

  const generated: EncounterEnvironmentZone[] = []
  for (const aura of auras) {
    const profile = aura.environmentZoneProfile
    if (!profile) continue
    if (!space || !placements) continue
    const origin = resolveBattlefieldEffectOriginCellId(space, placements, aura.anchor)
    if (origin === undefined) continue
    generated.push(
      buildZoneForProfile(
        { ...aura, environmentZoneProfile: profile },
        origin,
      ),
    )
  }

  if (managedZonesMatch(prevManaged, generated)) {
    return state
  }

  const nextZones = [...preserved, ...generated]
  return {
    ...state,
    environmentZones: nextZones.length > 0 ? nextZones : undefined,
  }
}
