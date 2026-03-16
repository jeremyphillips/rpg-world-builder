import type { Spell } from '@/features/content/spells/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab';
import { classIdToName } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';

const schoolLabel = (value: string) =>
  MAGIC_SCHOOL_OPTIONS.find((o) => o.value === value)?.label ?? value;

const classLabel = (id: string) => classIdToName(DEFAULT_SYSTEM_RULESET_ID, id);

export const SPELL_DETAIL_SPECS: DetailSpec<Spell, unknown>[] = [
  {
    key: 'school',
    label: 'School',
    order: 10,
    render: (spell) => schoolLabel(spell.school),
  },
  {
    key: 'level',
    label: 'Level',
    order: 20,
    render: (spell) => (spell.level === 0 ? 'Cantrip' : `${spell.level}`),
  },
  {
    key: 'classes',
    label: 'Classes',
    order: 30,
    render: (spell) =>
      spell.classes.map((c) => classLabel(c)).join(', ') || '—',
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
