import { canManageContent, type ViewerContext } from '@/shared/domain/capabilities'

/** Segment used by the Owned select filter (`filterRows` compares accessor to selected value). */
export type OwnedRowSegment = 'owned' | 'notOwned'

export function rowOwnedSegment(rowId: string, ownedIds: ReadonlySet<string>): OwnedRowSegment {
  return ownedIds.has(rowId) ? 'owned' : 'notOwned'
}

export function showPcOwnedNameIcon(params: {
  viewerContext: ViewerContext | undefined
  ownedIds: ReadonlySet<string> | undefined
  rowId: string
}): boolean {
  const { viewerContext, ownedIds, rowId } = params
  if (!viewerContext || !ownedIds) return false
  if (canManageContent(viewerContext)) return false
  return ownedIds.has(rowId)
}
