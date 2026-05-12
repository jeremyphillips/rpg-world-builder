/**
 * Structured class proficiencies + requirements (Phase 7).
 */

import type { CampaignCatalog } from '@/features/mechanics/domain/rulesets/system/catalog';
import type { CharacterClass } from '@/features/content/classes/domain/types';
import { when } from '@/ui/patterns';
import { when } from '@/ui/patterns';
import type { FieldSpec } from '@/features/content/shared/forms/registry';
import type { ClassFormValues, ClassInput } from '../types/classForm.types';
import {
  armorCategoryPickerOptionsStatic,
  buildRacePickerOptionsFromCatalog,
  materialPickerOptionsStatic,
  toolPickerOptionsStatic,
  pickerOptionsFromPairs,
  weaponCategoryPickerOptionsStatic,
  buildAlignmentPickerOptions,
} from '../mappers/classForm.phase7.assembly';

const CLASS_PROF_GROUP = {
  id: 'class-proficiencies',
  label: 'Proficiencies',
  direction: 'column' as const,
};

const CLASS_REQ_GROUP = {
  id: 'class-requirements',
  label: 'Requirements',
  direction: 'column' as const,
};

const SAMPLE_MC_EXPR = JSON.stringify(
  {
    note: 'Requires Strength or Dexterity of 13+',
    anyOf: [{ all: [{ ability: 'str', min: 13 }] }, { all: [{ ability: 'dex', min: 13 }] }],
  },
  null,
  2,
);

const SAMPLE_MINSTATS_EXPR = JSON.stringify(
  { note: 'Example', anyOf: [{ all: [{ ability: 'cha', min: 13 }] }] },
  null,
  2,
);

function linesFromUnknownArray(domainValue: unknown): string {
  if (!Array.isArray(domainValue)) return '';
  return (domainValue as unknown[])
    .map((x) => (typeof x === 'string' ? x.trim() : String(x ?? '')))
    .filter(Boolean)
    .join('\n');
}

