import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space/createSquareGridSpace'
import {
  appendStealthMovementRecheckHeaderNote,
  applyStealthHideSuccess,
  breakStealthOnAttack,
  createEncounterState,
  getHideActionUnavailableReason,
  getPassivePerceptionScore,
  getStealthHideAttemptDenialReason,
  isHiddenFromObserver,
  reconcileStealthAfterMovementOrEnvironmentChange,
  reconcileStealthBreakWhenNoConcealmentInCell,
  reconcileStealthHiddenForPerceivedObservers,
  resolveDefaultHideObservers,
  resolveHideWithPassivePerception,
  stealthBeatsPassivePerception,
  STEALTH_DEBUG_REASON,
} from '@/features/mechanics/domain/encounter/state'
import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  testEnemy,
  testPc,
} from './encounter-visibility-test-fixtures'

describe('stealth-rules', () => {
  it('getStealthHideAttemptDenialReason delegates to hide eligibility (heavy obscurement allows attempt)', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    expect(getStealthHideAttemptDenialReason(heavy, 'orc', 'wiz')).toBe(null)
  })

  it('denies hide in bright open when observer perceives occupant', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
    }
    expect(getStealthHideAttemptDenialReason(state, 'orc', 'wiz')).toBe('observer-sees-without-concealment')
  })

  it('getHideActionUnavailableReason is null when hide attempts are allowed (heavy obscurement)', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    expect(getHideActionUnavailableReason(heavy, 'orc')).toBe(null)
  })

  it('getHideActionUnavailableReason explains when no eligible observers (open ground)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
    }
    expect(getHideActionUnavailableReason(state, 'orc')).toBe('Need concealment or cover from observers.')
  })

  it('applyStealthHideSuccess records observer-relative hidden state', () => {
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const ally = testPc('ally', 'Ally', 20)
    const base = createEncounterState([w, o, ally], { rng: () => 0.5 })
    const state = {
      ...base,
      partyCombatantIds: ['wiz', 'ally'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['wiz', 'orc', 'ally'],
    }
    const applied = applyStealthHideSuccess(state, 'orc', ['wiz'])
    expect(applied.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    expect(isHiddenFromObserver(applied, 'wiz', 'orc')).toBe(true)
    expect(isHiddenFromObserver(applied, 'ally', 'orc')).toBe(false)
  })

  it('reconcileStealthHiddenForPerceivedObservers removes observer when they can perceive subject', () => {
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5 })
    let state = {
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['wiz', 'orc'],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    state = { ...state, space, placements: [
      { combatantId: 'wiz', cellId: 'c-0-0' },
      { combatantId: 'orc', cellId: 'c-1-0' },
    ] }
    const logLenBefore = state.log.length
    const pruned = reconcileStealthHiddenForPerceivedObservers(state)
    expect(pruned.combatantsById.orc?.stealth).toBeUndefined()
    expect(pruned.log.length).toBeGreaterThan(logLenBefore)
    const pruneNote = pruned.log.find(
      (e) => e.type === 'note' && e.details?.includes(STEALTH_DEBUG_REASON.observerCanPerceiveTarget),
    )
    expect(pruneNote?.summary).toMatch(/revealed to|pruned/i)
  })

  it('reconcileStealthHiddenForPerceivedObservers does not append a note when hidden state is unchanged', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    const state = {
      ...heavy,
      combatantsById: {
        ...heavy.combatantsById,
        orc: {
          ...heavy.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const logLenBefore = state.log.length
    const next = reconcileStealthHiddenForPerceivedObservers(state)
    expect(next.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    expect(next.log.length).toBe(logLenBefore)
  })

  it('breakStealthOnAttack clears stealth wrapper', () => {
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5 })
    const withStealth = {
      ...base,
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const cleared = breakStealthOnAttack(withStealth, 'orc')
    expect(cleared.combatantsById.orc?.stealth).toBeUndefined()
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell keeps stealth when three-quarters cover remains (baseline)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-cover',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'three-quarters' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const out = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(out.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell does not clear stealth on lost hide basis alone; perception reconcile removes', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const afterBasis = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(afterBasis.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    const pruned = reconcileStealthHiddenForPerceivedObservers(afterBasis)
    expect(pruned.combatantsById.orc?.stealth).toBeUndefined()
    const pruneNote = pruned.log.find((e) => e.details?.includes(STEALTH_DEBUG_REASON.observerCanPerceiveTarget))
    expect(pruneNote?.summary).toMatch(/revealed to|pruned|perceive/i)
  })

  it('resolveHideWithPassivePerception appends hide-success note when beating at least one observer', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    const logLen = heavy.log.length
    const beat = resolveHideWithPassivePerception(heavy, 'orc', 25, {})
    expect(beat.outcome.kind).toBe('resolved')
    if (beat.outcome.kind === 'resolved') {
      expect(beat.outcome.beatenObserverIds.length).toBeGreaterThan(0)
    }
    expect(beat.state.log.length).toBeGreaterThan(logLen)
    const hideNote = beat.state.log.find(
      (e) => e.type === 'note' && e.details?.includes(STEALTH_DEBUG_REASON.hideSuccess),
    )
    expect(hideNote?.summary).toMatch(/hidden from:/i)
  })

  it('appendStealthMovementRecheckHeaderNote records movement-reconcile reason', () => {
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5 })
    const s = { ...base, log: [] as (typeof base)['log'] }
    const next = appendStealthMovementRecheckHeaderNote(s, 'orc', 'c-1-0', 'c-2-0')
    const entry = next.log[next.log.length - 1]
    expect(entry?.details).toContain(STEALTH_DEBUG_REASON.movementReconcile)
    expect(entry?.summary).toContain('c-1-0')
    expect(entry?.summary).toContain('c-2-0')
    expect(entry?.summary).toMatch(/perception/i)
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell does not clear half-cover stealth without persisted hideEligibility; perception reconcile does', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const afterBasis = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(afterBasis.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    const afterPerception = reconcileStealthHiddenForPerceivedObservers(afterBasis)
    expect(afterPerception.combatantsById.orc?.stealth).toBeUndefined()
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell keeps half-cover stealth when hideEligibility was persisted', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: {
            hiddenFromObserverIds: ['wiz'],
            hideEligibility: { featureFlags: { allowHalfCoverForHide: true } },
          },
        },
      },
    }
    const out = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(out.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell does not clear dim-only stealth without persisted allowDimLightHide; perception reconcile does', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-dim',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { lightingLevel: 'dim' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const afterBasis = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(afterBasis.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    const afterPerception = reconcileStealthHiddenForPerceivedObservers(afterBasis)
    expect(afterPerception.combatantsById.orc?.stealth).toBeUndefined()
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell keeps dim stealth when hideEligibility allowDimLightHide was persisted', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-dim',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { lightingLevel: 'dim' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: {
            hiddenFromObserverIds: ['wiz'],
            hideEligibility: { featureFlags: { allowDimLightHide: true } },
          },
        },
      },
    }
    const out = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(out.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell keeps difficult-terrain stealth when allowDifficultTerrainHide was persisted', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-diff',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainMovement: 'difficult' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: {
            hiddenFromObserverIds: ['wiz'],
            hideEligibility: { featureFlags: { allowDifficultTerrainHide: true } },
          },
        },
      },
    }
    const out = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(out.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
  })

  it('resolveHideWithPassivePerception persists hideEligibility so reconcile does not drop half-cover hidden state', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        wiz: {
          ...base.combatantsById.wiz!,
          stats: { ...base.combatantsById.wiz!.stats, passivePerception: 10 },
        },
      },
    }
    const hideOpts = { hideEligibility: { featureFlags: { allowHalfCoverForHide: true } } }
    const beat = resolveHideWithPassivePerception(state, 'orc', 11, hideOpts)
    expect(beat.state.combatantsById.orc?.stealth?.hideEligibility?.featureFlags?.allowHalfCoverForHide).toBe(true)
    const afterReconcile = reconcileStealthBreakWhenNoConcealmentInCell(beat.state, 'orc')
    expect(afterReconcile.combatantsById.orc?.stealth?.hiddenFromObserverIds).toContain('wiz')
  })

  it('resolveHideWithPassivePerception + reconcile use combatant-derived hide flags (skillRuntime)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const orcWithFeat = {
      ...o,
      stats: {
        ...o.stats,
        skillRuntime: { hideEligibilityFeatureFlags: { allowHalfCoverForHide: true } },
      },
    }
    const base = createEncounterState([w, orcWithFeat], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        wiz: {
          ...base.combatantsById.wiz!,
          stats: { ...base.combatantsById.wiz!.stats, passivePerception: 10 },
        },
      },
    }
    const beat = resolveHideWithPassivePerception(state, 'orc', 11)
    expect(beat.state.combatantsById.orc?.stealth?.hideEligibility?.featureFlags?.allowHalfCoverForHide).toBe(true)
    const afterReconcile = reconcileStealthBreakWhenNoConcealmentInCell(beat.state, 'orc')
    expect(afterReconcile.combatantsById.orc?.stealth?.hiddenFromObserverIds).toContain('wiz')
  })

  it('reconcileStealthBreakWhenNoConcealmentInCell does not prune observer-relative hidden state on cover-basis mismatch alone', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const wiz = testPc('wiz', 'Wizard', 20)
    const bard = testPc('bard', 'Bard', 20)
    const orc = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([wiz, bard, orc], { rng: () => 0.5, space })
    const state = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-0' },
        { combatantId: 'bard', cellId: 'c-4-0' },
      ],
      environmentZones: [
        {
          id: 'z-tq',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'three-quarters' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz', 'bard'] },
        },
      },
    }
    const out = reconcileStealthBreakWhenNoConcealmentInCell(state, 'orc')
    expect(out.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz', 'bard'])
  })

  it('lost terrain cover alone does not clear stealth; reconcileStealthHiddenForPerceivedObservers reveals when observer can perceive', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const withHalfCoverZone = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
      environmentZones: [
        {
          id: 'z-half',
          kind: 'patch',
          sourceKind: 'terrain-feature',
          area: { kind: 'grid-cell-ids', cellIds: ['c-1-0'] },
          overrides: { terrainCover: 'half' },
        },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: {
            hiddenFromObserverIds: ['wiz'],
            hideEligibility: { featureFlags: { allowHalfCoverForHide: true } },
          },
        },
      },
    }
    const zonesRemoved = { ...withHalfCoverZone, environmentZones: [] as typeof withHalfCoverZone.environmentZones }
    const afterNoOp = reconcileStealthBreakWhenNoConcealmentInCell(zonesRemoved, 'orc')
    expect(afterNoOp.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    const afterPerception = reconcileStealthHiddenForPerceivedObservers(afterNoOp)
    expect(afterPerception.combatantsById.orc?.stealth).toBeUndefined()
  })

  it('reconcileStealthAfterMovementOrEnvironmentChange appends hide-basis context when still unseen after perception pass', () => {
    const baseSpace = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const space = {
      ...baseSpace,
      cells: baseSpace.cells.map((c) =>
        c.id === 'c-1-0' ? { ...c, kind: 'blocking' as const, blocksSight: true } : c,
      ),
    }
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const state = {
      ...base,
      partyCombatantIds: ['wiz'],
      enemyCombatantIds: ['orc'],
      initiativeOrder: ['wiz', 'orc'],
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-0' },
      ],
      combatantsById: {
        ...base.combatantsById,
        orc: {
          ...base.combatantsById.orc!,
          stealth: { hiddenFromObserverIds: ['wiz'] },
        },
      },
    }
    const next = reconcileStealthAfterMovementOrEnvironmentChange(state)
    expect(next.combatantsById.orc?.stealth?.hiddenFromObserverIds).toEqual(['wiz'])
    const ctx = next.log.find((e) => e.details?.includes(STEALTH_DEBUG_REASON.hideBasisLostContext))
    expect(ctx?.summary).toMatch(/still hidden from|hide basis/i)
  })

  it('resolveDefaultHideObservers lists enemies passing eligibility (non-contested)', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    const ids = resolveDefaultHideObservers(heavy, 'orc')
    expect(ids).toContain('wiz')
  })

  it('resolveHideWithPassivePerception: beats observer when Stealth > passive only', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    const wiz = heavy.combatantsById.wiz!
    const withPp = {
      ...heavy,
      combatantsById: {
        ...heavy.combatantsById,
        wiz: { ...wiz, stats: { ...wiz.stats, passivePerception: 10 } },
      },
    }
    const beat = resolveHideWithPassivePerception(withPp, 'orc', 11)
    expect(beat.outcome.kind).toBe('resolved')
    if (beat.outcome.kind === 'resolved') {
      expect(beat.outcome.beatenObserverIds).toContain('wiz')
      expect(beat.outcome.failedObserverIds).toEqual([])
    }
    expect(beat.state.combatantsById.orc?.stealth?.hiddenFromObserverIds).toContain('wiz')
  })

  it('resolveHideWithPassivePerception: fails when Stealth equals passive (tie)', () => {
    const heavy = encounterAttackerOutsideDefenderHeavilyObscured()
    const wiz = heavy.combatantsById.wiz!
    const withPp = {
      ...heavy,
      combatantsById: {
        ...heavy.combatantsById,
        wiz: { ...wiz, stats: { ...wiz.stats, passivePerception: 10 } },
      },
    }
    const fail = resolveHideWithPassivePerception(withPp, 'orc', 10)
    expect(fail.outcome.kind).toBe('resolved')
    if (fail.outcome.kind === 'resolved') {
      expect(fail.outcome.beatenObserverIds).toEqual([])
      expect(fail.outcome.failedObserverIds).toContain('wiz')
    }
    expect(fail.state.combatantsById.orc?.stealth).toBeUndefined()
  })

  it('getPassivePerceptionScore uses authored stat when set', () => {
    const w = testPc('w', 'Wizard', 20)
    const c = { ...w, stats: { ...w.stats, passivePerception: 14 } }
    expect(getPassivePerceptionScore(c)).toBe(14)
  })

  it('stealthBeatsPassivePerception documents strict greater-than', () => {
    expect(stealthBeatsPassivePerception(11, 10)).toBe(true)
    expect(stealthBeatsPassivePerception(10, 10)).toBe(false)
  })
})
