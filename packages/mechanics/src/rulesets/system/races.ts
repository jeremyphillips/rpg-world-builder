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
// 5e v1 system races (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

function annotateRaceSenses(
  senses: readonly CreatureSense[] | undefined,
  raceId: string,
  optionLabel?: string,
): readonly CreatureSense[] | undefined {
  if (!senses?.length) return senses;
  return senses.map((s) => ({
    ...s,
    source: { kind: 'race' as const, id: raceId, ...(optionLabel ? { label: optionLabel } : {}) },
  })) as readonly CreatureSense[];
}

/** Ensures race-sourced sense rows carry `source.kind: 'race'` and `source.id` matching the race row. */
function withRaceSenseSources(raw: RaceFields): RaceFields {
  const hasOptionSenses = raw.definitionGroups?.some((g) =>
    g.options.some((o) => o.grants?.senses?.length),
  );
  if (!raw.grants?.senses?.length && !hasOptionSenses) return raw;

  let out: RaceFields = { ...raw };
  if (raw.grants?.senses?.length) {
    out = {
      ...out,
      grants: {
        ...raw.grants,
        senses: annotateRaceSenses(raw.grants.senses, raw.id),
      },
    };
  }
  if (hasOptionSenses && raw.definitionGroups?.length) {
    out = {
      ...out,
      definitionGroups: raw.definitionGroups.map((g) => ({
        ...g,
        options: g.options.map((opt) => {
          if (!opt.grants?.senses?.length) return opt;
          return {
            ...opt,
            grants: {
              ...opt.grants,
              senses: annotateRaceSenses(opt.grants.senses, raw.id, opt.id),
            },
          };
        }),
      })),
    };
  }
  return out;
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
    definitionGroups: [
      {
        id: 'elven-lineage',
        name: 'Elven Lineage',
        kind: 'lineage',
        selectionLevel: 1,
        description: 'Your lineage shapes your connection to the Fey and the magic of elves.',
        options: [
          {
            id: 'drow',
            name: 'Drow',
            description: 'Drow trace their lineage to the Underdark.',
            grants: {
              senses: [{ type: 'darkvision', range: 120 }],
              traits: [
                {
                  id: 'drow-magic',
                  name: 'Drow Magic',
                  description:
                    'You know the Dancing Lights cantrip. Starting at 3rd level, you can cast Faerie Fire once per Long Rest. Starting at 5th level, you can also cast Darkness once per Long Rest.',
                },
              ],
            },
            features: [
              {
                kind: 'spellcasting',
                name: 'Drow Magic',
                level: 1,
                mode: 'always_known',
                spellcastingClassId: 'wizard',
                grants: [
                  { level: 1, spellIds: ['dancing-lights'] },
                  { level: 3, spellIds: ['faerie-fire'] },
                  { level: 5, spellIds: ['darkness'] },
                ],
              },
            ],
          },
          {
            id: 'high-elf',
            name: 'High Elf',
            description: 'High elves have a gift for arcane study.',
            grants: {
              traits: [
                {
                  id: 'high-elf-cantrip',
                  name: 'High Elf Cantrip',
                  description:
                    'You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it. Whenever you finish a Long Rest, you can replace that cantrip with another cantrip from the wizard spell list.',
                },
              ],
            },
            features: [
              {
                kind: 'spellcasting',
                name: 'High Elf Spells',
                level: 1,
                mode: 'bonus_cantrip',
                spellcastingClassId: 'wizard',
                grants: [
                  { level: 1, spellIds: ['prestidigitation'] },
                  { level: 3, spellIds: ['detect-magic'] },
                  { level: 5, spellIds: ['misty-step'] },
                ],
              },
            ],
          },
          {
            id: 'wood-elf',
            name: 'Wood Elf',
            description: 'Wood elves have keen senses and a deep connection to wild lands.',
            grants: {
              traits: [
                {
                  id: 'wood-elf-speed',
                  name: 'Fleet of Foot',
                  description: 'Your Speed is 35 feet.',
                },
              ],
            },
            features: [
              {
                kind: 'spellcasting',
                name: 'Wood Elf Magic',
                level: 1,
                mode: 'always_prepared',
                spellcastingClassId: 'wizard',
                grants: [
                  { level: 1, spellIds: ['longstrider'] },
                  { level: 5, spellIds: ['pass-without-trace'] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnome',
    imageKey: '/assets/system/races/gnome.webp',
    description: 'A race of small and mischievous beings.',
    grants: {
      senses: [{ type: 'darkvision', range: 60 }],
      traits: [
        {
          id: 'gnomish-cunning',
          name: 'Gnomish Cunning',
          description:
            'You have Advantage on Intelligence, Wisdom, and Charisma saving throws against magic.',
        },
      ],
    },
    definitionGroups: [
      {
        id: 'gnomish-lineage',
        name: 'Gnomish Lineage',
        kind: 'lineage',
        selectionLevel: 1,
        options: [
          {
            id: 'forest-gnome',
            name: 'Forest Gnome',
            description: 'Forest gnomes have a knack for illusion and nature magic.',
            grants: {
              traits: [
                {
                  id: 'forest-gnome-speak-animals',
                  name: 'Speak with Animals',
                  description:
                    'You can cast Speak with Animals with this trait a number of times equal to your Proficiency Bonus per Long Rest.',
                },
              ],
            },
            features: [
              {
                kind: 'spellcasting',
                name: 'Forest Gnome Spells',
                level: 1,
                mode: 'always_known',
                spellcastingClassId: 'wizard',
                grants: [{ level: 1, spellIds: ['minor-illusion'] }],
              },
            ],
          },
          {
            id: 'rock-gnome',
            name: 'Rock Gnome',
            description: 'Rock gnomes are tinkerers and artificers at heart.',
            grants: {
              traits: [
                {
                  id: 'clockwork-device',
                  name: 'Clockwork Device',
                  description:
                    'You craft a Tiny clockwork device (AC 10; HP 1). It lasts until you dismantle it or craft another.',
                },
              ],
            },
            features: [
              {
                kind: 'spellcasting',
                name: 'Rock Gnome Spells',
                level: 1,
                mode: 'always_known',
                spellcastingClassId: 'wizard',
                grants: [{ level: 1, spellIds: ['mending', 'prestidigitation'] }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'goliath',
    name: 'Goliath',
    imageKey: '',
    description: 'Goliaths share ancestry with giants of the Elemental Planes.',
    grants: {},
    definitionGroups: [
      {
        id: 'giant-ancestry',
        name: 'Giant Ancestry',
        kind: 'ancestry',
        selectionLevel: 1,
        description: 'You trace your heritage to a type of giant.',
        options: [
          {
            id: 'cloud-giant',
            name: 'Cloud Giant',
            grants: {
              traits: [
                {
                  id: 'clouds-jaunt',
                  name: "Cloud's Jaunt",
                  description:
                    'As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your Proficiency Bonus per Long Rest.',
                },
              ],
            },
          },
          {
            id: 'fire-giant',
            name: 'Fire Giant',
            grants: {
              traits: [
                {
                  id: 'fires-burn',
                  name: "Fire's Burn",
                  description:
                    'When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to it. You can use this trait a number of times equal to your Proficiency Bonus per Long Rest.',
                },
              ],
            },
          },
          {
            id: 'frost-giant',
            name: 'Frost Giant',
            grants: {
              traits: [
                {
                  id: 'frosts-chill',
                  name: "Frost's Chill",
                  description:
                    'When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to it and reduce its Speed to 0 until the end of the current turn. You can use this trait a number of times equal to your Proficiency Bonus per Long Rest.',
                },
              ],
            },
          },
          {
            id: 'hill-giant',
            name: 'Hill Giant',
            grants: {
              traits: [
                {
                  id: 'hills-tumble',
                  name: "Hill's Tumble",
                  description:
                    'When a creature you can see hits you with an attack roll, you can use a Reaction to catch the strike and topple; you take no damage from the hit, which instead deals Bludgeoning damage to a creature of your choice within 5 feet of you. You can use this trait a number of times equal to your Proficiency Bonus per Long Rest.',
                },
              ],
            },
          },
          {
            id: 'stone-giant',
            name: 'Stone Giant',
            grants: {
              traits: [
                {
                  id: 'stones-endurance',
                  name: "Stone's Endurance",
                  description:
                    'When you take damage, you can use a Reaction to roll 1d12; add your Constitution modifier and reduce the damage by that total. You can use this trait a number of times equal to your Proficiency Bonus per Long Rest.',
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'orc',
    name: 'Orc',
    imageKey: '/assets/system/races/orc.webp',
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
    definitionGroups: [
      {
        id: 'draconic-ancestor',
        name: 'Draconic Ancestor',
        kind: 'ancestor',
        selectionLevel: 1,
        description: 'Your draconic ancestry determines the energy of your breath weapon and damage resistance.',
        options: [
          { id: 'black', name: 'Black Dragon', grants: { damageType: 'acid' } },
          { id: 'blue', name: 'Blue Dragon', grants: { damageType: 'lightning' } },
          { id: 'brass', name: 'Brass Dragon', grants: { damageType: 'fire' } },
          { id: 'bronze', name: 'Bronze Dragon', grants: { damageType: 'lightning' } },
          { id: 'copper', name: 'Copper Dragon', grants: { damageType: 'acid' } },
          { id: 'gold', name: 'Gold Dragon', grants: { damageType: 'fire' } },
          { id: 'green', name: 'Green Dragon', grants: { damageType: 'poison' } },
          { id: 'red', name: 'Red Dragon', grants: { damageType: 'fire' } },
          { id: 'silver', name: 'Silver Dragon', grants: { damageType: 'cold' } },
          { id: 'white', name: 'White Dragon', grants: { damageType: 'cold' } },
        ],
      },
    ],
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
