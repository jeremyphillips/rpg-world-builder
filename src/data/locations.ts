import type { Visibility } from '@/shared/types/visibility'

/**
 * LOCATION MODEL DESIGN
 *
 * Locations are modeled using TWO separate concepts:
 *
 * 1. kind  → behavioral (engine logic)
 * 2. scale → structural (hierarchy + UI)
 *
 * Why both exist:
 * - Two locations can behave the same but exist at different scales
 *   (e.g., Castle and Hut are both 'structure', but different scales)
 * - Two locations can be the same scale but behave differently
 *   (e.g., City vs Dungeon at similar "size" but different systems)
 *
 * Rule of thumb:
 * - Use SCALE for nesting, breadcrumbs, and UI
 * - Use KIND for rules, mechanics, and systems
 *
 * For now:
 * - You may only actively use `scale`
 * - `kind` exists for future engine expansion (travel, encounters, etc.)
 */
/**
 * FUTURE IMPLEMENTATION NOTE
 *
 * In the UI, users will likely select a single "Location Type"
 * (e.g., City, Dungeon, Room), which internally maps to:
 *
 *   type → { kind, scale }
 *
 * This avoids exposing both concepts to users while preserving
 * flexibility in the data model.
 */
export type LocationScale =
  | 'world'
  | 'region'
  | 'subregion'
  | 'city'
  | 'district'
  | 'site'       // catch-all: tavern, cave, temple, ruin
  | 'building'
  | 'floor'
  | 'room'

export type Location = {
  id: string;
  campaignId?: string;

  name: string;

  kind: 'world' | 'region' | 'settlement' | 'site' | 'structure' | 'room' | 'dungeon';
  scale?: LocationScale

  description?: string;
  imageKey?: string | null
  
  parentId?: string;
  ancestors?: string[];

  label?: { short?: string; number?: string };
  aliases?: string[];
  tags?: string[];

  visibility?: Visibility

  connections?: Array<{
    toId: string;
    kind: 'road' | 'river' | 'door' | 'stairs' | 'hall' | 'secret' | 'portal';
    bidirectional?: boolean;
    locked?: boolean;
    dc?: number;
    keyItemId?: string;
  }>;

  state?: { flags?: string[]; discoveredByCharacterIds?: string[]; controlledByFactionId?: string };
};

export const locations = [
  // --- MAJOR REGIONS ---
  {
    id: 'nehwon',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Nehwon',
    kind: 'world',
    scale: 'world',
    parentId: undefined,
    visibility: { scope: 'public' },
    description: 'Nehwon is a strange and perilous world of ancient cities, dark gods, and forgotten empires. From the decadent metropolis of Lankhmar to the frozen Cold Waste and the mysterious Inner Sea, it is a land of sword and sorcery where magic is feared and fate is fickle.',
    tags: ['lankhmar', 'sword-and-sorcery', 'nehwon']
  },
  {
    id: 'coldWaste',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'The Cold Waste',
    kind: 'region',
    description: 'The Cold Waste is a frozen wasteland that lies to the north of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'steppesOfMingols',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Steppes of the Mingols',
    kind: 'region',
    description: 'The Steppes of the Mingols are a vast and rolling plain that lies to the east of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'landOfEightCities',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'The Land of the Eight Cities',
    kind: 'region',
    description: 'The Land of the Eight Cities is a region that lies to the south of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'shadowland',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Shadowland',
    kind: 'region',
    description: 'Shadowland is a region that lies to the west of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'sinkingLands',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'The Sinking Lands',
    kind: 'region',
    description: 'The Sinking Lands is a region that lies to the south of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  // --- CITIES & TOWNS ---
  {
    id: 'lankhmarCity',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Lankhmar City',
    kind: 'settlement',
    scale: 'city',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'kvarchNar',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Kvarch Nar',
    kind: 'settlement',
    scale: 'city',
    parentId: 'landOfEightCities',
    visibility: { scope: 'public' }
  },
  {
    id: 'blum',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Blüm',
    kind: 'settlement',
    scale: 'city',
    description: 'Blüm is a town that lies to the east of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'ilthmar',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Ilthmar',
    kind: 'settlement',
    scale: 'city',
    description: 'Ilthmar is a city that lies to the west of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'oolHrusp',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Ool Hrusp',
    kind: 'settlement',
    scale: 'city',
    description: 'Ool Hrusp is a city that lies to the north of Lankhmar.',
    parentId: 'landOfEightCities',
    visibility: { scope: 'public' }
  },
  {
    id: 'gnamphNar',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Gnamph Nar',
    kind: 'settlement',
    scale: 'city',
    description: 'Gnamph Nar is a city that lies to the north of Lankhmar.',
    parentId: 'landOfEightCities',
    visibility: { scope: 'public' }
  },
  {
    id: 'illikVing',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Illik-Ving',
    kind: 'settlement',
    scale: 'city',
    description: 'Illik-Ving is a city that lies to the north of Lankhmar.',
    parentId: 'landOfEightCities',
    visibility: { scope: 'public' }
  },
  {
    id: 'horborixen',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Horborixen',
    kind: 'settlement',
    scale: 'city',
    description: 'Horborixen is a city that lies to the west of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'quarmall',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Quarmall',
    kind: 'settlement',
    scale: 'city',
    description: 'Quarmall is a city that lies to the south of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },

  // --- LANDMARKS & DUNGEONS ---
  {
    id: 'stardock',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Stardock',
    kind: 'site',
    description: 'Stardock is a landmark that lies to the north of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'ningaublesCave',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Ningauble\'s Cave',
    kind: 'dungeon',
    description: 'Ningauble\'s Cave is a dungeon that lies to the north of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },

  // DISTRICT
{
  id: 'tenderloinDistrict',
  campaignId: '698a7c82c35d1758cfa4f4c3',
  name: 'Tenderloin District',
  kind: 'settlement', // still part of a city system
  scale: 'district', // hierarchical level
  parentId: 'lankhmarCity',
  visibility: { scope: 'public' }
},

// BUILDING (Tavern)
{
  id: 'silverEel',
  campaignId: '698a7c82c35d1758cfa4f4c3',
  name: 'The Silver Eel',
  kind: 'structure', // indoor / interactable space
  scale: 'building',
  parentId: 'tenderloinDistrict',
  visibility: { scope: 'public' }
},

// FLOOR
{
  id: 'silverEelFirstFloor',
  campaignId: '698a7c82c35d1758cfa4f4c3',
  name: 'The Silver Eel — First Floor',
  kind: 'structure', // still same behavior system
  scale: 'floor',
  parentId: 'silverEel',
  visibility: { scope: 'public' }
}
] as const satisfies Location[]