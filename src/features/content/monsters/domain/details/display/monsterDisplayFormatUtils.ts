/** Shared string helpers for monster detail display (no React). */

import { getDamageTypeDisplayName } from '@/features/mechanics/domain/damage/damageTypeUi';

export function humanizeKebabCase(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Resolves {@link DAMAGE_TYPE_ROWS} labels; falls back to title-cased id. */
export function humanizeDamageTypeId(id: string): string {
  return getDamageTypeDisplayName(id) ?? humanizeKebabCase(id);
}
