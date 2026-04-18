/**
 * System race catalog — code-defined race entries per system ruleset.
 *
 * These are the "factory defaults" for races. Campaign-owned custom races
 * are stored in the DB and merged at runtime by buildCampaignCatalog.
 */
import type { Race, RaceFields } from '@/features/content/races/domain/types';
import type { CreatureSense } from '@/features/content/shared/domain/vocab/creatureSenses.types';
import type { SystemRulesetId } from '../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds';

// ---------------------------------------------------------------------------
// 5e v1 system magic items (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

/** Ensures race-sourced sense rows carry `source.kind: 'race'` and `source.id` matching the race row. */
function withRaceSenseSources(raw: RaceFields): RaceFields {
  if (!raw.grants?.senses?.length) return raw;
  return {
    ...raw,
    grants: {
      ...raw.grants,
      senses: raw.grants.senses.map((s) => ({
        ...s,
        source: { kind: 'race' as const, id: raw.id },
      })) as readonly CreatureSense[],
    },
  };
}

/** Build a Race from the system catalog data (no DB fields). */
function toSystemRace(systemId: SystemRulesetId, raw: RaceFields): Race {
  const fields = withRaceSenseSources(raw);
  return {
    ...fields,

    // ContentBase
    source: 'system',
    imageKey: fields.imageKey ?? null,
    accessPolicy: undefined,
    patched: false,

    // SystemContentMeta (REQUIRED when source === 'system')
    systemId: systemId,
  };
}

const RACES_RAW: readonly RaceFields[] = [
  { id: 'human', name: 'Human', imageKey: '', description: 'A versatile race that can be found in all corners of the world.' },
  {
    id: 'dwarf',
    name: 'Dwarf',
    imageKey: '/assets/system/races/dwarf.webp',
    description: 'A race of short stature and long beards.',
    grants: { senses: [{ type: 'darkvision', range: 120 }] },
  },
  {
    id: 'elf',
    name: 'Elf',
    imageKey: '/assets/system/races/elf.webp',
    description: 'A race of graceful and elegant beings.',
    grants: { senses: [{ type: 'darkvision', range: 60 }] },
  },
  {
    id: 'gnome',
    name: 'Gnome',
    imageKey: '/assets/system/races/gnome.webp',
    description: 'A race of small and mischievous beings.',
    grants: { senses: [{ type: 'darkvision', range: 60 }] },
  },
  {
    id: 'orc',
    name: 'Orc',
    imageKey: '/assets/system/races/half-orc.webp',
    description: 'A race of powerful and muscular beings.',
    grants: { senses: [{ type: 'darkvision', range: 120 }] },
  },
  { id: 'halfling', name: 'Halfling', imageKey: '/assets/system/races/halfling.webp', description: 'A race of small and nimble beings.' },
  {
    id: 'tiefling',
    name: 'Tiefling',
    imageKey: '/assets/system/races/tiefling.webp',
    description:
      'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling.',
    grants: { senses: [{ type: 'darkvision', range: 60 }] },
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    imageKey: '/assets/system/races/dragonborn.webp',
    description:
      'Born of dragons, as their name proclaims, the dragonborn walk with proud self-assurance through a world that greets them with fearful incomprehension.',
    grants: { senses: [{ type: 'darkvision', range: 60 }] },
  },
];

const SYSTEM_RACES_SRD_CC_V5_2_1: readonly Race[] = RACES_RAW.map((r) =>
  toSystemRace(DEFAULT_SYSTEM_RULESET_ID, r),
);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_RACES_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Race[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_RACES_SRD_CC_V5_2_1,
};

export function getSystemRaces(systemId: SystemRulesetId): readonly Race[] {
  return SYSTEM_RACES_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemRace(systemId: SystemRulesetId, raceId: string): Race | undefined {
  return getSystemRaces(systemId).find((r) => r.id === raceId);
}
