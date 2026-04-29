import { canManageContent, type ViewerContext } from '@/shared/domain/capabilities'

import type { AppDataGridVisibility } from '../types'

export function isAppDataGridVisibleToViewer(
  visibility: AppDataGridVisibility | undefined,
  viewer: ViewerContext | undefined,
): boolean {
  if (!visibility) return true
  if (visibility.platformAdminOnly && !viewer?.isPlatformAdmin) return false
  if (visibility.pcViewerOnly) {
    if (!viewer) return false
    if (canManageContent(viewer)) return false
  }
  if (visibility.dmViewerOnly) {
    if (!viewer) return false
    if (!canManageContent(viewer)) return false
  }
  return true
}
