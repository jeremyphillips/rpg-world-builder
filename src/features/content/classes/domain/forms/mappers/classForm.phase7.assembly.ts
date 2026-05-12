/**
 * Maps structured Phase‑7 proficiency / requirement form fields ↔ domain.
 * RequirementExpr blobs (`multiclassing`, `minStats`) remain JSON text on the form.
 */

import type { CampaignCatalog } from '@/features/mechanics/domain/rulesets/system/catalog';
import {
  ARMOR_MATERIAL_OPTIONS,
  type Material,
} from '@/features/content/equipment/armor/domain/vocab/armor.vocab';
import {
  ALIGNMENT_IDS,
  getAlignmentDisplayName,
} from '@/features/content/shared/domain/vocab/alignment.vocab';
import type {
  CharacterClass,
  ClassProficiencies,
  ClassRequirement,
} from '@/features/content/classes/domain/types';
import type {
  ClassProficiencyArmor,
  ClassProficiencySkillSelection,
  ClassProficiencyWeapon,
  ToolProficiencyItem,
} from '@/features/content/classes/domain/types/proficiencies.types';
import type { RequirementExpr } from '@/features/content/classes/domain/types/requirements.types';
import type { ClassFormValues } from '../types/classForm.types';
import { parseJsonObject, formatJsonObject } from '@/features/content/shared/forms/parsers';

const TOOL_IDS: ToolProficiencyItem[] = [
  'thieves-tools',
  'disguise-kit',
  'forgery-kit',
  'herbalism-kit',
  'smiths-tools',
  'tinkers-tools',
  'vehicle-tool',
];

export function buildRacePickerOptionsFromCatalog(
  catalog: CampaignCatalog,
): { value: string; label: string }[] {
  return catalog.raceIds.map((id) => ({
    value: id,
    label: catalog.racesById[id]?.name ?? id,
  }));
}

export function buildAlignmentPickerOptions(): { id: string; name: string }[] {
  return ALIGNMENT_IDS.map((id) => ({
    id,
    name: getAlignmentDisplayName(id) ?? id,
  }));
}

export function pickerOptionsFromPairs(pairs: { id: string; name: string }[]) {
  return pairs.map(({ id, name }) => ({ value: id, label: name }));
}

export function toolPickerOptionsStatic() {
  const labels: Record<ToolProficiencyItem, string> = {
    'thieves-tools': "Thieves' tools",
    'disguise-kit': 'Disguise kit',
    'forgery-kit': 'Forgery kit',
    'herbalism-kit': 'Herbalism kit',
    'smiths-tools': "Smith's tools",
    'tinkers-tools': "Tinker's tools",
    'vehicle-tool': 'Vehicle (land/water/air)',
  };
  return TOOL_IDS.map((id) => ({ value: id, label: labels[id] }));
}

export function materialPickerOptionsStatic() {
  return ARMOR_MATERIAL_OPTIONS.map((m) => ({ value: m.id, label: m.name }));
}

const WEAPON_CATEGORY_PRESETS = [
  { id: 'simple', name: 'Simple' },
  { id: 'martial', name: 'Martial' },
  { id: 'natural', name: 'Natural' },
];

const ARMOR_CATEGORY_PRESETS = [
  { id: 'light', name: 'Light' },
  { id: 'medium', name: 'Medium' },
  { id: 'heavy', name: 'Heavy' },
  { id: 'shields', name: 'Shields' },
  { id: 'allArmor', name: 'All armor types' },
];

export function weaponCategoryPickerOptionsStatic() {
  return WEAPON_CATEGORY_PRESETS.map((r) => ({ value: r.id, label: r.name }));
}

export function armorCategoryPickerOptionsStatic() {
  return ARMOR_CATEGORY_PRESETS.map((r) => ({ value: r.id, label: r.name }));
}

export function proficiencyDefaultsFromPlaceholder(): Partial<ClassProficiencies> {
  return {
    skills: { type: 'choice', choose: 2, level: 1 },
    weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
    armor: { type: 'fixed', level: 1, categories: ['light', 'medium'] },
  };
}

