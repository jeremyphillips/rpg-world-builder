import { createElement } from 'react';
import type { ReactNode } from 'react';

/**
 * Whether a detail field value should be treated as empty for `hideIfEmpty`.
 */
export function isEmptyDetailValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (Object.keys(value as object).length === 0) return true;
  }
  return false;
}

/**
 * Default advanced/raw cell: pretty-printed JSON in a `<pre>`.
 */
export function defaultDetailRawRender(value: unknown): ReactNode {
  if (value === undefined) return '—';
  return createElement(
    'pre',
    {
      style: {
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
      },
    },
    JSON.stringify(value, null, 2),
  );
}
