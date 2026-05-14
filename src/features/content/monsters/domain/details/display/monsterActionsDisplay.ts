import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterAction, MonsterSpecialAction } from '@/features/content/monsters/domain/types/monster-actions.types';
import { abilityIdToAbbrev } from '@/features/mechanics/domain/character';
import type { DiceOrFlat } from '@/shared/domain/dice';

import { humanizeDamageTypeId } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatDiceOrFlat(d: DiceOrFlat | undefined): string | undefined {
  if (d == null) return undefined;
  return String(d);
}

function formatAuthoredDamage(
  damage: DiceOrFlat | undefined,
  damageBonus?: number,
): string | undefined {
  if (damage == null) return undefined;
  const base = String(damage);
  if (typeof damageBonus !== 'number' || damageBonus === 0) {
    return base;
  }
  return `${base} ${damageBonus > 0 ? '+' : '-'} ${Math.abs(damageBonus)}`;
}

function formatRechargeShort(action: MonsterSpecialAction): string | undefined {
  if (action.recharge) {
    return `Recharge ${action.recharge.min}–${action.recharge.max}`;
  }
  if (action.uses) {
    return `${action.uses.count}/${action.uses.period}`;
  }
  return undefined;
}

/**
 * Stable display title for any action row (matches encounter adapter labeling).
 */
export function resolveMonsterActionTitle(monster: Monster, action: MonsterAction): string {
  if (action.kind === 'weapon') {
    const equipped = monster.mechanics.equipment?.weapons?.[action.weaponRef];
    return equipped?.aliasName ?? equipped?.weaponId ?? action.weaponRef;
  }
  if (action.kind === 'natural') {
    return action.name ?? action.attackType;
  }
  return action.name;
}

/**
 * One-line mechanical summary (attack bonus, reach, damage, save DC, recharge/uses).
 */
export function formatMonsterActionCallout(monster: Monster, action: MonsterAction): string | undefined {
  if (action.kind === 'weapon') {
    const w = monster.mechanics.equipment?.weapons?.[action.weaponRef];
    const parts: string[] = [];
    if (typeof w?.attackBonus === 'number') parts.push(`+${w.attackBonus} to hit`);
    if (typeof w?.reach === 'number') parts.push(`reach ${w.reach} ft.`);
    const dmg = formatAuthoredDamage(w?.damageOverride, w?.damageBonus);
    if (dmg) parts.push(dmg);
    return parts.length > 0 ? parts.join(' · ') : undefined;
  }

  if (action.kind === 'natural') {
    const parts: string[] = [];
    if (typeof action.attackBonus === 'number') parts.push(`+${action.attackBonus} to hit`);
    if (typeof action.reach === 'number') parts.push(`reach ${action.reach} ft.`);
    const dmg = formatAuthoredDamage(action.damage, action.damageBonus);
    if (dmg && action.damageType) {
      parts.push(`${dmg} ${humanizeDamageTypeId(action.damageType)}`);
    } else if (dmg) {
      parts.push(dmg);
    }
    return parts.length > 0 ? parts.join(' · ') : undefined;
  }

  const special = action;
  const parts: string[] = [];
  if (typeof special.attackBonus === 'number') parts.push(`+${special.attackBonus} to hit`);
  if (special.save) {
    parts.push(`${abilityIdToAbbrev(special.save.ability)} DC ${special.save.dc}`);
  }
  const dmg = formatDiceOrFlat(special.damage);
  if (dmg && special.damageType) {
    parts.push(`${dmg} ${humanizeDamageTypeId(special.damageType)}`);
  } else if (dmg) {
    parts.push(dmg);
  }
  const usage = formatRechargeShort(special);
  if (usage) parts.push(usage);

  return parts.length > 0 ? parts.join(' · ') : undefined;
}
