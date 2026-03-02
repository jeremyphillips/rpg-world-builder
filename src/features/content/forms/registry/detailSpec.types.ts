import type { ReactNode } from 'react';

export type DetailSpec<T, Ctx = unknown> = {
  key: string;
  label: ReactNode;
  order: number;

  /**
   * Render the value for this field.
   * Ctx allows passing computed values (like dexLabel).
   */
  render: (item: T, ctx: Ctx) => ReactNode;

  /**
   * Optional: hide field entirely
   */
  hidden?: (item: T) => boolean;
};
