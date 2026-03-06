/**
 * System race catalog — code-defined race entries per system ruleset.
 *
 * These are the "factory defaults" for races. Campaign-owned custom races
 * are stored in the DB and merged at runtime by buildCampaignCatalog.
 */
import type { Race, RaceFields } from '@/features/content/shared/domain/types';
import type { SystemRulesetId } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';

// ---------------------------------------------------------------------------
// 5e v1 system magic items (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

/** Build a Race from the system catalog data (no DB fields). */
function toSystemRace(systemId: SystemRulesetId, raw: RaceFields): Race {
  return {
    ...raw,

    // ContentBase
    source: 'system',
    imageKey: raw.imageKey ?? null,
    accessPolicy: undefined,
    patched: false,

    // SystemContentMeta (REQUIRED when source === 'system')
    systemId: systemId
  };
}

const RACES_RAW: readonly RaceFields[] = [
  { id: 'human',      name: 'Human',      imageKey: '/assets/system/races/human.webp',      description: 'A versatile race that can be found in all corners of the world.' },
  { id: 'dwarf',      name: 'Dwarf',      imageKey: '/assets/system/races/dwarf.webp',      description: 'A race of short stature and long beards.' },
  { id: 'elf',        name: 'Elf',        imageKey: '/assets/system/races/elf.webp',        description: 'A race of graceful and elegant beings.' },
  { id: 'gnome',      name: 'Gnome',      imageKey: '/assets/system/races/gnome.webp',      description: 'A race of small and mischievous beings.' },
  { id: 'halfElf',    name: 'Half-Elf',   imageKey: '/assets/system/races/half-elf.webp',   description: 'A race of mixed heritage that combines the best of both worlds.' },
  { id: 'halfOrc',    name: 'Half-Orc',   imageKey: '/assets/system/races/half-orc.webp',   description: 'A race of powerful and muscular beings.' },
  { id: 'halfling',   name: 'Halfling',   imageKey: '/assets/system/races/halfling.webp',   description: 'A race of small and nimble beings.' },
  { id: 'tiefling',   name: 'Tiefling',   imageKey: '/assets/system/races/tiefling.webp',   description: 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling.' },
  { id: 'dragonborn', name: 'Dragonborn', imageKey: '/assets/system/races/dragonborn.webp', description: 'Born of dragons, as their name proclaims, the dragonborn walk with proud self-assurance through a world that greets them with fearful incomprehension.' },
]

const SYSTEM_RACES_SRD_CC_V5_2_1: readonly Race[] = RACES_RAW.map(r => toSystemRace(DEFAULT_SYSTEM_RULESET_ID, r));


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
  return getSystemRaces(systemId).find(r => r.id === raceId);
}
