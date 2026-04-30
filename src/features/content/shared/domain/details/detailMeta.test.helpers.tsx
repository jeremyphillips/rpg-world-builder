import { Fragment } from 'react';
import { render } from '@testing-library/react';

/** True if any meta row’s rendered value includes the Patched badge text (label is empty for that spec). */
export function metaRowsIncludePatchedText(rows: { label: unknown; value?: unknown }[]): boolean {
  return rows.some((row) => {
    if (row.value == null) return false;
    const { container } = render(<Fragment>{row.value}</Fragment>);
    return (container.textContent ?? '').includes('Patched');
  });
}
