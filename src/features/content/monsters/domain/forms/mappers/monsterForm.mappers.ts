/**
 * Pure mappers for Monster form values ↔ domain types.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Monster, MonsterInput } from '@/features/content/monsters/domain/types';
import {
  buildToInput,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import { MONSTER_FORM_FIELDS } from '../registry/monsterForm.registry';
import type { MonsterFormValues } from '../types/monsterForm.types';

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
    sizeCategory: monster.sizeCategory ?? '',
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
    proficiencyBonus: formatJson(m?.proficiencyBonus),
    equipment: formatJson(m?.equipment),
    immunities: formatJson(m?.immunities),
    vulnerabilities: formatJson(m?.vulnerabilities),
    alignment: formatJson(l?.alignment),
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
  if (prof !== undefined) mechanics.proficiencies = prof;
  const pb = parseJson(values.proficiencyBonus);
  if (pb !== undefined) mechanics.proficiencyBonus = pb;
  const eq = parseJson(values.equipment);
  if (eq !== undefined) mechanics.equipment = eq;
  const imm = parseJson(values.immunities);
  if (imm !== undefined) mechanics.immunities = imm;
  const vuln = parseJson(values.vulnerabilities);
  if (vuln !== undefined) mechanics.vulnerabilities = vuln;

  const align = parseJson(values.alignment);
  if (align !== undefined) lore.alignment = align;
  const cr = parseJson(values.challengeRating);
  if (cr !== undefined) lore.challengeRating = cr;
  const xp = parseJson(values.xpValue);
  if (xp !== undefined) lore.xpValue = xp;

  return {
    ...base,
    name: values.name,
    type: values.type || undefined,
    sizeCategory: values.sizeCategory || undefined,
    description: parseJson(values.description) as MonsterInput['description'],
    languages: parseJson(values.languages) as MonsterInput['languages'],
    mechanics: Object.keys(mechanics).length > 0 ? (mechanics as MonsterInput['mechanics']) : undefined,
    lore: Object.keys(lore).length > 0 ? (lore as MonsterInput['lore']) : undefined,
  } as MonsterInput;
};
