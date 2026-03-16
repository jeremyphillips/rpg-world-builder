import { describe, expect, it } from 'vitest'
import { normalizeDuration } from './timing.types'
import { normalizeTriggerType } from '../triggers/trigger.types'

describe('timing semantics', () => {
  it('normalizes fixed string durations into structured duration objects', () => {
    expect(normalizeDuration('1 minute')).toEqual({
      kind: 'fixed',
      value: 1,
      unit: 'minute',
    })
  })

  it('normalizes next-turn shorthand into a shared turn-boundary duration', () => {
    expect(normalizeDuration('next-turn')).toEqual({
      kind: 'until-turn-boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'end',
    })
  })

  it('normalizes legacy trigger strings into canonical trigger ids', () => {
    expect(normalizeTriggerType('on_weapon_hit')).toBe('weapon-hit')
    expect(normalizeTriggerType('on_damage_dealt')).toBe('damage-dealt')
    expect(normalizeTriggerType('on_turn_start')).toBe('turn-start')
  })
})
