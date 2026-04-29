/**
 * Pure mappers for Monster form values ↔ domain types.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Monster, MonsterInput } from '@/features/content/monsters/domain/types';
import { toIdStringArray } from '@/features/content/shared/forms/toIdStringArray';
import {
  buildToInput,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import type {
  CreatureVulnerabilityDamageType,
  ImmunityType,
} from '@/features/mechanics/domain/creatures/immunities.types';
import {
  filterToAllowedCreatureImmunityIds,
  filterToAllowedVulnerabilityIds,
} from '@/features/content/shared/domain/vocab/creatureImmunitiesForm.vocab';
import { isProficiencyBonus } from '@/shared/domain/proficiency';
import { isSubtypeAllowedForCreatureType } from '@/features/content/creatures/domain/values/creatureTaxonomy';
import { validateCreatureProficiencyGroups } from '@/shared/domain/proficiency/authoredCreatureProficiencies';
import type { CreatureSubtypeId } from '@/features/content/creatures/domain/values';
import { MONSTER_FORM_FIELDS } from '../registry/monsterForm.registry';
import type { MonsterFormValues } from '../types/monsterForm.types';
import { parseCreatureTypeId } from '../config/monsterForm.config';

const toInput = buildToInput(MONSTER_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(MONSTER_FORM_FIELDS);

const formatJson = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return '';
    }
  }
  return String(v);
};

const parseJson = (v: unknown): unknown => {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

const numOrUndefined = (v: unknown): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const numToStr = (v: unknown): string =>
  v != null && Number.isFinite(Number(v)) ? String(v) : '';

/**
 * Converts a Monster domain object to form values.
 */
export const monsterToFormValues = (monster: Monster): MonsterFormValues => {
  const m = monster.mechanics;
  const l = monster.lore;
  return {
    ...(defaultFormValues as MonsterFormValues),
    name: monster.name,
    type: monster.type ?? '',
    subtype: monster.subtype ?? '',
    sizeCategory: monster.sizeCategory ?? '',
    imageKey: (monster.imageKey ?? '') as MonsterFormValues['imageKey'],
    accessPolicy: (monster.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as MonsterFormValues['accessPolicy'],
    description: formatJson(monster.description),
    languages: formatJson(monster.languages),
    hitPoints: formatJson(m?.hitPoints),
    armorClass: formatJson(m?.armorClass),
    movement: formatJson(m?.movement),
    actions: formatJson(m?.actions),
    bonusActions: formatJson(m?.bonusActions),
    legendaryActions: formatJson(m?.legendaryActions),
    traits: formatJson(m?.traits),
    abilities: formatJson(m?.abilities),
    senses: formatJson(m?.senses),
    proficiencies: formatJson(m?.proficiencies),
    proficiencyBonus: numToStr(m?.proficiencyBonus),
    equipment: formatJson(m?.equipment),
    immunities: toIdStringArray(m?.immunities),
    vulnerabilities: toIdStringArray(m?.vulnerabilities),
    alignment: l?.alignment != null ? String(l.alignment) : '',
    challengeRating: formatJson(l?.challengeRating),
    xpValue: formatJson(l?.xpValue),
  };
};

/**
 * Converts form values to MonsterInput for create/update.
 */
export const toMonsterInput = (values: MonsterFormValues): MonsterInput => {
  const base = toInput(values) as Record<string, unknown>;
  const mechanics: Record<string, unknown> = {};
  const lore: Record<string, unknown> = {};

  const hp = parseJson(values.hitPoints);
  if (hp !== undefined) mechanics.hitPoints = hp;
  const ac = parseJson(values.armorClass);
  if (ac !== undefined) mechanics.armorClass = ac;
  const mov = parseJson(values.movement);
  if (mov !== undefined) mechanics.movement = mov;
  const acts = parseJson(values.actions);
  if (acts !== undefined) mechanics.actions = acts;
  const bonusActs = parseJson(values.bonusActions);
  if (bonusActs !== undefined) mechanics.bonusActions = bonusActs;
  const leg = parseJson(values.legendaryActions);
  if (leg !== undefined) mechanics.legendaryActions = leg;
  const tr = parseJson(values.traits);
  if (tr !== undefined) mechanics.traits = tr;
  const ab = parseJson(values.abilities);
  if (ab !== undefined) mechanics.abilities = ab;
  const sens = parseJson(values.senses);
  if (sens !== undefined) mechanics.senses = sens;
  const prof = parseJson(values.proficiencies);
  if (prof !== undefined) {
    const profErrors = validateCreatureProficiencyGroups(prof);
    if (profErrors.length > 0) {
      throw new Error(profErrors.map((e) => `${e.path}: ${e.message}`).join('; '));
    }
    mechanics.proficiencies = prof;
  }
  const pb = numOrUndefined(values.proficiencyBonus);
  if (pb !== undefined && isProficiencyBonus(pb)) mechanics.proficiencyBonus = pb;
  const eq = parseJson(values.equipment);
  if (eq !== undefined) mechanics.equipment = eq;
  if (Array.isArray(values.immunities)) {
    const imm = filterToAllowedCreatureImmunityIds(values.immunities) as ImmunityType[];
    mechanics.immunities = imm;
  }
  if (Array.isArray(values.vulnerabilities)) {
    const vuln =
      filterToAllowedVulnerabilityIds(values.vulnerabilities) as CreatureVulnerabilityDamageType[];
    mechanics.vulnerabilities = vuln;
  }

  if (values.alignment) lore.alignment = values.alignment;
  const cr = parseJson(values.challengeRating);
  if (cr !== undefined) lore.challengeRating = cr;
  const xp = parseJson(values.xpValue);
  if (xp !== undefined) lore.xpValue = xp;

  const typeId = parseCreatureTypeId(values.type);
  const sub = values.subtype ? (values.subtype as CreatureSubtypeId) : undefined;
  const safeSubtype =
    typeId && sub && isSubtypeAllowedForCreatureType(typeId, sub) ? sub : undefined;

  return {
    ...base,
    name: values.name,
    type: values.type || undefined,
    sizeCategory: values.sizeCategory || undefined,
    subtype: safeSubtype,
    description: parseJson(values.description) as MonsterInput['description'],
    languages: parseJson(values.languages) as MonsterInput['languages'],
    mechanics: Object.keys(mechanics).length > 0 ? (mechanics as MonsterInput['mechanics']) : undefined,
    lore: Object.keys(lore).length > 0 ? (lore as MonsterInput['lore']) : undefined,
  } as MonsterInput;
};
