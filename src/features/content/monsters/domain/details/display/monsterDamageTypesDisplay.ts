import type {
  CreatureResistanceDamageType,
  CreatureVulnerabilityDamageType,
  ImmunityType,
} from '@/features/content/monsters/domain/types';
import { getConditionImmunityDisplayName } from '@/features/mechanics/domain/conditions/effect-condition-definitions';
import { getDamageTypeDisplayName } from '@/features/mechanics/domain/damage/damageTypeUi';

import { humanizeKebabCase } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatCreatureDamageKindEntry(id: string): string {
  return (
    getConditionImmunityDisplayName(id) ??
    getDamageTypeDisplayName(id) ??
    humanizeKebabCase(id)
  );
}

function formatList(values: readonly string[] | undefined): string {
  if (!values?.length) return '—';
  return values.map((e) => formatCreatureDamageKindEntry(String(e))).join(', ');
}

/** Value-only line for a KeyValue row labeled “Immunities”. */
export function formatMonsterImmunitiesLine(immunities: ImmunityType[] | undefined): string {
  return formatList(immunities);
}

/** Value-only line for a KeyValue row labeled “Vulnerabilities”. */
export function formatMonsterVulnerabilitiesLine(
  vulnerabilities: CreatureVulnerabilityDamageType[] | undefined,
): string {
  return formatList(vulnerabilities);
}

/** Value-only line for a KeyValue row labeled “Resistances” (if shown). */
export function formatMonsterResistancesLine(
  resistances: CreatureResistanceDamageType[] | undefined,
): string {
  return formatList(resistances);
}
