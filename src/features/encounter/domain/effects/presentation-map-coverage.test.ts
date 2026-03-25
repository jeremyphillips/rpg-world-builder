import { describe, expect, it } from 'vitest'

import { EFFECT_CONDITION_IDS } from '@/features/mechanics/domain/conditions/effect-condition-definitions'

import { COMBAT_STATE_MARKER_UI_MAP, COMBAT_STATE_UI_MAP } from './combat-state-ui-map'
import { enrichWithPresentation } from './presentable-effects'

/**
 * Semantic keys that intentionally have no dedicated `COMBAT_STATE_UI_MAP` row and always use
 * `getFallbackPresentation`. Add sparingly and review when this list grows.
 */
export const FALLBACK_ONLY_PRESENTATION_KEYS: readonly string[] = []

describe('presentation map coverage', () => {
  it('every EffectConditionId has a direct COMBAT_STATE_UI_MAP entry', () => {
    for (const id of EFFECT_CONDITION_IDS) {
      expect(COMBAT_STATE_UI_MAP[id]).toBeDefined()
    }
  })

  it('every COMBAT_STATE_MARKER_UI_MAP key has a direct COMBAT_STATE_UI_MAP entry', () => {
    for (const key of Object.keys(COMBAT_STATE_MARKER_UI_MAP)) {
      expect(COMBAT_STATE_UI_MAP[key]).toBeDefined()
    }
  })

  it('expected semantic keys resolve through enrich without fallback', () => {
    const keys = [
      ...EFFECT_CONDITION_IDS,
      ...Object.keys(COMBAT_STATE_MARKER_UI_MAP),
    ] as string[]
    for (const key of keys) {
      if (FALLBACK_ONLY_PRESENTATION_KEYS.includes(key)) continue
      const enriched = enrichWithPresentation({
        id: 'coverage-test',
        kind: 'condition',
        key,
        label: 'intentionally_stale_raw_label',
      })
      expect(enriched.usedFallbackPresentation, `missing map row for key: ${key}`).toBe(false)
      expect(enriched.label).toBe(enriched.presentation.label)
    }
  })
})
