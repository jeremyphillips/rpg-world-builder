import { describe, expect, it } from 'vitest'

import {
  formatCreatureSenseEntry,
  formatCreatureSenseList,
  formatCreatureSensesLine,
} from '../creatureSenses.format'

describe('formatCreatureSenseEntry', () => {
  it('formats darkvision with range using vocab label', () => {
    expect(formatCreatureSenseEntry({ type: 'darkvision', range: 60 })).toBe('Darkvision 60 ft.')
  })

  it('includes notes after range when present', () => {
    expect(
      formatCreatureSenseEntry({
        type: 'darkvision',
        range: 120,
        notes: 'Unimpeded by magical Darkness',
      }),
    ).toBe('Darkvision 120 ft. Unimpeded by magical Darkness')
  })

  it('formats notes-only sense', () => {
    expect(formatCreatureSenseEntry({ type: 'blindsight', notes: 'echolocation' })).toBe(
      'Blindsight (echolocation)',
    )
  })

  it('maps legacy truesense type id to Truesight label (data compatibility)', () => {
    expect(
      formatCreatureSenseEntry({ type: 'truesense' as never, range: 30 }),
    ).toBe('Truesight 30 ft.')
  })
})

describe('formatCreatureSenseList', () => {
  it('returns em dash for undefined or empty', () => {
    expect(formatCreatureSenseList(undefined)).toBe('—')
    expect(formatCreatureSenseList([])).toBe('—')
  })

  it('joins multiple senses with newline', () => {
    expect(
      formatCreatureSenseList([
        { type: 'darkvision', range: 60 },
        { type: 'blindsight', range: 10 },
      ]),
    ).toBe('Darkvision 60 ft.\nBlindsight 10 ft.')
  })

  it('does not include passive perception', () => {
    expect(formatCreatureSenseList([{ type: 'darkvision', range: 60 }])).not.toMatch(/passive/i)
  })
})

describe('formatCreatureSensesLine', () => {
  it('returns em dash for undefined', () => {
    expect(formatCreatureSensesLine(undefined)).toBe('—')
  })

  it('returns em dash when empty after normalize', () => {
    expect(formatCreatureSensesLine({ special: [] })).toBe('—')
  })

  it('formats darkvision with range', () => {
    expect(formatCreatureSensesLine({ special: [{ type: 'darkvision', range: 60 }] })).toBe(
      'Darkvision 60 ft.',
    )
  })

  it('joins multiple special senses with newline', () => {
    expect(
      formatCreatureSensesLine({
        special: [
          { type: 'darkvision', range: 60 },
          { type: 'truesight', range: 120 },
        ],
      }),
    ).toBe('Darkvision 60 ft.\nTruesight 120 ft.')
  })

  it('appends passive Perception when present', () => {
    expect(
      formatCreatureSensesLine({
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 14,
      }),
    ).toBe('Darkvision 60 ft.\npassive Perception 14')
  })
})
