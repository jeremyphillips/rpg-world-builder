/**
 * Pure mappers for Monster form values ↔ domain types.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Monster, MonsterInput } from '@/features/content/monsters/domain/types';
import type { MonsterTrait } from '@/features/content/monsters/domain/types/monster-traits.types';
import type { MonsterArmorClass, MonsterEquipment } from '@/features/content/monsters/domain/types/monster-equipment.types';
import type { MonsterAction, MonsterNaturalAttackAction, MonsterSpecialAction } from '@/features/content/monsters/domain/types/monster-actions.types';
import type { MonsterLegendaryActions } from '@/features/content/monsters/domain/types/monster-legendary.types';
import type { Movement } from '@/features/mechanics/domain/movement';
import type { MonsterAbilityScoreMap } from '@/features/mechanics/domain/character';
import type { DieFace } from '@/shared/domain/dice';
import { DIE_FACES } from '@/shared/domain/dice';
import { toIdStringArray } from '@/features/content/shared/forms/toIdStringArray';
import {
  buildToInput,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import {
  mergePreserveExtras,
  stripRowIdsDeep,
  tagRowsWithIds,
  createRowId,
} from '@/features/content/shared/forms/assembly/mergePreserveExtras';
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
import { trimOrNull } from '@/features/content/shared/forms/parsers';
import type { CreatureSense } from '@/features/content/shared/domain/vocab/creatureSenses.types';
import {
  armorFormRowsToDomainRecord,
  armorRecordToFormRows,
  languagesFormRowsToDomain,
  senseSpecialSerialize,
  weaponFormRowsToDomainRecord,
  weaponRecordToFormRows,
  type MonsterLanguageFormRow,
  type MonsterSenseSpecialFormRow,
} from '../registry/monsterForm.phase6.assembly';
import {
  filterLegendaryInlineByActionKind,
  legendaryInlineNaturalsToFormRows,
  legendaryInlineSpecialsToFormRows,
  rebuildLegendaryActionsFromSplit,
  rebuildMechanicsMonsterActionsArray,
  stringifyLegendaryMetaEnvelope,
  parseLegendaryMetaJsonText,
  isNontrivialLegendaryBlock,
  type MonsterMechanicsActionRowWithId,
} from '../registry/monsterForm.actionPools';
import type {
  MonsterFormValues,
  MonsterTraitFormRow,
  MonsterSpecialActionFormRow,
  MonsterNaturalActionFormRow,
} from '../types/monsterForm.types';
import { parseCreatureTypeId } from '../config/monsterForm.config';
import { MONSTER_FORM_FIELDS } from '../registry/monsterForm.registry';

/** Domain-side keys that the trait form authoritatively owns (Phase 1 MVP). */
const TRAIT_OWNED_KEYS = ['name', 'description'] as const satisfies readonly (keyof MonsterTrait & string)[];

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

const MONSTER_FORM_ABILITY_IDS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

const MONSTER_ABILITY_FORM_KEY: {
  [K in (typeof MONSTER_FORM_ABILITY_IDS)[number]]: keyof MonsterFormValues;
} = {
  str: 'abilityStr',
  dex: 'abilityDex',
  con: 'abilityCon',
  int: 'abilityInt',
  wis: 'abilityWis',
  cha: 'abilityCha',
};

function parseHitDieFace(raw: string): DieFace | undefined {
  if (raw === '') return undefined;
  const n = Number(raw);
  return (DIE_FACES as readonly number[]).includes(n) ? (n as DieFace) : undefined;
}

function pickMonsterArmorClassBase(
  original: MonsterArmorClass | undefined,
): { notes?: string; override?: number } {
  if (!original || typeof original !== 'object') return {};
  const o: { notes?: string; override?: number } = {};
  if ('notes' in original && original.notes !== undefined) o.notes = original.notes;
  if ('override' in original && original.override !== undefined) o.override = original.override;
  return o;
}

