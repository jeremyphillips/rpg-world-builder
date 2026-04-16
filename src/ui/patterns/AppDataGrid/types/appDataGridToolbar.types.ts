/**
 * Toolbar **layout** (row order) for `AppDataGrid` when `toolbarConfig.layout` is set.
 *
 * - **`primary` / `secondary`:** entries must be **`AppDataGridFilter.id`** values from `toolbarConfig.filters.definitions`.
 *   Unknown ids are skipped at render time; dev builds may warn (e.g. from `ContentTypeListPage`).
 * - **`utilities`:** not filter ids — built-in controls such as **Hide disallowed** that reuse existing filter state
 *   (typically {@link APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID}). Campaign content lists often include
 *   `utilities: ['hideDisallowed']` when the Allowed filter is present.
 *
 * Feature-specific conventions (which filters sit on row 1 vs 2) live next to each list’s filter builders;
 * {@link AppDataGridToolbarLayout} stays generic.
 */

/** Boolean toolbar filter for campaign allow/deny (shared with Hide disallowed utility). */
export const APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID = 'allowedInCampaign' as const

/** Built-in toolbar controls that are not entries in the filter definitions array. */
export type AppDataGridToolbarUtility = 'hideDisallowed'

export type AppDataGridToolbarLayout = {
  /** First toolbar row: filter ids (left-to-right). Search and actions render on this row. */
  primary: string[]
  /** Second toolbar row: filter ids (left-to-right). */
  secondary?: string[]
  /** Non-filter controls that read/write existing filter state (e.g. Hide disallowed). */
  utilities?: AppDataGridToolbarUtility[]
}
