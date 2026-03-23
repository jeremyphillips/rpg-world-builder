import type { Location } from '@/features/content/locations/types'

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
    id: 'cold-waste',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'The Cold Waste',
    kind: 'region',
    description: 'The Cold Waste is a frozen wasteland that lies to the north of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'steppes-of-mingols',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Steppes of the Mingols',
    kind: 'region',
    description: 'The Steppes of the Mingols are a vast and rolling plain that lies to the east of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'land-of-eight-cities',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'The Land of the Eight Cities',
    kind: 'region',
    description: 'The Land of the Eight Cities is a region that lies to the south of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'shadow-land',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Shadowland',
    kind: 'region',
    description: 'Shadowland is a region that lies to the west of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'sinking-lands',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'The Sinking Lands',
    kind: 'region',
    description: 'The Sinking Lands is a region that lies to the south of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  // --- CITIES & TOWNS ---
  {
    id: 'lankhmar-city',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Lankhmar City',
    kind: 'settlement',
    scale: 'city',
    parentId: undefined,
    visibility: { scope: 'public' }
  },
  {
    id: 'kvarch-nar',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Kvarch Nar',
    kind: 'settlement',
    scale: 'city',
    parentId: 'land-of-eight-cities',
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
    id: 'ool-hrusp',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Ool Hrusp',
    kind: 'settlement',
    scale: 'city',
    description: 'Ool Hrusp is a city that lies to the north of Lankhmar.',
    parentId: 'land-of-eight-cities',
    visibility: { scope: 'public' }
  },
  {
    id: 'gnamph-nar',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Gnamph Nar',
    kind: 'settlement',
    scale: 'city',
    description: 'Gnamph Nar is a city that lies to the north of Lankhmar.',
    parentId: 'land-of-eight-cities',
    visibility: { scope: 'public' }
  },
  {
    id: 'illik-ving',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Illik-Ving',
    kind: 'settlement',
    scale: 'city',
    description: 'Illik-Ving is a city that lies to the north of Lankhmar.',
    parentId: 'land-of-eight-cities',
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
    id: 'ningaubles-cave',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    name: 'Ningauble\'s Cave',
    kind: 'dungeon',
    description: 'Ningauble\'s Cave is a dungeon that lies to the north of Lankhmar.',
    parentId: undefined,
    visibility: { scope: 'public' }
  },

  // DISTRICT
{
  id: 'tenderloin-district',
  campaignId: '698a7c82c35d1758cfa4f4c3',
  name: 'Tenderloin District',
  kind: 'settlement', // still part of a city system
  scale: 'district', // hierarchical level
  parentId: 'lankhmar-city',
  visibility: { scope: 'public' }
},

// BUILDING (Tavern)
{
  id: 'silver-eel',
  campaignId: '698a7c82c35d1758cfa4f4c3',
  name: 'The Silver Eel',
  kind: 'structure', // indoor / interactable space
  scale: 'building',
  parentId: 'tenderloin-district',
  visibility: { scope: 'public' }
},

// FLOOR
{
  id: 'silver-eel-first-floor',
  campaignId: '698a7c82c35d1758cfa4f4c3',
  name: 'The Silver Eel — First Floor',
  kind: 'structure', // still same behavior system
  scale: 'floor',
  parentId: 'silver-eel',
  visibility: { scope: 'public' }
}
] as const satisfies Location[]