function monsterArmorClassFromForm(
  values: MonsterFormValues,
  original: MonsterArmorClass | undefined,
): MonsterArmorClass | undefined {
  const kind = values.armorClassKind;
  if (kind !== 'natural' && kind !== 'equipment' && kind !== 'fixed') {
    return original;
  }
  const shared = pickMonsterArmorClassBase(original);

  if (kind === 'equipment') {
    if (original?.kind === 'equipment') return { ...original, ...shared };
    return { kind: 'equipment', ...shared };
  }

  if (kind === 'natural') {
    const offset = numOrUndefined(values.armorClassNaturalOffset);
    return {
      kind: 'natural',
      ...shared,
      ...(offset !== undefined ? { offset } : {}),
    };
  }

  const value = numOrUndefined(values.armorClassFixedValue);
  if (value === undefined) {
    return original?.kind === 'fixed' ? original : undefined;
  }
  return { kind: 'fixed', value, ...shared };
}

function monsterAbilitiesFromForm(
  values: MonsterFormValues,
  original: MonsterAbilityScoreMap | undefined,
): MonsterAbilityScoreMap | undefined {
  const merged: MonsterAbilityScoreMap = { ...(original ?? {}) };
  for (const id of MONSTER_FORM_ABILITY_IDS) {
    const raw = values[MONSTER_ABILITY_FORM_KEY[id]];
    if (raw === '' || raw == null) {
      delete merged[id];
    } else {
      const n = numOrUndefined(raw);
      if (n !== undefined) merged[id] = n as MonsterAbilityScoreMap[typeof id];
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function monsterMovementFromForm(values: MonsterFormValues): Movement | undefined {
  const movement: Movement = {};
  const g = numOrUndefined(values.movementGround);
  if (g !== undefined) movement.ground = g;
  const swim = numOrUndefined(values.movementSwim);
  if (swim !== undefined) movement.swim = swim;
  const fly = numOrUndefined(values.movementFly);
  if (fly !== undefined) movement.fly = fly;
  const climb = numOrUndefined(values.movementClimb);
  if (climb !== undefined) movement.climb = climb;
  const burrow = numOrUndefined(values.movementBurrow);
  if (burrow !== undefined) movement.burrow = burrow;
  return Object.keys(movement).length > 0 ? movement : undefined;
}

const monsterMechanicsSpecialRowsToFormValues = (
  actions: ReadonlyArray<MonsterSpecialAction & { __rowId?: string }> | undefined,
): MonsterSpecialActionFormRow[] => {
  if (!actions || actions.length === 0) return [];
  const tagged = tagRowsWithIds(actions as readonly Record<string, unknown>[]);
  return tagged.map((row, i) => {
    const sourceRow = actions[i];
    const fallbackId = (row as { __rowId: string }).__rowId;
    const id = sourceRow.__rowId ?? fallbackId;
    return {
      __rowId: id,
      name: sourceRow.name ?? '',
      description: sourceRow.description ?? '',
    };
  });
};

const monsterMechanicsNaturalRowsToFormValues = (
  actions: ReadonlyArray<MonsterNaturalAttackAction & { __rowId?: string }> | undefined,
): MonsterNaturalActionFormRow[] => {
  if (!actions || actions.length === 0) return [];
  const tagged = tagRowsWithIds(actions as readonly Record<string, unknown>[]);
  return tagged.map((row, i) => {
    const sourceRow = actions[i];
    const fallbackId = (row as { __rowId: string }).__rowId;
    const id = sourceRow.__rowId ?? fallbackId;
    return {
      __rowId: id,
      name: sourceRow.name ?? sourceRow.attackType ?? '',
    };
  });
};

/**
 * Form-side projection of a domain trait. Each row carries an opaque
 * `__rowId` so save-time `mergePreserveExtras` can round-trip domain extras
 * (`trigger`, `effects`, `uses`, `resolution.caveats`, …) the form does not
 * author yet.
 *
 * If a source row already carries `__rowId` (e.g. via {@link tagMonsterForEditing}),
 * that id is reused so the merge at save time finds the same source row.
 * Otherwise a fresh id is generated.
 */
const monsterTraitsToFormRows = (
  traits: ReadonlyArray<MonsterTrait & { __rowId?: string }> | undefined,
): MonsterTraitFormRow[] => {
  if (!traits || traits.length === 0) return [];
  const tagged = tagRowsWithIds(traits as readonly Record<string, unknown>[]);
  return tagged.map((row, i) => {
    const sourceRow = traits[i];
    const fallbackId = (row as { __rowId: string }).__rowId;
    const id = sourceRow.__rowId ?? fallbackId;
    return {
      __rowId: id,
      name: sourceRow.name ?? '',
      description: sourceRow.description ?? '',
    };
  });
};

const monsterSenseSpecialToFormRows = (
  rows: ReadonlyArray<CreatureSense & { __rowId?: string }> | undefined,
): MonsterSenseSpecialFormRow[] => {
  if (!rows || rows.length === 0) return [];
  const tagged = tagRowsWithIds(rows as readonly Record<string, unknown>[]);
  return tagged.map((row, i) => {
    const sourceRow = rows[i];
    const fallbackId = (row as { __rowId: string }).__rowId;
    const id = sourceRow.__rowId ?? fallbackId;
    return {
      __rowId: id,
      type:
        sourceRow.type && String(sourceRow.type).length > 0 ? String(sourceRow.type) : 'darkvision',
      range: sourceRow.range != null && Number.isFinite(Number(sourceRow.range)) ? String(sourceRow.range) : '',
    };
  });
};

const monsterLanguagesToFormRows = (
  langs: ReadonlyArray<{ id: string; speaks?: boolean; __rowId?: string }> | undefined,
): MonsterLanguageFormRow[] => {
  if (!langs || langs.length === 0) return [];
  const tagged = tagRowsWithIds(langs as readonly Record<string, unknown>[]);
  return tagged.map((row, i) => {
    const sourceRow = langs[i];
    const fallbackId = (row as { __rowId: string }).__rowId;
    const id = sourceRow.__rowId ?? fallbackId;
    return {
      __rowId: id,
      id: sourceRow.id ?? '',
      speaks: Boolean(sourceRow.speaks),
    };
  });
};

/**
 * Tag a Monster's structured-group rows with transient `__rowId`s for editing.
 *
 * The route memoizes this once when the entry loads and uses the same instance
 * for both `monsterToFormValues` (load) and `toMonsterInput` (save), so the
 * form-row ids resolve to the same source rows when `mergePreserveExtras` runs.
 *
 * Callers should re-run this whenever the loaded entry changes; subsequent
 * calls produce new ids and form values must be reset together with the
 * re-tagged source.
 */
export function tagMonsterForEditing(monster: Monster): Monster {
  let next: Monster = monster;
  let changed = false;

  if (Array.isArray(monster.languages) && monster.languages.length > 0) {
    next = {
      ...next,
      languages: tagRowsWithIds(monster.languages as readonly Record<string, unknown>[]) as Monster['languages'],
    };
    changed = true;
  }

  const mechanics = next.mechanics;
  if (!mechanics) {
    return changed ? next : monster;
  }

  const mechanicsNext = { ...mechanics };
  let mechanicsChanged = false;

  if (Array.isArray(mechanics.traits) && mechanics.traits.length > 0) {
    mechanicsNext.traits = tagRowsWithIds(mechanics.traits as readonly Record<string, unknown>[]) as MonsterTrait[];
    mechanicsChanged = true;
  }

  if (Array.isArray(mechanics.actions) && mechanics.actions.length > 0) {
    mechanicsNext.actions = tagRowsWithIds(
      mechanics.actions as readonly Record<string, unknown>[],
    ) as MonsterAction[];
    mechanicsChanged = true;
  }

  if (Array.isArray(mechanics.bonusActions) && mechanics.bonusActions.length > 0) {
    mechanicsNext.bonusActions = tagRowsWithIds(
      mechanics.bonusActions as readonly Record<string, unknown>[],
    ) as MonsterAction[];
    mechanicsChanged = true;
  }

  const leg = mechanics.legendaryActions;
  if (leg?.actions?.length) {
    mechanicsNext.legendaryActions = {
      ...leg,
      actions: tagRowsWithIds(
        leg.actions as readonly Record<string, unknown>[],
      ) as typeof leg.actions,
    };
    mechanicsChanged = true;
  }

  if (Array.isArray(mechanics.senses?.special) && mechanics.senses.special.length > 0) {
    mechanicsNext.senses = {
      ...mechanics.senses!,
      special: tagRowsWithIds(
        mechanics.senses.special as readonly Record<string, unknown>[],
      ) as CreatureSense[],
    };
    mechanicsChanged = true;
  }

  if (mechanics.equipment?.weapons && Object.keys(mechanics.equipment.weapons).length > 0) {
    mechanicsNext.equipment = {
      ...(mechanicsNext.equipment ?? mechanics.equipment),
      weapons: Object.fromEntries(
        Object.entries(mechanics.equipment.weapons).map(([k, w]) => {
          const wid = (w as { __rowId?: string }).__rowId;
          return [k, { ...w, __rowId: wid && wid.length > 0 ? wid : createRowId() }];
        }),
      ),
    };
    mechanicsChanged = true;
  }

  if (mechanics.equipment?.armor && Object.keys(mechanics.equipment.armor).length > 0) {
    const baseEq = mechanicsNext.equipment ?? mechanics.equipment;
    mechanicsNext.equipment = {
      ...baseEq,
      armor: Object.fromEntries(
        Object.entries(mechanics.equipment.armor).map(([k, a]) => {
          const aid = (a as { __rowId?: string }).__rowId;
          return [k, { ...a, __rowId: aid && aid.length > 0 ? aid : createRowId() }];
        }),
      ),
    };
    mechanicsChanged = true;
  }

  if (!mechanicsChanged) {
    return changed ? next : monster;
  }

  return { ...next, mechanics: mechanicsNext };
}

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
    descriptionShort: monster.description?.short ?? '',
    descriptionLong: monster.description?.long ?? '',
    languageRows: monsterLanguagesToFormRows(monster.languages),
    hitPointsCount: m?.hitPoints?.count != null ? String(m.hitPoints.count) : '',
    hitPointsDie:
      m?.hitPoints?.die != null ? String(m.hitPoints.die) : defaultFormValues.hitPointsDie ?? '8',
    hitPointsModifier: numToStr(m?.hitPoints?.modifier),
    armorClassKind: (m?.armorClass?.kind ?? 'natural') as MonsterFormValues['armorClassKind'],
    armorClassNaturalOffset:
      m?.armorClass?.kind === 'natural' ? numToStr(m.armorClass.offset) : '',
    armorClassFixedValue: m?.armorClass?.kind === 'fixed' ? numToStr(m.armorClass.value) : '',
    movementGround: numToStr(m?.movement?.ground),
    movementSwim: numToStr(m?.movement?.swim),
    movementFly: numToStr(m?.movement?.fly),
    movementClimb: numToStr(m?.movement?.climb),
    movementBurrow: numToStr(m?.movement?.burrow),
    specialActions: monsterMechanicsSpecialRowsToFormValues(
      (m?.actions ?? []).filter((a): a is MonsterSpecialAction & { __rowId?: string } => a.kind === 'special'),
    ),
    naturalActions: monsterMechanicsNaturalRowsToFormValues(
      (m?.actions ?? []).filter((a): a is MonsterNaturalAttackAction & { __rowId?: string } => a.kind === 'natural'),
    ),
    bonusSpecialActions: monsterMechanicsSpecialRowsToFormValues(
      (m?.bonusActions ?? []).filter((a): a is MonsterSpecialAction & { __rowId?: string } =>
        a.kind === 'special'),
    ),
    bonusNaturalActions: monsterMechanicsNaturalRowsToFormValues(
      (m?.bonusActions ?? []).filter((a): a is MonsterNaturalAttackAction & { __rowId?: string } =>
        a.kind === 'natural'),
    ),
    legendaryActionsMeta: stringifyLegendaryMetaEnvelope(m?.legendaryActions),
    legendarySpecialActions: legendaryInlineSpecialsToFormRows(
      filterLegendaryInlineByActionKind(m?.legendaryActions, 'special'),
    ),
    legendaryNaturalActions: legendaryInlineNaturalsToFormRows(
      filterLegendaryInlineByActionKind(m?.legendaryActions, 'natural'),
    ),
    traits: monsterTraitsToFormRows(m?.traits),
    abilityStr: numToStr(m?.abilities?.str),
    abilityDex: numToStr(m?.abilities?.dex),
    abilityCon: numToStr(m?.abilities?.con),
    abilityInt: numToStr(m?.abilities?.int),
    abilityWis: numToStr(m?.abilities?.wis),
    abilityCha: numToStr(m?.abilities?.cha),
    sensesPassivePerception: numToStr(m?.senses?.passivePerception),
    senseSpecialRows: monsterSenseSpecialToFormRows(m?.senses?.special),
    proficiencies: formatJson(m?.proficiencies),
    proficiencyBonus: numToStr(m?.proficiencyBonus),
    equipmentWeaponRows: weaponRecordToFormRows(m?.equipment?.weapons),
    equipmentArmorRows: armorRecordToFormRows(m?.equipment?.armor),
    immunities: toIdStringArray(m?.immunities),
    vulnerabilities: toIdStringArray(m?.vulnerabilities),
    alignment: l?.alignment != null ? String(l.alignment) : '',
    challengeRating: formatJson(l?.challengeRating),
    xpValue: formatJson(l?.xpValue),
  };
};

/**
 * Converts form values to MonsterInput for create/update.
 *
 * `original` is threaded through from the loaded domain entry; it is required
 * to preserve per-row extras for structured groups (Phase 1: traits) since the
 * form does not author every domain field yet. New entries pass `undefined`.
 */
export const toMonsterInput = (
  values: MonsterFormValues,
  original?: Monster | undefined,
): MonsterInput => {
  const base = toInput(values) as Record<string, unknown>;
  const mechanics: Record<string, unknown> = {};
  const lore: Record<string, unknown> = {};

  const hpCount = numOrUndefined(values.hitPointsCount);
  const hpDie = parseHitDieFace(values.hitPointsDie);
  if (hpCount !== undefined && hpDie !== undefined) {
    const hpMod = numOrUndefined(values.hitPointsModifier);
    mechanics.hitPoints = {
      count: hpCount,
      die: hpDie,
      ...(hpMod !== undefined ? { modifier: hpMod } : {}),
    };
  }
  const acBuilt = monsterArmorClassFromForm(values, original?.mechanics?.armorClass);
  if (acBuilt !== undefined) mechanics.armorClass = acBuilt;
  const movBuilt = monsterMovementFromForm(values);
  if (movBuilt !== undefined) mechanics.movement = movBuilt;

  const origActions = original?.mechanics?.actions as MonsterMechanicsActionRowWithId[] | undefined;
  const mergedActs = rebuildMechanicsMonsterActionsArray(
    'natural',
    values.naturalActions,
    rebuildMechanicsMonsterActionsArray('special', values.specialActions, origActions ?? []),
  );
  if (mergedActs.length > 0) {
    mechanics.actions = stripRowIdsDeep(mergedActs) as NonNullable<
      MonsterInput['mechanics']
    >['actions'];
  }

  const origBonus = original?.mechanics?.bonusActions as MonsterMechanicsActionRowWithId[] | undefined;
  const mergedBonusActs = rebuildMechanicsMonsterActionsArray(
    'natural',
    values.bonusNaturalActions,
    rebuildMechanicsMonsterActionsArray('special', values.bonusSpecialActions, origBonus ?? []),
  );
  if (mergedBonusActs.length > 0) {
    mechanics.bonusActions = stripRowIdsDeep(mergedBonusActs) as NonNullable<
      MonsterInput['mechanics']
    >['bonusActions'];
  }

  const seededLegendBase: MonsterLegendaryActions =
    original?.mechanics?.legendaryActions != null
      ? { ...original.mechanics.legendaryActions }
      : { uses: 0, actions: [] };

  let legendaryDraft: MonsterLegendaryActions = {
    ...seededLegendBase,
    ...parseLegendaryMetaJsonText(values.legendaryActionsMeta),
    actions: original?.mechanics?.legendaryActions?.actions ?? [],
  };

  legendaryDraft = rebuildLegendaryActionsFromSplit(
    'special',
    values.legendarySpecialActions,
    legendaryDraft,
  );
  legendaryDraft = rebuildLegendaryActionsFromSplit(
    'natural',
    values.legendaryNaturalActions,
    legendaryDraft,
  );

  const legendaryStripReady = stripRowIdsDeep(legendaryDraft) as MonsterLegendaryActions;
  if (isNontrivialLegendaryBlock(legendaryStripReady)) {
    mechanics.legendaryActions = legendaryStripReady;
  }

  if (Array.isArray(values.traits)) {
    mechanics.traits = mergePreserveExtras<MonsterTrait>(
      values.traits as ReadonlyArray<MonsterTraitFormRow & Partial<MonsterTrait>>,
      original?.mechanics?.traits as
        | ReadonlyArray<MonsterTrait & { __rowId?: string }>
        | undefined,
      TRAIT_OWNED_KEYS,
    );
  }
  const abMerged = monsterAbilitiesFromForm(values, original?.mechanics?.abilities);
  if (abMerged !== undefined) mechanics.abilities = abMerged;

  const hadSensesDomain = original?.mechanics?.senses != null;
  const passivePerception = numOrUndefined(values.sensesPassivePerception);
  const senseFormRows = values.senseSpecialRows ?? [];
  if (passivePerception !== undefined || senseFormRows.length > 0 || hadSensesDomain) {
    let specialOut: CreatureSense[] | undefined;
    if (senseFormRows.length > 0) {
      const mergedSens = senseSpecialSerialize(senseFormRows, original?.mechanics?.senses?.special);
      specialOut = stripRowIdsDeep(mergedSens) as CreatureSense[];
    }
    if (passivePerception !== undefined || (specialOut && specialOut.length)) {
      mechanics.senses = {
        ...(passivePerception !== undefined ? { passivePerception } : {}),
        ...(specialOut && specialOut.length ? { special: specialOut } : {}),
      };
    } else if (hadSensesDomain) {
      mechanics.senses = undefined;
    }
  }

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

  const weaponRows = values.equipmentWeaponRows ?? [];
  const armorRows = values.equipmentArmorRows ?? [];
  const hadEquipmentDomain = original?.mechanics?.equipment != null;
  if (weaponRows.length > 0 || armorRows.length > 0 || hadEquipmentDomain) {
    const nextEquipment: MonsterEquipment = { ...(original?.mechanics?.equipment ?? {}) };
    if (weaponRows.length > 0) {
      const w = weaponFormRowsToDomainRecord(weaponRows, original?.mechanics?.equipment?.weapons);
      if (w && Object.keys(w).length > 0) {
        nextEquipment.weapons = stripRowIdsDeep(w) as NonNullable<MonsterEquipment['weapons']>;
      } else {
        delete nextEquipment.weapons;
      }
    } else {
      delete nextEquipment.weapons;
    }
    if (armorRows.length > 0) {
      const a = armorFormRowsToDomainRecord(armorRows, original?.mechanics?.equipment?.armor);
      if (a && Object.keys(a).length > 0) {
        nextEquipment.armor = stripRowIdsDeep(a) as NonNullable<MonsterEquipment['armor']>;
      } else {
        delete nextEquipment.armor;
      }
    } else {
      delete nextEquipment.armor;
    }
    if (nextEquipment.weapons || nextEquipment.armor) {
      mechanics.equipment = nextEquipment;
    } else if (hadEquipmentDomain) {
      mechanics.equipment = undefined;
    }
  }
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

  const shortDesc = trimOrNull(values.descriptionShort);
  const longDesc = trimOrNull(values.descriptionLong);
  let description: MonsterInput['description'];
  if (shortDesc || longDesc) {
    description = {
      ...(shortDesc ? { short: shortDesc } : {}),
      ...(longDesc ? { long: longDesc } : {}),
    };
  } else if (original?.description) {
    description = undefined;
  } else {
    description = undefined;
  }

  const languages = Array.isArray(values.languageRows)
    ? languagesFormRowsToDomain(values.languageRows, original?.languages)
    : undefined;

  return {
    ...base,
    name: values.name,
    type: values.type || undefined,
    sizeCategory: values.sizeCategory || undefined,
    subtype: safeSubtype,
    description,
    languages,
    mechanics: Object.keys(mechanics).length > 0 ? (mechanics as MonsterInput['mechanics']) : undefined,
    lore: Object.keys(lore).length > 0 ? (lore as MonsterInput['lore']) : undefined,
  } as MonsterInput;
};
