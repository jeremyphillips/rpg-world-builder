import type { AppDataGridFilter } from '@/ui/patterns'

/** Select filter value must not collide with real character ids. */
export const DM_OWNED_BY_CHARACTER_ROW_NOT_IN_SET = '__dm_owned_row_not_in_set__'

export const DM_OWNED_BY_CHARACTER_FILTER_ID = 'dmOwnedByCharacter' as const

/**
 * DM-only: filter rows to content owned by a selected party character.
 * PC “Owned” / `owned` filter stays separate (`createOwnedMembershipFilter`).
 */
export function createDmOwnedByCharacterFilter<T extends { id: string }>(params: {
  selectedCharacterId: string
  ownedIds: ReadonlySet<string>
  queryReady: boolean
  partyOptions: { value: string; label: string }[]
  nameById: ReadonlyMap<string, string>
}): AppDataGridFilter<T> {
  const { selectedCharacterId, ownedIds, queryReady, partyOptions, nameById } = params

  return {
    id: DM_OWNED_BY_CHARACTER_FILTER_ID,
    label: 'Owned by character',
    type: 'select',
    defaultValue: 'all',
    options: [{ value: 'all', label: 'All' }, ...partyOptions],
    visibility: { dmViewerOnly: true },
    accessor: (row) => {
      if (selectedCharacterId === 'all') return 'all'
      if (!queryReady) return selectedCharacterId
      return ownedIds.has(row.id) ? selectedCharacterId : DM_OWNED_BY_CHARACTER_ROW_NOT_IN_SET
    },
    formatActiveBadgeValue: ({ value }) => {
      const v = String(value ?? '')
      if (v === 'all') return ''
      const name = nameById.get(v) ?? v
      return `Owned: ${name}`
    },
  }
}
