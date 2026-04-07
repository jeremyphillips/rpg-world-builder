import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'

import { useEncounterRuntimeInteractionMode } from './useEncounterRuntimeInteractionMode'

const noopAction = { id: 'noop' } as unknown as CombatActionDefinition

describe('useEncounterRuntimeInteractionMode', () => {
  it('defaults to select-target', () => {
    const { result } = renderHook(() =>
      useEncounterRuntimeInteractionMode({
        activeCombatantId: 'a',
        aoeStep: 'none',
        selectedAction: null,
        selectedCasterOptions: {},
      }),
    )
    expect(result.current.interactionMode).toBe('select-target')
  })

  it('resets to select-target when active combatant changes', () => {
    const { result, rerender } = renderHook(
      ({ activeId }: { activeId: string | null }) =>
        useEncounterRuntimeInteractionMode({
          activeCombatantId: activeId,
          // Non-`none` so manual `aoe-place` is not cleared by the aoeStep===none effect.
          aoeStep: 'placing',
          selectedAction: noopAction,
          selectedCasterOptions: {},
        }),
      { initialProps: { activeId: 'a' as string | null } },
    )

    act(() => {
      result.current.setInteractionMode('aoe-place')
    })
    expect(result.current.interactionMode).toBe('aoe-place')

    rerender({ activeId: 'b' })
    expect(result.current.interactionMode).toBe('select-target')
  })

  it('clears aoe-place when aoeStep returns to none', () => {
    const { result, rerender } = renderHook(
      ({ step }: { step: 'none' | 'placing' | 'confirm' }) =>
        useEncounterRuntimeInteractionMode({
          activeCombatantId: 'a',
          aoeStep: step,
          selectedAction: noopAction,
          selectedCasterOptions: {},
        }),
      { initialProps: { step: 'placing' as 'none' | 'placing' | 'confirm' } },
    )

    act(() => {
      result.current.setInteractionMode('aoe-place')
    })
    expect(result.current.interactionMode).toBe('aoe-place')

    rerender({ step: 'none' })
    expect(result.current.interactionMode).toBe('select-target')
  })
})
