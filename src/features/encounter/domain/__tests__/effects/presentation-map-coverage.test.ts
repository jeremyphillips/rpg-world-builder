import { describe, expect, it } from 'vitest'

import { EFFECT_CONDITION_IDS } from '@/features/mechanics/domain/conditions/effect-condition-definitions'

import {
  COMBAT_STATE_MARKER_UI_MAP,
  COMBAT_STATE_UI_MAP,
  CORE_COMBAT_STATE_KEYS,
  CORE_COMBAT_STATE_MAP,
  SPECIALIZED_EFFECT_KEYS,
  SPECIALIZED_EFFECT_PRESENTATION_MAP,
} from '../../effects/combat-state-ui-map'
import { enrichWithPresentation } from '../../effects/presentable-effects'

/**
 * Keys that intentionally never have a core or specialized row (e.g. dynamic hook instance ids).
 * Add sparingly; review when this list grows.
 */
export const FALLBACK_ONLY_PRESENTATION_KEYS: readonly string[] = []

describe('presentation map coverage (tier-aware)', () => {
  it('every EffectConditionId has a core map entry', () => {
    for (const id of EFFECT_CONDITION_IDS) {
      expect(CORE_COMBAT_STATE_MAP[id]).toBeDefined()
    }
  })

  it('legacy COMBAT_STATE_MARKER_UI_MAP keys remain in merged COMBAT_STATE_UI_MAP', () => {
    for (const key of Object.keys(COMBAT_STATE_MARKER_UI_MAP)) {
      expect(COMBAT_STATE_UI_MAP[key]).toBeDefined()
    }
  })

  it('core keys resolve through enrich without fallback', () => {
    for (const key of CORE_COMBAT_STATE_KEYS) {
      if (FALLBACK_ONLY_PRESENTATION_KEYS.includes(key)) continue
      const enriched = enrichWithPresentation({
        id: 'coverage-test',
        kind: 'condition',
        key,
        label: 'intentionally_stale_raw_label',
      })
      expect(enriched.usedFallbackPresentation, `core key should not fallback: ${key}`).toBe(false)
      expect(enriched.presentationTier).toBe('core')
      expect(enriched.label).toBe(enriched.presentation.label)
    }
  })

  it('specialized keys resolve through enrich without generic fallback', () => {
    for (const key of SPECIALIZED_EFFECT_KEYS) {
      if (FALLBACK_ONLY_PRESENTATION_KEYS.includes(key)) continue
      const enriched = enrichWithPresentation({
        id: 'coverage-test',
        kind: 'effect',
        key,
        label: 'stale',
      })
      expect(enriched.usedFallbackPresentation, `specialized key should map: ${key}`).toBe(false)
      expect(enriched.presentationTier).toBe('specialized')
      expect(enriched.label).toBe(SPECIALIZED_EFFECT_PRESENTATION_MAP[key]!.label)
    }
  })

  it('unknown keys use fallback tier', () => {
    const enriched = enrichWithPresentation({
      id: 'x',
      kind: 'effect',
      key: 'totally-unknown-custom-state',
      label: 'raw',
    })
    expect(enriched.usedFallbackPresentation).toBe(true)
    expect(enriched.presentationTier).toBe('fallback')
  })
})
