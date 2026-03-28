import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { createCombatTurnResources } from '@/features/mechanics/domain/encounter/state/types/combatant.types'

import { deriveEncounterHeaderModel } from '../../header/encounter-header-model'

const baseTurn = createCombatTurnResources(30)

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

describe('deriveEncounterHeaderModel', () => {
  it('idle: no target and no action → choose target or action', () => {
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
      display: {
        selectedActionLabel: null,
        selectedTargetLabel: null,
      },
    })
    expect(m.directive).toBe('Choose a target or an action')
  })

  it('target only → choose action', () => {
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
      display: {
        selectedActionLabel: null,
        selectedTargetLabel: 'Goblin',
      },
    })
    expect(m.directive).toBe('Choose an action — targeting Goblin')
  })

  it('action + target + can resolve → ready line', () => {
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
      display: {
        selectedActionLabel: 'Longsword',
        selectedTargetLabel: 'Goblin',
      },
    })
    expect(m.directive).toContain('Ready')
    expect(m.directive).toContain('Longsword')
    expect(m.directive).toContain('Goblin')
  })

  it('AoE placing → select a point', () => {
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
      display: {
        selectedActionLabel: 'Fireball',
        selectedTargetLabel: null,
      },
    })
    expect(m.directive).toBe('Select a point for Fireball')
  })

  it('turn exhausted → strong end turn copy', () => {
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
      display: {
        selectedActionLabel: null,
        selectedTargetLabel: null,
      },
    })
    expect(m.directive).toContain('Turn complete')
    expect(m.endTurnEmphasis).toBe('strong')
  })

  it('move mode → movement line', () => {
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
      display: {
        selectedActionLabel: null,
        selectedTargetLabel: null,
      },
    })
    expect(m.directive).toContain('Move on the grid')
    expect(m.directive).toContain('15')
  })

  it('summon-style action without creature target → finish in panel, not choose target', () => {
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
      display: {
        selectedActionLabel: 'Giant Insect',
        selectedTargetLabel: null,
      },
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
      display: {
        selectedActionLabel: 'Giant Insect',
        selectedTargetLabel: null,
      },
    })
    expect(m.directive).toContain('Finish')
    expect(m.directive).toContain('Giant Insect')
  })
})