function serializeStringArrayLines(uiValue: unknown, _currentDomainValue: unknown): string[] | undefined {
  const s = typeof uiValue === 'string' ? uiValue : '';
  const parts = s
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

/** Phase 7 field specs — flattened scalars wired to dotted domain paths / patchBindings. */
export function getClassProficiencyPhase7Specs(_catalog: CampaignCatalog): FieldSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>[] {
  return [
    {
      name: 'proficiencySkillsType',
      label: 'Skill training',
      kind: 'select',
      path: 'proficiencies.skills.type',
      group: CLASS_PROF_GROUP,
      options: [
        { value: 'choice', label: 'Player choice' },
        { value: 'fixed', label: 'Fixed list' },
      ],
      placeholder: '',
      defaultValue: 'choice' as ClassFormValues['proficiencySkillsType'],
      patchBinding: {
        domainPath: 'proficiencies.skills.type',
        parse: (v: unknown) => (v === 'fixed' ? 'fixed' : 'choice') as ClassFormValues['proficiencySkillsType'],
        serialize: (uiValue: unknown) => ((uiValue === 'fixed' ? 'fixed' : 'choice')),
      },
    },
    {
      name: 'proficiencySkillsLevel',
      label: 'Skill proficiencies gained at level',
      kind: 'numberText',
      path: 'proficiencies.skills.level',
      group: CLASS_PROF_GROUP,
      helperText: 'Usually 1 for class entry.',
      defaultValue: '1' as ClassFormValues['proficiencySkillsLevel'],
      patchBinding: {
        domainPath: 'proficiencies.skills.level',
        parse: (v: unknown) => (v == null ? '' : String(v)) as ClassFormValues['proficiencySkillsLevel'],
        serialize: (uiValue: unknown, currentDomainValue: unknown) => {
          if (uiValue === '' || uiValue == null) return currentDomainValue;
          const n = Number(uiValue);
          return Number.isFinite(n) ? n : currentDomainValue;
        },
      },
    },
    {
      name: 'proficiencySkillsChoose',
      label: 'Choose how many skills',
      kind: 'numberText',
      path: 'proficiencies.skills.choose',
      group: CLASS_PROF_GROUP,
      helperText: 'Only when skill training is “Player choice”.',
      visibleWhen: when.eq('proficiencySkillsType', 'choice'),
      defaultValue: '2' as ClassFormValues['proficiencySkillsChoose'],
      patchBinding: {
        domainPath: 'proficiencies.skills.choose',
        parse: (v: unknown) => (v == null ? '' : String(v)) as ClassFormValues['proficiencySkillsChoose'],
        serialize: (uiValue: unknown, currentDomainValue: unknown) => {
          if (uiValue === '' || uiValue == null) return undefined;
          const n = Number(uiValue);
          return Number.isFinite(n) ? n : currentDomainValue;
        },
      },
    },
    {
      name: 'proficiencySkillsFromText',
      label: 'Suggested / fixed skill picks',
      kind: 'textarea',
      group: CLASS_PROF_GROUP,
      helperText:
        'One skill id per line or comma-separated. Reference your ruleset\'s skill catalog (e.g. athletics, stealth). Used when skill training is “Player choice”.',
      minRows: 2,
      maxRows: 8,
      visibleWhen: when.eq('proficiencySkillsType', 'choice'),
      placeholder: `athletics\nperception`,
      defaultValue: '' as ClassFormValues['proficiencySkillsFromText'],
      patchBinding: {
        domainPath: 'proficiencies.skills.from',
        parse: (v: unknown) => linesFromUnknownArray(v) as ClassFormValues['proficiencySkillsFromText'],
        serialize: (uiValue: unknown, cur: unknown) =>
          serializeStringArrayLines(uiValue, cur) as unknown,
      },
    },
    {
      name: 'proficiencyWeaponsType',
      label: 'Weapon proficiency mode',
      kind: 'select',
      path: 'proficiencies.weapons.type',
      group: CLASS_PROF_GROUP,
      options: [
        { value: 'fixed', label: 'Fixed at class entry' },
        { value: 'choice', label: 'Player choice' },
      ],
      defaultValue: 'fixed' as ClassFormValues['proficiencyWeaponsType'],
      patchBinding: {
        domainPath: 'proficiencies.weapons.type',
        parse: (v: unknown) =>
          (v === 'choice' ? 'choice' : 'fixed') as ClassFormValues['proficiencyWeaponsType'],
        serialize: (uiValue: unknown) => ((uiValue === 'choice' ? 'choice' : 'fixed')),
      },
    },
    {
      name: 'proficiencyWeaponsLevel',
      label: 'Weapon proficiencies gained at level',
      kind: 'numberText',
      path: 'proficiencies.weapons.level',
      group: CLASS_PROF_GROUP,
      defaultValue: '1' as ClassFormValues['proficiencyWeaponsLevel'],
      patchBinding: {
        domainPath: 'proficiencies.weapons.level',
        parse: (v: unknown) => (v == null ? '' : String(v)),
        serialize: (uiValue: unknown, currentDomainValue: unknown) => {
          if (uiValue === '' || uiValue == null) return currentDomainValue;
          const n = Number(uiValue);
          return Number.isFinite(n) ? n : currentDomainValue;
        },
      },
    },
    {
      name: 'proficiencyWeaponsCategories',
      label: 'Weapon categories',
      kind: 'optionPicker',
      path: 'proficiencies.weapons.categories',
      group: CLASS_PROF_GROUP,
      pickerOptions: weaponCategoryPickerOptionsStatic(),
      renderSelectedAs: 'chip',
      emptyMessage: 'Search categories',
      defaultValue: [] as ClassFormValues['proficiencyWeaponsCategories'],
      patchBinding: {
        domainPath: 'proficiencies.weapons.categories',
        parse: (v: unknown): ClassFormValues['proficiencyWeaponsCategories'] => {
          const arr = Array.isArray(v) ? [...v] : [];
          return arr.length ? (arr as ClassFormValues['proficiencyWeaponsCategories']) : [];
        },
        serialize: (uiValue: unknown, _cur: unknown) => {
          const arr = Array.isArray(uiValue) ? [...uiValue] : [];
          return arr.filter((x) => typeof x === 'string').length > 0
            ? arr
            : undefined;
        },
      },
    },
    {
      name: 'proficiencyWeaponsItemsText',
      label: 'Specific weapon ids',
      kind: 'textarea',
      group: CLASS_PROF_GROUP,
      helperText: 'Rarely needed — one id per line or comma-separated weapon content ids.',
      defaultValue: '' as ClassFormValues['proficiencyWeaponsItemsText'],
      patchBinding: {
        domainPath: 'proficiencies.weapons.items',
        parse: (v: unknown) => linesFromUnknownArray(v),
        serialize: (uiValue: unknown, cur: unknown) =>
          serializeStringArrayLines(uiValue, cur),
      },
    },
    {
      name: 'proficiencyArmorType',
      label: 'Armor proficiency mode',
      kind: 'select',
      path: 'proficiencies.armor.type',
      group: CLASS_PROF_GROUP,
      options: [
        { value: 'fixed', label: 'Fixed at class entry' },
        { value: 'choice', label: 'Player choice' },
      ],
      defaultValue: 'fixed' as ClassFormValues['proficiencyArmorType'],
      patchBinding: {
        domainPath: 'proficiencies.armor.type',
        parse: (v: unknown) => (v === 'choice' ? 'choice' : 'fixed'),
        serialize: (uiValue: unknown) => (uiValue === 'choice' ? 'choice' : 'fixed'),
      },
    },
    {
      name: 'proficiencyArmorLevel',
      label: 'Armor proficiencies gained at level',
      kind: 'numberText',
      path: 'proficiencies.armor.level',
      group: CLASS_PROF_GROUP,
      defaultValue: '1' as ClassFormValues['proficiencyArmorLevel'],
      patchBinding: {
        domainPath: 'proficiencies.armor.level',
        parse: (v: unknown) => (v == null ? '' : String(v)),
        serialize: (uiValue: unknown, currentDomainValue: unknown) => {
          if (uiValue === '' || uiValue == null) return currentDomainValue;
          const n = Number(uiValue);
          return Number.isFinite(n) ? n : currentDomainValue;
        },
      },
    },
    {
      name: 'proficiencyArmorCategories',
      label: 'Armor categories',
      kind: 'optionPicker',
      path: 'proficiencies.armor.categories',
      group: CLASS_PROF_GROUP,
      pickerOptions: armorCategoryPickerOptionsStatic(),
      renderSelectedAs: 'chip',
      defaultValue: [] as ClassFormValues['proficiencyArmorCategories'],
      patchBinding: {
        domainPath: 'proficiencies.armor.categories',
        parse: (v: unknown): ClassFormValues['proficiencyArmorCategories'] => {
          const arr = Array.isArray(v) ? [...v] : [];
          return arr.length ? (arr as ClassFormValues['proficiencyArmorCategories']) : [];
        },
        serialize: (uiValue: unknown) => {
          const arr = Array.isArray(uiValue) ? [...uiValue] : [];
          return arr.filter((x) => typeof x === 'string').length > 0
            ? arr
            : undefined;
        },
      },
    },
    {
      name: 'proficiencyArmorItemsText',
      label: 'Specific armor / shield ids',
      kind: 'textarea',
      group: CLASS_PROF_GROUP,
      defaultValue: '' as ClassFormValues['proficiencyArmorItemsText'],
      patchBinding: {
        domainPath: 'proficiencies.armor.items',
        parse: (v: unknown) => linesFromUnknownArray(v),
        serialize: (uiValue: unknown, cur: unknown) =>
          serializeStringArrayLines(uiValue, cur),
      },
    },
    {
      name: 'proficiencyArmorDisallowedMaterials',
      label: 'Disallowed armor materials',
      kind: 'optionPicker',
      path: 'proficiencies.armor.disallowedMaterials',
      group: CLASS_PROF_GROUP,
      pickerOptions: materialPickerOptionsStatic(),
      renderSelectedAs: 'chip',
      helperText: 'Optional — restricts armor materials despite broad category picks.',
      defaultValue: [] as ClassFormValues['proficiencyArmorDisallowedMaterials'],
      patchBinding: {
        domainPath: 'proficiencies.armor.disallowedMaterials',
        parse: (v: unknown): ClassFormValues['proficiencyArmorDisallowedMaterials'] => {
          const arr = Array.isArray(v) ? [...v] : [];
          return arr.length ? (arr as ClassFormValues['proficiencyArmorDisallowedMaterials']) : [];
        },
        serialize: (uiValue: unknown) => {
          const arr = Array.isArray(uiValue) ? [...uiValue] : [];
          return arr.filter((x) => typeof x === 'string').length > 0
            ? arr
            : undefined;
        },
      },
    },
    {
      name: 'proficiencyToolsType',
      label: 'Tool proficiency mode',
      kind: 'select',
      path: 'proficiencies.tools.type',
      group: CLASS_PROF_GROUP,
      helperText: 'Leave tool picks empty below to omit tool proficiencies.',
      options: [
        { value: 'fixed', label: 'Fixed at class entry' },
        { value: 'choice', label: 'Player choice' },
      ],
      defaultValue: 'fixed' as ClassFormValues['proficiencyToolsType'],
      patchBinding: {
        domainPath: 'proficiencies.tools.type',
        parse: (v: unknown) => (v === 'choice' ? 'choice' : 'fixed'),
        serialize: (uiValue: unknown) => (uiValue === 'choice' ? 'choice' : 'fixed'),
      },
    },
    {
      name: 'proficiencyToolsLevel',
      label: 'Tool proficiencies gained at level',
      kind: 'numberText',
      path: 'proficiencies.tools.level',
      group: CLASS_PROF_GROUP,
      defaultValue: '1' as ClassFormValues['proficiencyToolsLevel'],
      patchBinding: {
        domainPath: 'proficiencies.tools.level',
        parse: (v: unknown) => (v == null ? '' : String(v)),
        serialize: (uiValue: unknown, currentDomainValue: unknown) => {
          if (uiValue === '' || uiValue == null) return currentDomainValue;
          const n = Number(uiValue);
          return Number.isFinite(n) ? n : currentDomainValue;
        },
      },
    },
    {
      name: 'proficiencyToolsItems',
      label: 'Tool picks',
      kind: 'optionPicker',
      path: 'proficiencies.tools.items',
      group: CLASS_PROF_GROUP,
      pickerOptions: toolPickerOptionsStatic(),
      renderSelectedAs: 'chip',
      defaultValue: [] as ClassFormValues['proficiencyToolsItems'],
      patchBinding: {
        domainPath: 'proficiencies.tools.items',
        parse: (v: unknown) => (Array.isArray(v) ? [...v] : []) as ClassFormValues['proficiencyToolsItems'],
        serialize: (uiValue: unknown) => {
          const arr = Array.isArray(uiValue) ? [...uiValue] : [];
          return arr.filter((x) => typeof x === 'string').length > 0 ? arr : undefined;
        },
      },
    },
  ];
}

export function getClassRequirementPhase7Specs(catalog: CampaignCatalog): FieldSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>[] {
  const racePickerOpts = buildRacePickerOptionsFromCatalog(catalog);
  const alignmentPairs = pickerOptionsFromPairs(buildAlignmentPickerOptions());

  return [
    {
      name: 'requirementsAllowedRaceIds',
      label: 'Allowed races',
      kind: 'optionPicker',
      path: 'requirements.allowedRaces',
      group: CLASS_REQ_GROUP,
      pickerOptions: racePickerOpts,
      renderSelectedAs: 'chip',
      helperText: 'Leave empty to allow every race (“all”).',
      defaultValue: [] as ClassFormValues['requirementsAllowedRaceIds'],
      patchBinding: {
        domainPath: 'requirements.allowedRaces',
        parse: (v: unknown): ClassFormValues['requirementsAllowedRaceIds'] => {
          if (v === 'all') return [];
          return Array.isArray(v) ? ([...v] as ClassFormValues['requirementsAllowedRaceIds']) : [];
        },
        serialize: (
          uiValue: unknown,
        ): CharacterClass['requirements']['allowedRaces'] => {
          const ids = Array.isArray(uiValue) ? uiValue.filter((x) => typeof x === 'string' && x.trim()) : [];
          return ids.length > 0 ? (ids as CharacterClass['requirements']['allowedRaces']) : 'all';
        },
      },
    },
    {
      name: 'requirementsAllowedAlignmentIds',
      label: 'Allowed alignments',
      kind: 'optionPicker',
      path: 'requirements.allowedAlignments',
      group: CLASS_REQ_GROUP,
      pickerOptions: alignmentPairs,
      renderSelectedAs: 'chip',
      helperText: 'Leave empty for any alignment.',
      defaultValue: [] as ClassFormValues['requirementsAllowedAlignmentIds'],
      patchBinding: {
        domainPath: 'requirements.allowedAlignments',
        parse: (v: unknown): ClassFormValues['requirementsAllowedAlignmentIds'] => {
          if (v === 'any') return [];
          return Array.isArray(v)
            ? ([...v] as ClassFormValues['requirementsAllowedAlignmentIds'])
            : [];
        },
        serialize: (
          uiValue: unknown,
        ): CharacterClass['requirements']['allowedAlignments'] => {
          const ids = Array.isArray(uiValue) ? uiValue.filter((x) => typeof x === 'string' && x.trim()) : [];
          return ids.length > 0 ? (ids as CharacterClass['requirements']['allowedAlignments']) : 'any';
        },
      },
    },
    {
      name: 'requirementsMulticlassingJson',
      label: 'Multiclass prerequisites (JSON)',
      kind: 'json',
      path: 'requirements.multiclassing',
      group: CLASS_REQ_GROUP,
      placeholder: SAMPLE_MC_EXPR,
      helperText:
        '`RequirementExpr` — `note` plus `anyOf` branches ({ all: AbilityRequirement[] }). Leave empty when unused.',
      minRows: 3,
      maxRows: 12,
      defaultValue: '' as ClassFormValues['requirementsMulticlassingJson'],
    },
    {
      name: 'requirementsMinStatsJson',
      label: 'Minimum stats (JSON)',
      kind: 'json',
      path: 'requirements.minStats',
      group: CLASS_REQ_GROUP,
      placeholder: SAMPLE_MINSTATS_EXPR,
      helperText: 'Optional gated stats — stored as another `RequirementExpr`.',
      minRows: 2,
      maxRows: 10,
      defaultValue: '' as ClassFormValues['requirementsMinStatsJson'],
    },
  ];
}

/** Default JSON fragments for RequirementExpr blobs (campaign create). */
export function classPhase7JsonDefaults(): Pick<
  ClassFormValues,
  'requirementsMulticlassingJson' | 'requirementsMinStatsJson'
> {
  return {
    requirementsMulticlassingJson: '',
    requirementsMinStatsJson: '',
  };
}
