/**
 * Centralized source display labels for content (system vs campaign).
 * UI-only mapping — stored values remain 'system' and 'campaign'.
 */

/** Value => display label for content source. */
export const CONTENT_SOURCE_LABELS: Record<string, string> = {
  system: 'System',
  campaign: 'Homebrew',
};

export type SourceMeta = {
  label: string;
  showInColumn: boolean;
  sx?: Record<string, unknown>;
};

/** Centralized source meta for column display and styling. */
export const SOURCE_META: Record<string, SourceMeta> = {
  system: { label: 'System', showInColumn: false },
  campaign: { label: 'Homebrew', showInColumn: true, sx: { color: 'warning.main' } },
};

/** Options for the Source select filter (AppDataGrid). */
export const SOURCE_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'System', value: 'system' },
  { label: 'Homebrew', value: 'campaign' },
] as const;

/**
 * Format a content source value for display.
 * - 'system' or undefined/null => "System"
 * - 'campaign' => "Homebrew"
 * - unknown values => String(value) or '—'
 */
export function formatContentSource(
  source: string | null | undefined
): string {
  if (source == null || source === '') return 'System';
  const label = CONTENT_SOURCE_LABELS[source];
  if (label != null) return label;
  return source || '—';
}

/**
 * Get display text for Source column (reduces noise: system => blank, campaign => "Homebrew").
 */
export function getSourceColumnDisplay(
  source: string | null | undefined
): { text: string; sx?: Record<string, unknown> } {
  const resolved = source ?? 'system';
  const meta = SOURCE_META[resolved];
  if (meta?.showInColumn) {
    return { text: meta.label, sx: meta.sx };
  }
  return { text: '' };
}
