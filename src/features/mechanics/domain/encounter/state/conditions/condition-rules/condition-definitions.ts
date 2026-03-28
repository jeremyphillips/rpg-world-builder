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
    id: 'blinded',
    label: 'Blinded',
    consequences: [
      { kind: 'visibility', cannotSee: true },
      ...outgoingAttackDisadvantage(),
      ...incomingAttackAdvantage(),
    ],
  },

  charmed: {
    id: 'charmed',
    label: 'Charmed',
    consequences: [
      { kind: 'source_relative', cannotAttackSource: true },
    ],
  },

  deafened: {
    id: 'deafened',
    label: 'Deafened',
    consequences: [],
  },

  frightened: {
    id: 'frightened',
    label: 'Frightened',
    consequences: [
      { kind: 'source_relative', cannotMoveCloserToSource: true, whileSourceInSight: true },
      ...outgoingAttackDisadvantage(),
      { kind: 'check_mod', abilities: 'all', modifier: 'disadvantage' },
    ],
  },

  grappled: {
    id: 'grappled',
    label: 'Grappled',
    consequences: [
      ...immobile(),
    ],
  },

  incapacitated: {
    id: 'incapacitated',
    label: 'Incapacitated',
    consequences: [
      ...cannotAct(),
    ],
  },

  invisible: {
    id: 'invisible',
    label: 'Invisible',
    consequences: [
      { kind: 'visibility', unseenByDefault: true },
      ...incomingAttackDisadvantage(),
      ...outgoingAttackAdvantage(),
    ],
  },

  paralyzed: {
    id: 'paralyzed',
    label: 'Paralyzed',
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
    id: 'petrified',
    label: 'Petrified',
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
    id: 'poisoned',
    label: 'Poisoned',
    consequences: [
      ...outgoingAttackDisadvantage(),
      { kind: 'check_mod', abilities: 'all', modifier: 'disadvantage' },
    ],
  },

  prone: {
    id: 'prone',
    label: 'Prone',
    consequences: [
      { kind: 'movement', standUpCostsHalfMovement: true },
      ...outgoingAttackDisadvantage(),
      ...incomingAttackAdvantage('melee'),
      { kind: 'attack_mod', appliesTo: 'incoming', modifier: 'disadvantage', range: 'ranged' },
    ],
  },

  restrained: {
    id: 'restrained',
    label: 'Restrained',
    consequences: [
      ...immobile(),
      ...outgoingAttackDisadvantage(),
      ...incomingAttackAdvantage(),
      { kind: 'save_mod', appliesTo: 'self', abilities: ['dexterity'], modifier: 'disadvantage' },
    ],
  },

  stunned: {
    id: 'stunned',
    label: 'Stunned',
    consequences: [
      ...cannotAct(),
      ...immobile(),
      ...cannotSpeak(),
      ...autoFailStrDexSaves(),
      ...incomingAttackAdvantage(),
    ],
  },

  unconscious: {
    id: 'unconscious',
    label: 'Unconscious',
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

