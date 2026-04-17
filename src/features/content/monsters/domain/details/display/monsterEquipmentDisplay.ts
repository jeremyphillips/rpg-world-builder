import type { MonsterEquipment } from '@/features/content/monsters/domain/types/monster-equipment.types';
import { humanizeKebabCase } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatWeaponEntry(ref: string, w: NonNullable<MonsterEquipment['weapons']>[string]): string {
  return w.aliasName ?? humanizeKebabCase(w.weaponId ?? ref);
}

function formatArmorEntry(ref: string, a: NonNullable<MonsterEquipment['armor']>[string]): string {
  return a.aliasName ?? humanizeKebabCase(a.armorId ?? ref);
}

/**
 * Lists equipped weapons and armor labels for the stat block.
 */
export function formatMonsterEquipmentSummary(equipment: MonsterEquipment | undefined): string {
  if (!equipment) return '—';

  const parts: string[] = [];

  if (equipment.weapons && Object.keys(equipment.weapons).length > 0) {
    const line = Object.entries(equipment.weapons)
      .map(([ref, w]) => formatWeaponEntry(ref, w))
      .join(', ');
    parts.push(`Weapons: ${line}`);
  }

  if (equipment.armor && Object.keys(equipment.armor).length > 0) {
    const line = Object.entries(equipment.armor)
      .map(([ref, a]) => formatArmorEntry(ref, a))
      .join(', ');
    parts.push(`Armor: ${line}`);
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}
