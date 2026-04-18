import { describe, expect, it } from 'vitest'

import type { Race } from '@/features/content/races/domain/types'

import { collectRaceCreatureSenses } from '../collectRaceCreatureSenses'

describe('collectRaceCreatureSenses', () => {
  it('returns empty when race is undefined', () => {
    expect(collectRaceCreatureSenses(undefined, {})).toEqual([])
  })

  it('returns base senses only when no choices', () => {
    const race = {
      id: 'elf',
      grants: { senses: [{ type: 'darkvision', range: 60 }] },
    } as Race
    expect(collectRaceCreatureSenses(race, undefined)).toHaveLength(1)
    expect(collectRaceCreatureSenses(race, {})).toHaveLength(1)
  })

  it('merges selected option senses', () => {
    const race = {
      id: 'elf',
      grants: { senses: [{ type: 'darkvision', range: 60 }] },
      definitionGroups: [
        {
          id: 'elven-lineage',
          name: 'Elven Lineage',
          kind: 'lineage' as const,
          selectionLevel: 1,
          options: [
            {
              id: 'drow',
              name: 'Drow',
              grants: { senses: [{ type: 'darkvision', range: 120 }] },
            },
          ],
        },
      ],
    } as Race
    const rows = collectRaceCreatureSenses(race, { 'elven-lineage': 'drow' })
    expect(rows).toHaveLength(2)
    expect(rows.map((s) => s.range)).toEqual([60, 120])
  })
})
