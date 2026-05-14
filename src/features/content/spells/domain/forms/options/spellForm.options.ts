import { ACTION_ECONOMY_DEFINITIONS } from '@/features/content/shared/domain/vocab/actionEconomy.vocab';
import { SPELL_CASTING_TIME_DURATION_UNIT_IDS } from '@/shared/domain/time/time.definitions';
import { DISTANCE_UNIT_DEFINITIONS } from '@/shared/domain/distance/distance.definitions';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab/magicSchools.vocab';
import { SPELL_DURATION_KIND_OPTIONS } from '@/features/content/spells/domain/vocab/spellDurationKinds.vocab';
import { SPELL_RANGE_DEFINITIONS } from '@/features/content/shared/domain/vocab/spellRanges.vocab';
import { SPELL_COMPONENT_DEFINITIONS } from '@/features/content/shared/domain/vocab/spellComponents.vocab';
import { TRIGGER_DEFINITIONS } from '@/features/content/shared/domain/vocab/triggers.vocab';
import { TIME_UNIT_DEFINITIONS } from '@/shared/domain/time/time.definitions';
import type { FieldSpecOption } from '@/features/content/shared/forms/registry';

/** Action economy + long-cast units (minute, hour) for casting time select. */
export const SPELL_CASTING_TIME_UNIT_OPTIONS: FieldSpecOption[] = [
  ...ACTION_ECONOMY_DEFINITIONS.map((d) => ({ value: d.id, label: d.name })),
  ...SPELL_CASTING_TIME_DURATION_UNIT_IDS.map((id) => {
    const row = TIME_UNIT_DEFINITIONS.find((t) => t.id === id);
    return { value: id, label: row?.name ?? id };
  }),
];

export const SPELL_SCHOOL_SELECT_OPTIONS: FieldSpecOption[] = MAGIC_SCHOOL_OPTIONS.map((o) => ({
  value: o.id,
  label: o.name,
}));

export const SPELL_DURATION_KIND_SELECT_OPTIONS: FieldSpecOption[] = SPELL_DURATION_KIND_OPTIONS.map(
  (o) => ({ value: o.id, label: o.name }),
);

export const SPELL_RANGE_KIND_SELECT_OPTIONS: FieldSpecOption[] = SPELL_RANGE_DEFINITIONS.map((d) => ({
  value: d.id,
  label: d.name,
}));

export const SPELL_DISTANCE_UNIT_OPTIONS: FieldSpecOption[] = DISTANCE_UNIT_DEFINITIONS.map((d) => ({
  value: d.id,
  label: d.name,
}));

export const SPELL_TIME_UNIT_OPTIONS: FieldSpecOption[] = TIME_UNIT_DEFINITIONS.map((d) => ({
  value: d.id,
  label: d.name,
}));

export const SPELL_COMPONENT_CHECKBOX_OPTIONS: FieldSpecOption[] = SPELL_COMPONENT_DEFINITIONS.map(
  (d) => ({ value: d.id, label: d.name }),
);

export const SPELL_TRIGGER_SELECT_OPTIONS: FieldSpecOption[] = TRIGGER_DEFINITIONS.map((d) => ({
  value: d.id,
  label: d.name,
}));

/** Material cost coin — matches Coin type */
export const SPELL_MATERIAL_COIN_OPTIONS: FieldSpecOption[] = [
  { value: 'cp', label: 'cp' },
  { value: 'sp', label: 'sp' },
  { value: 'ep', label: 'ep' },
  { value: 'gp', label: 'gp' },
  { value: 'pp', label: 'pp' },
];
