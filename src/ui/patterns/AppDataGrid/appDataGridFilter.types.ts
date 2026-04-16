/**
 * Toolbar filter definitions for `AppDataGrid` (shared with builders and layout helpers).
 */

export interface FilterOption {
  value: string
  label: string
}

/**
 * Optional toolbar visibility (defaults: everyone sees the filter).
 * Co-locate on the same object as `id` / `options` so rules stay next to the filter definition.
 */
export type AppDataGridFilterVisibility = {
  /** If true, filter is shown only when `viewer.isPlatformAdmin` is true. */
  platformAdminOnly?: boolean
}

/** Optional metadata shared by all filter variants. */
type AppDataGridFilterMeta<T> = {
  /** Shown next to the label (e.g. info icon + tooltip). */
  description?: string
  /**
   * When true, badge text is `${label}: ${value}`. When false/omitted (default), badge shows the value
   * segment only (e.g. `Wizard` instead of `Classes: Wizard`).
   */
  badgePrefixFilterLabel?: boolean
  /**
   * Override badge text for this filter when active. Return a string for one badge, or string[] for
   * multi-select (one badge per entry; order should match selected values when per-badge delete applies).
   */
  formatActiveChipValue?: (ctx: {
    value: unknown
    filter: AppDataGridFilter<T>
  }) => string | string[]
}

export type AppDataGridFilter<T> =
  | ({
      id: string
      label: string
      type: 'select'
      options: FilterOption[]
      accessor: (row: T) => string | null | undefined
      defaultValue?: string
      visibility?: AppDataGridFilterVisibility
    } & AppDataGridFilterMeta<T>)
  | ({
      id: string
      label: string
      type: 'multiSelect'
      options: FilterOption[]
      accessor: (row: T) => string[]
      defaultValue?: string[]
      visibility?: AppDataGridFilterVisibility
    } & AppDataGridFilterMeta<T>)
  | ({
      id: string
      label: string
      type: 'boolean'
      trueLabel?: string
      falseLabel?: string
      accessor: (row: T) => boolean
      defaultValue?: 'all' | 'true' | 'false'
      visibility?: AppDataGridFilterVisibility
    } & AppDataGridFilterMeta<T>)
  | ({
      id: string
      label: string
      type: 'range'
      /** Sorted unique numeric values present in the catalog (slider stops). */
      steps: readonly number[]
      accessor: (row: T) => number
      defaultValue: { min: number; max: number }
      /** Thumb labels and trigger summary for numeric step values. */
      formatStepValue: (n: number) => string
      visibility?: AppDataGridFilterVisibility
    } & AppDataGridFilterMeta<T>)

export type AppDataGridActiveChipFormatContext<T> = {
  value: unknown
  filter: AppDataGridFilter<T>
}
