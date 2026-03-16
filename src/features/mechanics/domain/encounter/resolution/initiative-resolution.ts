import type { InitiativeParticipant, InitiativeResolverOptions } from './initiative-resolution.types'
import type { InitiativeRoll } from './initiative-resolution.types'

export type { InitiativeParticipant, InitiativeRoll, InitiativeResolverOptions } from './initiative-resolution.types'

function rollD20(rng: () => number): number {
  return Math.floor(rng() * 20) + 1
}

function compareInitiative(a: InitiativeRoll, b: InitiativeRoll): number {
  if (b.total !== a.total) return b.total - a.total
  if (b.modifier !== a.modifier) return b.modifier - a.modifier
  if ((b.dexterityScore ?? -Infinity) !== (a.dexterityScore ?? -Infinity)) {
    return (b.dexterityScore ?? -Infinity) - (a.dexterityScore ?? -Infinity)
  }

  const labelCompare = a.label.localeCompare(b.label)
  if (labelCompare !== 0) return labelCompare

  return a.combatantId.localeCompare(b.combatantId)
}

export function rollInitiative(
  participants: InitiativeParticipant[],
  options: InitiativeResolverOptions = {},
): InitiativeRoll[] {
  const rng = options.rng ?? Math.random

  return participants
    .map((participant) => {
      const roll = rollD20(rng)
      return {
        combatantId: participant.instanceId,
        label: participant.label,
        roll,
        modifier: participant.initiativeModifier,
        total: roll + participant.initiativeModifier,
        dexterityScore: participant.dexterityScore,
      }
    })
    .sort(compareInitiative)
}
