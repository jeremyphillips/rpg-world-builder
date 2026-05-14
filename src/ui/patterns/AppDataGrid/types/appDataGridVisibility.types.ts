/**
 * Optional viewer visibility rules for AppDataGrid schema items.
 * Omit `visibility` so everyone sees the item.
 */
export type AppDataGridVisibility = {
  /** If true, show this item only when `viewer.isPlatformAdmin` is true. */
  platformAdminOnly?: boolean
  /**
   * If true, show this item only for viewers who are not campaign content managers
   * (`!canManageContent(viewer)` — typically PC / player-facing UI).
   */
  pcViewerOnly?: boolean
  /**
   * If true, show this item only for campaign content managers (DM-style —
   * `canManageContent(viewer)`).
   */
  dmViewerOnly?: boolean
}

/** @deprecated Use `AppDataGridVisibility` instead. */
export type AppDataGridFilterVisibility = AppDataGridVisibility
