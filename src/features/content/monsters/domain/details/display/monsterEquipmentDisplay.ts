import type { MonsterEquipment } from '@/features/content/monsters/domain/types/monster-equipment.types';
import { humanizeKebabCase } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatWeaponEntry(ref: string, w: NonNullable<MonsterEquipment['weapons']>[string]): string {
  return w.aliasName ?? humanizeKebabCase(w.weaponId ?? ref);
}

function formatArmorEntry(ref: string, a: NonNullable<MonsterEquipment['armor']>[string]): string {
  return a.aliasName ?? humanizeKebabCase(a.armorId ?? ref);
}

export type MonsterEquipmentSummaryParts = {
  /** Comma-separated weapon display names (no "Weapons:" prefix). */
  weapons?: string;
  /** Comma-separated armor display names (no "Armor:" prefix). */
  armor?: string;
};

/**
 * Parsed lists for UI that needs structured labels (e.g. bold type names).
 */
export function getMonsterEquipmentSummaryParts(
  equipment: MonsterEquipment | undefined,
): MonsterEquipmentSummaryParts {
  if (!equipment) return {};

  const parts: MonsterEquipmentSummaryParts = {};

  if (equipment.weapons && Object.keys(equipment.weapons).length > 0) {
    parts.weapons = Object.entries(equipment.weapons)
      .map(([ref, w]) => formatWeaponEntry(ref, w))
      .join(', ');
  }

  if (equipment.armor && Object.keys(equipment.armor).length > 0) {
    parts.armor = Object.entries(equipment.armor)
      .map(([ref, a]) => formatArmorEntry(ref, a))
      .join(', ');
  }

  return parts;
}

/**
 * Plain-text summary for contexts that only accept a string (one line per category).
 */
export function formatMonsterEquipmentSummary(equipment: MonsterEquipment | undefined): string {
  const { weapons, armor } = getMonsterEquipmentSummaryParts(equipment);
  const lines: string[] = [];
  if (weapons) lines.push(`Weapons: ${weapons}`);
  if (armor) lines.push(`Armor: ${armor}`);
  return lines.length > 0 ? lines.join('\n') : '—';
}
