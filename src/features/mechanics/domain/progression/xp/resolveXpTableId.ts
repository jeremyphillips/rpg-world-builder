import type { ClassId } from '@/shared/types/ruleset';
import type { XpTableId } from './xp.types';

export function resolveXpTableId(
  xpConfig: { enabled: boolean; mode: 'shared' | 'per_class'; tableId: XpTableId; perClassTableId?: Partial<Record<ClassId, XpTableId>> },
  classId?: ClassId
): XpTableId {
  if (!xpConfig.enabled) return xpConfig.tableId;

  if (xpConfig.mode === 'per_class' && classId) {
    return xpConfig.perClassTableId?.[classId] ?? xpConfig.tableId;
  }

  return xpConfig.tableId;
}
