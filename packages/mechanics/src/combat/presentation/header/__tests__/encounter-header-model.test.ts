import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'
import { createCombatTurnResources } from '@/features/mechanics/domain/combat/state/types/combatant.types'

import {
  deriveEncounterHeaderModel,
  type EncounterHeaderDisplayArgs,
  type EncounterHeaderViewerPolicy,
} from '../encounter-header-model'

const baseTurn = createCombatTurnResources(30)

/** Simulator / full-control actor (matches session hook when mode is simulator). */
const actorDm: EncounterHeaderViewerPolicy = { viewerMayActOnTurn: true, tonePerspective: 'dm' }

/** Session player controlling their own combatant. */
const actorSelf: EncounterHeaderViewerPolicy = { viewerMayActOnTurn: true, tonePerspective: 'self' }

function action(id: string, overrides: Partial<CombatActionDefinition> = {}): CombatActionDefinition {
  return {
    id,
    label: id,
    kind: 'weapon-attack',
    cost: { action: true },
    targeting: { kind: 'single-target', rangeFt: 5 },
    resolutionMode: 'attack-roll',
    ...overrides,
  } as CombatActionDefinition
}

function display(overrides: Partial<EncounterHeaderDisplayArgs> = {}): EncounterHeaderDisplayArgs {
  return {
    selectedActionLabel: null,
    selectedTargetLabel: null,
    activeCombatantDisplayLabel: 'Hero',
    ...overrides,
  }
}

describe('deriveEncounterHeaderModel', () => {
  it('idle: no target and no action → choose target or action (actor)', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: ['strike'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display(),
      viewer: actorDm,
    })
    expect(m.directive).toBe('Choose a target or an action')
  })

  it('session controlling player (self) sees same actor copy as simulator on idle selection', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: ['strike'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display({ activeCombatantDisplayLabel: 'Aria' }),
      viewer: actorSelf,
    })
    expect(m.directive).toBe('Choose a target or an action')
  })

  it('session non-controller sees observer-safe copy on idle selection', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: ['strike'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display({ activeCombatantDisplayLabel: 'Alice' }),
      viewer: { viewerMayActOnTurn: false, tonePerspective: 'observer' },
    })
    expect(m.directive).toBe("Watching Alice's turn")
    expect(m.directive).not.toMatch(/Choose/i)
  })

  it('session DM observing another combatant turn does not see actor-imperative copy on idle selection', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: ['strike'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display({ activeCombatantDisplayLabel: 'Alice' }),
      viewer: { viewerMayActOnTurn: false, tonePerspective: 'dm' },
    })
    expect(m.directive).toBe('Active turn — Alice')
    expect(m.directive).not.toMatch(/Choose/i)
  })

  it('target only → choose action (actor)', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: ['strike'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display({ selectedTargetLabel: 'Goblin' }),
      viewer: actorDm,
    })
    expect(m.directive).toBe('Choose an action — targeting Goblin')
  })

  it('action + target + can resolve → ready line (actor)', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike', { label: 'Longsword' })],
        availableActionIds: ['strike'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: 'strike',
        selectedAction: action('strike', { label: 'Longsword' }),
        aoeStep: 'none',
        canResolveAction: true,
      },
      display: display({
        selectedActionLabel: 'Longsword',
        selectedTargetLabel: 'Goblin',
      }),
      viewer: actorDm,
    })
    expect(m.directive).toContain('Ready')
    expect(m.directive).toContain('Longsword')
    expect(m.directive).toContain('Goblin')
  })

  it('AoE placing → select a point (actor)', () => {
    const fireball = action('fb', {
      label: 'Fireball',
      cost: { action: true },
      targeting: { kind: 'all-enemies', rangeFt: 150 },
      areaTemplate: { kind: 'sphere', radiusFt: 20 },
    })
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [fireball],
        availableActionIds: ['fb'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'aoe-place',
        selectedActionId: 'fb',
        selectedAction: fireball,
        aoeStep: 'placing',
        canResolveAction: false,
      },
      display: display({ selectedActionLabel: 'Fireball' }),
      viewer: actorDm,
    })
    expect(m.directive).toBe('Select a point for Fireball')
  })

  it('turn exhausted → strong end turn copy (actor)', () => {
    const spent = {
      ...baseTurn,
      actionAvailable: false,
      bonusActionAvailable: false,
      movementRemaining: 0,
    }
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: [],
        turnResources: spent,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display(),
      viewer: actorDm,
    })
    expect(m.directive).toContain('Turn complete')
    expect(m.endTurnEmphasis).toBe('strong')
  })

  it('move mode → movement line (actor)', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: ['strike'],
        turnResources: { ...baseTurn, movementRemaining: 15 },
      },
      interaction: {
        interactionMode: 'move',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display(),
      viewer: actorDm,
    })
    expect(m.directive).toContain('Move on the grid')
    expect(m.directive).toContain('15')
  })

  it('move mode → observer sees non-imperative status', () => {
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [action('strike')],
        availableActionIds: ['strike'],
        turnResources: { ...baseTurn, movementRemaining: 15 },
      },
      interaction: {
        interactionMode: 'move',
        selectedActionId: '',
        selectedAction: null,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display({ activeCombatantDisplayLabel: 'Bob' }),
      viewer: { viewerMayActOnTurn: false, tonePerspective: 'observer' },
    })
    expect(m.directive).toBe('Bob — 15 ft of movement remaining')
    expect(m.directive).not.toMatch(/Move on the grid/i)
  })

  it('summon-style action without creature target → finish in panel, not choose target (actor)', () => {
    const summon = action('gi', {
      label: 'Giant Insect',
      kind: 'spell',
      targeting: { kind: 'none' },
      resolutionMode: 'effects',
      effects: [{ kind: 'spawn', count: 1 }],
    })
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [summon],
        availableActionIds: ['gi'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: 'gi',
        selectedAction: summon,
        aoeStep: 'none',
        canResolveAction: false,
        selectedActionRequiresCreatureTarget: false,
      },
      display: display({ selectedActionLabel: 'Giant Insect' }),
      viewer: actorDm,
    })
    expect(m.directive).toContain('Finish')
    expect(m.directive).toContain('Giant Insect')
  })

  it('infers no creature target when selectedActionRequiresCreatureTarget is omitted (spawn / none)', () => {
    const summon = action('gi2', {
      label: 'Giant Insect',
      kind: 'spell',
      targeting: { kind: 'none' },
      resolutionMode: 'effects',
      effects: [{ kind: 'spawn', count: 1 }],
    })
    const m = deriveEncounterHeaderModel({
      turn: {
        combatantActions: [summon],
        availableActionIds: ['gi2'],
        turnResources: baseTurn,
      },
      interaction: {
        interactionMode: 'select-target',
        selectedActionId: 'gi2',
        selectedAction: summon,
        aoeStep: 'none',
        canResolveAction: false,
      },
      display: display({ selectedActionLabel: 'Giant Insect' }),
      viewer: actorDm,
    })
    expect(m.directive).toContain('Finish')
    expect(m.directive).toContain('Giant Insect')
  })
})
