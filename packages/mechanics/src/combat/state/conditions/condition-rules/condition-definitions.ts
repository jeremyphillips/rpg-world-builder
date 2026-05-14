import type { EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'
import type { MarkerRule } from './condition-consequences.types'
import {
  cannotAct,
  immobile,
  autoFailStrDexSaves,
  incomingAttackAdvantage,
  incomingAttackDisadvantage,
  outgoingAttackAdvantage,
  outgoingAttackDisadvantage,
  nearbyMeleeHitsCrit,
  cannotSpeak,
  unawareOfSurroundings,
} from './condition-consequence-helpers'

export const CONDITION_RULES: Record<EffectConditionId, MarkerRule> = {
  blinded: {
    consequences: [
      { kind: 'visibility', cannotSee: true },
      ...outgoingAttackDisadvantage(),
      ...incomingAttackAdvantage(),
    ],
  },

  charmed: {
    consequences: [{ kind: 'source_relative', cannotAttackSource: true }],
  },

  deafened: {
    consequences: [],
  },

  frightened: {
    consequences: [
      { kind: 'source_relative', cannotMoveCloserToSource: true, whileSourceInSight: true },
      ...outgoingAttackDisadvantage(),
      { kind: 'check_mod', abilities: 'all', modifier: 'disadvantage' },
    ],
  },

  grappled: {
    consequences: [...immobile()],
  },

  incapacitated: {
    consequences: [...cannotAct()],
  },

  invisible: {
    consequences: [
      { kind: 'visibility', unseenByDefault: true },
      ...incomingAttackDisadvantage(),
      ...outgoingAttackAdvantage(),
    ],
  },

  paralyzed: {
    consequences: [
      ...cannotAct(),
      ...immobile(),
      ...cannotSpeak(),
      ...autoFailStrDexSaves(),
      ...incomingAttackAdvantage(),
      ...nearbyMeleeHitsCrit(),
    ],
  },

  petrified: {
    consequences: [
      ...cannotAct(),
      ...immobile(),
      ...cannotSpeak(),
      ...unawareOfSurroundings(),
      ...autoFailStrDexSaves(),
      ...incomingAttackAdvantage(),
      { kind: 'damage_interaction', damageType: 'all', modifier: 'resistance' },
    ],
  },

  poisoned: {
    consequences: [
      ...outgoingAttackDisadvantage(),
      { kind: 'check_mod', abilities: 'all', modifier: 'disadvantage' },
    ],
  },

  prone: {
    consequences: [
      { kind: 'movement', standUpCostsHalfMovement: true },
      ...outgoingAttackDisadvantage(),
      ...incomingAttackAdvantage('melee'),
      { kind: 'attack_mod', appliesTo: 'incoming', modifier: 'disadvantage', range: 'ranged' },
    ],
  },

  restrained: {
    consequences: [
      ...immobile(),
      ...outgoingAttackDisadvantage(),
      ...incomingAttackAdvantage(),
      { kind: 'save_mod', appliesTo: 'self', abilities: ['dexterity'], modifier: 'disadvantage' },
    ],
  },

  stunned: {
    consequences: [
      ...cannotAct(),
      ...immobile(),
      ...cannotSpeak(),
      ...autoFailStrDexSaves(),
      ...incomingAttackAdvantage(),
    ],
  },

  unconscious: {
    consequences: [
      ...cannotAct(),
      ...immobile(),
      ...cannotSpeak(),
      ...unawareOfSurroundings(),
      ...autoFailStrDexSaves(),
      ...incomingAttackAdvantage(),
      ...nearbyMeleeHitsCrit(),
    ],
  },
}
