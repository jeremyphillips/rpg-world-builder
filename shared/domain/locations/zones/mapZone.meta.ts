import type { MapZoneKindId } from './mapZone.types';

export type MapZoneKindMeta = {
  label: string;
  description?: string;
  /** Future: semantic icon token for palette / legend (resolved in UI). */
  iconName?: string;
  /** Future: key into theme swatch map (resolved in UI). */
  swatchColorKey?: string;
};

export const MAP_ZONE_KIND_META = {
  region: {
    label: 'Region',
    description: 'Large named area on a world-scale map.',
  },
  subregion: {
    label: 'Subregion',
    description: 'Finer subdivision within a region.',
  },
  district: {
    label: 'District',
    description: 'Named quarter or neighborhood on a city-scale map.',
  },
  hazard: {
    label: 'Hazard',
    description: 'Dangerous or special area (future use).',
  },
  territory: {
    label: 'Territory',
    description: 'Faction or ally-controlled area (future use).',
  },
  custom: {
    label: 'Custom zone',
    description: 'Author-defined painted area.',
  },
} as const satisfies Record<MapZoneKindId, MapZoneKindMeta>;
