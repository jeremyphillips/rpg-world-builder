import type { Spell } from '@/features/content/spells/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { formatSpellRangeAreaDisplay } from './spellRangeAreaText';
import { renderSpellComponentsDisplay } from './spellComponentsDisplay';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab';
import { classIdToName } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';

const schoolLabel = (value: string) =>
  MAGIC_SCHOOL_OPTIONS.find((o) => o.id === value)?.name ?? value;

const classLabel = (id: string) => classIdToName(DEFAULT_SYSTEM_RULESET_ID, id);

export const SPELL_DETAIL_SPECS: DetailSpec<Spell, unknown>[] = [
  {
    key: 'level',
    label: 'Level',
    order: 10,
    render: (spell) => (spell.level === 0 ? 'Cantrip' : `${spell.level}`),
  },
  {
    key: 'school',
    label: 'School',
    order: 20,
    render: (spell) => schoolLabel(spell.school),
  },
  {
    key: 'range',
    label: 'Range/Area',
    order: 20,
    render: (spell) => formatSpellRangeAreaDisplay(spell),
  },
  // {
  //   key: 'ritual',
  //   label: 'Ritual',
  //   order: 40,
  //   render: (spell) => (spell.ritual ? 'Yes' : 'No'),
  // },
  // {
  //   key: 'concentration',
  //   label: 'Concentration',
  //   order: 50,
  //   render: (spell) => (spell.concentration ? 'Yes' : 'No'),
  // },
  {
    key: 'components',
    label: 'Components',
    order: 25,
    render: (spell) => renderSpellComponentsDisplay(spell),
  },
  {
    key: 'classes',
    label: 'Classes',
    order: 30,
    render: (spell) =>
      spell.classes.map((c) => classLabel(c)).join(', ') || '—',
  },
  {
    key: 'effects',
    label: 'Effects',
    order: 60,
    render: (spell) => {
      const arr = spell.effects;
      if (!arr || arr.length === 0) return '—';
      return `${arr.length} effect(s)`;
    },
  },
];
