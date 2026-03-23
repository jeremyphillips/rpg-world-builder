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

  state?: { 
    flags?: string[]; 
    discoveredByCharacterIds?: string[]; 
    controlledByFactionId?: string 
  };

  defaultEncounterSpaceId?: string | null;
};
