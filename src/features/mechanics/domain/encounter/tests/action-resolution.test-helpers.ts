import type { CombatActionDefinition } from '../resolution'
import type { CombatantInstance } from '../state'
import type {
  CombatantRemainsKind,
  CombatantSensesSnapshot,
  CombatantStealthRuntime,
} from '../state/types/combatant.types'

export function createCombatant(args: {
  instanceId: string
  label: string
  side: 'party' | 'enemies'
  initiativeModifier: number
  dexterityScore: number
  armorClass: number
  maxHitPoints?: number
  currentHitPoints?: number
  creatureType?: string
  remains?: CombatantRemainsKind
  diedAtRound?: number
  abilityScores?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
  savingThrowModifiers?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
  actions?: CombatActionDefinition[]
  conditions?: Array<{ label: string }>
  states?: Array<{ label: string }>
  equipment?: { armorEquipped?: string | null }
  passivePerception?: number
  stealth?: CombatantStealthRuntime
  senses?: CombatantSensesSnapshot
}): CombatantInstance {
  return {
    instanceId: args.instanceId,
    side: args.side,
    source: {
      kind: args.side === 'party' ? 'pc' : 'monster',
      sourceId: args.instanceId,
      label: args.label,
    },
    ...(args.creatureType !== undefined ? { creatureType: args.creatureType } : {}),
    ...(args.remains !== undefined ? { remains: args.remains } : {}),
    ...(args.diedAtRound !== undefined ? { diedAtRound: args.diedAtRound } : {}),
    ...(args.equipment !== undefined ? { equipment: args.equipment } : {}),
    ...(args.stealth !== undefined ? { stealth: args.stealth } : {}),
    ...(args.senses !== undefined ? { senses: args.senses } : {}),
    stats: {
      armorClass: args.armorClass,
      maxHitPoints: args.maxHitPoints ?? 12,
      currentHitPoints: args.currentHitPoints ?? args.maxHitPoints ?? 12,
      initiativeModifier: args.initiativeModifier,
      dexterityScore: args.dexterityScore,
      abilityScores: {
        strength: 10,
        dexterity: args.dexterityScore,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ...args.abilityScores,
      },
      savingThrowModifiers: args.savingThrowModifiers,
      speeds: { ground: 30 },
      ...(args.passivePerception != null ? { passivePerception: args.passivePerception } : {}),
    },
    attacks: [],
    actions: args.actions ?? [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: (args.conditions ?? []).map((c, i) => ({
      id: `test-c-${args.instanceId}-${i}`,
      label: c.label,
    })),
    states: (args.states ?? []).map((s, i) => ({
      id: `test-s-${args.instanceId}-${i}`,
      label: s.label,
    })),
  }
}