function trimLinesOrCommaList(raw: string): string[] {
  const parts = raw
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

function requirementExprLooksEmpty(expr?: RequirementExpr): boolean {
  if (!expr) return true;
  const noteEmpty = !(expr.note && expr.note.trim().length > 0);
  const anyEmpty = !Array.isArray(expr.anyOf) || expr.anyOf.length === 0;
  return noteEmpty && anyEmpty;
}

/**
 * Hydrates proficiency + requirement JSON fragments and structured picker fields from a domain class.
 */
export function classPhase7ToFormFragments(charClass: CharacterClass): Pick<
  ClassFormValues,
  | 'requirementsAllowedRaceIds'
  | 'requirementsAllowedAlignmentIds'
  | 'requirementsMulticlassingJson'
  | 'requirementsMinStatsJson'
  | 'proficiencySkillsType'
  | 'proficiencySkillsLevel'
  | 'proficiencySkillsChoose'
  | 'proficiencySkillsFromText'
  | 'proficiencyWeaponsType'
  | 'proficiencyWeaponsLevel'
  | 'proficiencyWeaponsCategories'
  | 'proficiencyWeaponsItemsText'
  | 'proficiencyArmorType'
  | 'proficiencyArmorLevel'
  | 'proficiencyArmorCategories'
  | 'proficiencyArmorItemsText'
  | 'proficiencyArmorDisallowedMaterials'
  | 'proficiencyToolsType'
  | 'proficiencyToolsLevel'
  | 'proficiencyToolsItems'
> {
  const p = charClass.proficiencies ?? proficiencyDefaultsFromPlaceholder();
  const sk = (p.skills ?? { type: 'choice', choose: 0, level: 1 }) as ClassProficiencySkillSelection;
  const w = p.weapons ?? { type: 'fixed', level: 1 };
  const ar = p.armor ?? { type: 'fixed', level: 1 };
  const tools = p.tools;

  const r = charClass.requirements ?? { allowedRaces: 'all', allowedAlignments: 'any' };
  const races = r.allowedRaces === 'all' ? [] : [...(r.allowedRaces ?? [])];
  const allowedAlignmentsRaw = r.allowedAlignments ?? 'any';
  const aligns = allowedAlignmentsRaw === 'any' ? [] : [...allowedAlignmentsRaw];

  return {
    proficiencySkillsType: sk.type ?? 'choice',
    proficiencySkillsLevel:
      sk.level != null && Number.isFinite(sk.level) ? String(sk.level) : '1',
    proficiencySkillsChoose:
      sk.type === 'choice' && sk.choose != null && Number.isFinite(sk.choose)
        ? String(sk.choose)
        : '',
    proficiencySkillsFromText:
      sk.type === 'choice' && Array.isArray(sk.from) ? sk.from.join('\n') : '',
    proficiencyWeaponsType: (w.type ?? 'fixed') as ClassFormValues['proficiencyWeaponsType'],
    proficiencyWeaponsLevel:
      w.level != null && Number.isFinite(w.level) ? String(w.level) : '1',
    proficiencyWeaponsCategories: Array.isArray(w.categories) ? [...w.categories] : [],
    proficiencyWeaponsItemsText: Array.isArray(w.items) ? w.items.join('\n') : '',
    proficiencyArmorType: (ar.type ?? 'fixed') as ClassFormValues['proficiencyArmorType'],
    proficiencyArmorLevel:
      ar.level != null && Number.isFinite(ar.level) ? String(ar.level) : '1',
    proficiencyArmorCategories: Array.isArray(ar.categories) ? [...ar.categories] : [],
    proficiencyArmorItemsText: Array.isArray(ar.items) ? ar.items.join('\n') : '',
    proficiencyArmorDisallowedMaterials: Array.isArray(ar.disallowedMaterials)
      ? [...ar.disallowedMaterials]
      : [],
    proficiencyToolsType: tools?.type ? tools.type : 'fixed',
    proficiencyToolsLevel:
      tools?.level != null && Number.isFinite(tools.level) ? String(tools.level) : '1',
    proficiencyToolsItems: Array.isArray(tools?.items) ? [...tools.items] : [],

    requirementsAllowedRaceIds: races,
    requirementsAllowedAlignmentIds: aligns,
    requirementsMulticlassingJson: r.multiclassing ? formatJsonObject(r.multiclassing) : '',
    requirementsMinStatsJson: r.minStats ? formatJsonObject(r.minStats) : '',
  };
}

/**
 * Applies Phase‑7 form fields onto `requirements` merge baseline.
 */
export function assembleRequirementsFromPhase7Form(
  values: ClassFormValues,
  baseline: ClassRequirement,
): ClassRequirement {
  const raceIds = Array.isArray(values.requirementsAllowedRaceIds)
    ? values.requirementsAllowedRaceIds.filter((x) => typeof x === 'string' && x.trim())
    : [];
  const allowedRaces: ClassRequirement['allowedRaces'] =
    raceIds.length > 0 ? (raceIds as ClassRequirement['allowedRaces']) : 'all';

  const alignIds = Array.isArray(values.requirementsAllowedAlignmentIds)
    ? values.requirementsAllowedAlignmentIds.filter((x) => typeof x === 'string' && x.trim())
    : [];
  const allowedAlignments: ClassRequirement['allowedAlignments'] =
    alignIds.length > 0
      ? (alignIds as ClassRequirement['allowedAlignments'])
      : 'any';

  let mcParsed: RequirementExpr | undefined;
  let mcParseFailed = false;
  try {
    mcParsed =
      typeof values.requirementsMulticlassingJson === 'string' &&
      values.requirementsMulticlassingJson.trim().length > 0
        ? (parseJsonObject(values.requirementsMulticlassingJson) as RequirementExpr)
        : undefined;
  } catch {
    mcParsed = undefined;
    if (
      typeof values.requirementsMulticlassingJson === 'string' &&
      values.requirementsMulticlassingJson.trim().length > 0
    ) {
      mcParseFailed = true;
    }
  }

  let minParsed: RequirementExpr | undefined;
  let minParseFailed = false;
  try {
    minParsed =
      typeof values.requirementsMinStatsJson === 'string' &&
      values.requirementsMinStatsJson.trim().length > 0
        ? (parseJsonObject(values.requirementsMinStatsJson) as RequirementExpr)
        : undefined;
  } catch {
    minParsed = undefined;
    if (
      typeof values.requirementsMinStatsJson === 'string' &&
      values.requirementsMinStatsJson.trim().length > 0
    ) {
      minParseFailed = true;
    }
  }

  const next: ClassRequirement = {
    ...baseline,
    allowedRaces,
    allowedAlignments,
  };
  delete next.multiclassing;
  delete next.minStats;

  if (mcParseFailed) {
    if (baseline.multiclassing) next.multiclassing = baseline.multiclassing;
  } else if (mcParsed !== undefined && !requirementExprLooksEmpty(mcParsed)) {
    next.multiclassing = mcParsed;
  }

  if (minParseFailed) {
    if (baseline.minStats) next.minStats = baseline.minStats;
  } else if (minParsed !== undefined && !requirementExprLooksEmpty(minParsed)) {
    next.minStats = minParsed;
  }


  return next;
}

function numStrToInt(raw: unknown, fallback: number): number {
  const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/**
 * Applies Phase‑7 proficiency form fields onto a merge baseline (`original?.proficiencies`).
 */
export function assembleProficienciesFromPhase7Form(
  values: ClassFormValues,
  baseline: ClassProficiencies,
): ClassProficiencies {
  const skillType =
    values.proficiencySkillsType === 'fixed' ? 'fixed' : 'choice';

  const fromList =
    skillType === 'choice'
      ? trimLinesOrCommaList(values.proficiencySkillsFromText ?? '')
      : [];

  const skills: ClassProficiencySkillSelection =
    skillType === 'fixed'
      ? {
          type: 'fixed',
          level: numStrToInt(values.proficiencySkillsLevel, 1),
          choose: 0,
        }
      : {
          type: 'choice',
          level: numStrToInt(values.proficiencySkillsLevel, 1),
          choose: Math.max(1, numStrToInt(values.proficiencySkillsChoose, 2)),
          ...(fromList.length > 0 ? { from: fromList } : {}),
        };

  const weaponsCategories = Array.isArray(values.proficiencyWeaponsCategories)
    ? [...values.proficiencyWeaponsCategories]
    : [];
  const weaponsItems = trimLinesOrCommaList(values.proficiencyWeaponsItemsText ?? '');
  const weapons: ClassProficiencyWeapon = {
    type: values.proficiencyWeaponsType === 'choice' ? 'choice' : 'fixed',
    level: numStrToInt(values.proficiencyWeaponsLevel, 1),
    ...(weaponsCategories.length > 0 ? { categories: weaponsCategories } : {}),
    ...(weaponsItems.length > 0 ? { items: weaponsItems } : {}),
  };

  const armorCategories = Array.isArray(values.proficiencyArmorCategories)
    ? [...values.proficiencyArmorCategories]
    : [];
  const armorItems = trimLinesOrCommaList(values.proficiencyArmorItemsText ?? '');
  const materialIdsKnown = new Set(ARMOR_MATERIAL_OPTIONS.map((m) => m.id));
  const disallowedMaterialsFiltered = (
    Array.isArray(values.proficiencyArmorDisallowedMaterials)
      ? values.proficiencyArmorDisallowedMaterials
      : []
  ).filter((id): id is Material => typeof id === 'string' && materialIdsKnown.has(id as Material));

  const armor: ClassProficiencyArmor = {
    type: values.proficiencyArmorType === 'choice' ? 'choice' : 'fixed',
    level: numStrToInt(values.proficiencyArmorLevel, 1),
    ...(armorCategories.length > 0 ? { categories: armorCategories } : {}),
    ...(armorItems.length > 0 ? { items: armorItems } : {}),
    ...(disallowedMaterialsFiltered.length > 0
      ? { disallowedMaterials: disallowedMaterialsFiltered }
      : {}),
  };

  let tools:
    | { type: 'choice' | 'fixed'; level: number; items?: ToolProficiencyItem[] }
    | undefined;
  const toolIdsKnown = new Set<string>(TOOL_IDS);
  const toolItems =
    Array.isArray(values.proficiencyToolsItems) && values.proficiencyToolsItems.length > 0
      ? values.proficiencyToolsItems.filter((id): id is ToolProficiencyItem =>
          typeof id === 'string' && toolIdsKnown.has(id),
        )
      : undefined;
  if (toolItems) {
    tools = {
      type: values.proficiencyToolsType === 'choice' ? 'choice' : 'fixed',
      level: numStrToInt(values.proficiencyToolsLevel, 1),
      items: toolItems,
    };
  }

  const merged: ClassProficiencies = { ...baseline, skills, weapons, armor };
  if (tools) {
    merged.tools = tools;
  } else {
    delete merged.tools;
  }
  return merged;
}

/**
 * Validates JSON objects for RequirementExpr blobs on submit — returns UX errors or empty map.
 */
export function validateRequirementExprJsonFields(values: ClassFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const check = (
    raw: unknown,
    key: keyof ClassFormValues,
    human: string,
  ): void => {
    const s = typeof raw === 'string' ? raw.trim() : '';
    if (!s) return;
    try {
      JSON.parse(s);
      parseJsonObject(raw);
    } catch {
      errors[key as string] = `${human} must be valid JSON.`;
    }
  };
  check(values.requirementsMulticlassingJson, 'requirementsMulticlassingJson', 'Multiclassing requirements');
  check(values.requirementsMinStatsJson, 'requirementsMinStatsJson', 'Minimum stats');
  return errors;
}
