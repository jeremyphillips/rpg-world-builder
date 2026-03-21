export interface InitiativeParticipant {
  instanceId: string
  label: string
  initiativeModifier: number
  dexterityScore?: number
}

export interface InitiativeRoll {
  combatantId: string
  label: string
  roll: number
  modifier: number
  total: number
  dexterityScore?: number
}

export interface InitiativeResolverOptions {
  rng?: () => number
}

import { rollDie } from '../engines/dice.engine'

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
      const roll = rollDie(20, rng)
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

/** Stable sort for merging existing encounter initiative with new rolls. */
export function sortInitiativeRolls(rolls: InitiativeRoll[]): InitiativeRoll[] {
  return [...rolls].sort(compareInitiative)
}
