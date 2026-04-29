import type { AppDataGridFilter } from '@/ui/patterns'

import { rowOwnedSegment } from './ownedMembership'

/**
 * Select filter: All / Owned / Not owned — membership against `ownedIds`.
 * Use `visibility: { pcViewerOnly: true }` so DMs do not see it (see ContentTypeListPage).
 */
export function createOwnedMembershipFilter<T extends { id: string }>(
  ownedIds: ReadonlySet<string>,
): AppDataGridFilter<T> {
  return {
    id: 'owned',
    label: 'Owned',
    type: 'select',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'All' },
      { value: 'owned', label: 'Owned' },
      { value: 'notOwned', label: 'Not owned' },
    ],
    accessor: (row) => rowOwnedSegment(row.id, ownedIds),
    visibility: { pcViewerOnly: true },
  }
}
