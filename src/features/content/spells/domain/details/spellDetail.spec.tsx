import type { Spell } from '@/features/content/spells/domain/types';
import { contentDetailMetaSpecs } from '@/features/content/shared/domain';
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

export const SPELL_DETAIL_SPECS: DetailSpec<Spell, unknown>[] = [
  ...contentDetailMetaSpecs<Spell, unknown>(),
  {
    key: SPELL_UI.level.key,
    label: SPELL_UI.level.ui.label,
    order: 10,
    render: (spell) => formatSpellLevelShort(spell.level),
  },
  {
    key: SPELL_UI.school.key,
    label: SPELL_UI.school.ui.label,
    order: 20,
    render: (spell) => getMagicSchoolDisplayName(spell.school),
  },
  {
    key: 'range',
    label: 'Range/Area',
    order: 20,
    render: (spell) => formatSpellRangeAreaDisplay(spell),
  },
  {
    key: 'castingTime',
    label: 'Casting Time',
    order: 21,
    render: (spell) => renderSpellCastingTimeDetailDisplay(spell),
  },
  {
    key: 'duration',
    label: 'Duration',
    order: 24,
    render: (spell) => renderSpellDurationDetailDisplay(spell),
  },
  {
    key: 'components',
    label: 'Components',
    order: 25,
    render: (spell) => renderSpellComponentsDisplay(spell),
  },
  {
    key: 'attack-save',
    label: 'Attack/Save',
    order: 26,
    render: (spell) => renderSpellAttackSaveDetailDisplay(spell),
  },
  {
    key: 'damage-effects',
    label: 'Damage Type/Effects',
    order: 27,
    render: (spell) => renderSpellDamageEffectsDetailDisplay(spell),
  },
  {
    key: SPELL_UI.classes.key,
    label: SPELL_UI.classes.ui.label,
    order: 30,
    render: (spell) =>
      spell.classes.map((c) => classLabel(c)).join(', ') || '—',
  },
  // {
  //   key: 'effects',
  //   label: 'Effects',
  //   order: 60,
  //   render: (spell) => {
  //     const arr = spell.effects;
  //     if (!arr || arr.length === 0) return '—';
  //     return `${arr.length} effect(s)`;
  //   },
  // },
];
