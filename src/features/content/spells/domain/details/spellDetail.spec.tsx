import type { Spell } from '@/features/content/spells/domain/types';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { formatSpellRangeAreaDisplay } from './display/spellRangeAreaDisplay';
import { renderSpellComponentsDisplay } from './display/spellComponentsDisplay';
import { renderSpellAttackSaveDetailDisplay } from './display/spellAttackSaveDisplay';
import { renderSpellCastingTimeDetailDisplay } from './display/spellCastingTimeDetail';
import { renderSpellDurationDetailDisplay } from './display/spellDurationDetail';
import { renderSpellDamageEffectsDetailDisplay } from './display/spellDamageEffectsDisplay';
import { getMagicSchoolDisplayName } from '@/features/content/shared/domain/vocab';
import { classIdToName } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { formatSpellLevelShort, SPELL_UI } from '../spellPresentation';

const classLabel = (id: string) => classIdToName(DEFAULT_SYSTEM_RULESET_ID, id);

export type SpellDetailCtx = Record<string, never>;

/** Platform-admin advanced JSON: stable snapshot of persisted-relevant fields. */
function spellAdvancedRecord(spell: Spell): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    spell.source === 'system'
      ? { systemId: (spell as Spell & { systemId?: string }).systemId }
      : { campaignId: (spell as Spell & { campaignId?: string }).campaignId };

  return {
    id: spell.id,
    name: spell.name,
    source: spell.source,
    patched: spell.patched,
    ...scopeMeta,
    accessPolicy: spell.accessPolicy,
    school: spell.school,
    level: spell.level,
    classes: spell.classes,
    castingTime: spell.castingTime,
    range: spell.range,
    duration: spell.duration,
    components: spell.components,
    deliveryMethod: spell.deliveryMethod,
    effectGroups: spell.effectGroups,
    scaling: spell.scaling,
    resolution: spell.resolution,
    description: spell.description,
    tags: spell.tags,
    imageKey: spell.imageKey,
  };
}

export const SPELL_DETAIL_SPECS: DetailSpec<Spell, SpellDetailCtx>[] = [
  ...contentDetailMetaSpecs<Spell, SpellDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<Spell, SpellDetailCtx>(),
  {
    key: SPELL_UI.level.key,
    label: SPELL_UI.level.ui.label,
    order: 40,
    render: (spell) => formatSpellLevelShort(spell.level),
  },
  {
    key: SPELL_UI.school.key,
    label: SPELL_UI.school.ui.label,
    order: 45,
    render: (spell) => getMagicSchoolDisplayName(spell.school),
  },
  {
    key: 'range',
    label: 'Range/Area',
    order: 50,
    render: (spell) => formatSpellRangeAreaDisplay(spell),
  },
  {
    key: 'castingTime',
    label: 'Casting Time',
    order: 55,
    render: (spell) => renderSpellCastingTimeDetailDisplay(spell),
  },
  {
    key: 'duration',
    label: 'Duration',
    order: 60,
    render: (spell) => renderSpellDurationDetailDisplay(spell),
  },
  {
    key: 'components',
    label: 'Components',
    order: 65,
    render: (spell) => renderSpellComponentsDisplay(spell),
  },
  {
    key: 'attack-save',
    label: 'Attack/Save',
    order: 70,
    render: (spell) => renderSpellAttackSaveDetailDisplay(spell),
  },
  {
    key: 'damage-effects',
    label: 'Damage Type/Effects',
    order: 75,
    render: (spell) => renderSpellDamageEffectsDetailDisplay(spell),
  },
  {
    key: SPELL_UI.classes.key,
    label: SPELL_UI.classes.ui.label,
    order: 80,
    render: (spell) =>
      spell.classes.map((c) => classLabel(c)).join(', ') || '—',
  },
  {
    key: 'description',
    label: 'Description',
    order: 90,
    hidden: (spell) => !spell.description.full?.trim(),
    render: (spell) => (
      <span style={{ whiteSpace: 'pre-line' }}>{spell.description.full}</span>
    ),
  },
  {
    key: 'spellRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (spell) => spellAdvancedRecord(spell),
  },
];
