import type {
  LocationBuildingMeta,
  LocationBuildingProfile,
  LocationBuildingStructure,
} from './building/locationBuilding.types';
import type { LocationConnection, LocationLabel, LocationScaleId } from './location.types';

/** Stable identifier for a location record (campaign or system). */
export type LocationId = string;

/**
 * Reusable field block for location content — shared by client views, API payloads, and persistence docs.
 * Compose with layer-specific metadata (`ContentItem`, `LocationDoc`, etc.) instead of duplicating fields.
 */
export interface LocationBaseFields {
  id: LocationId;
  name: string;
  description?: string;
  /**
   * Persisted campaign location scale. May be a **legacy** value (`region`, `subregion`, `district`) stored as
   * scale for older data — not necessarily a scale we offer for **new** location creation today.
   * Prefer `CONTENT_LOCATION_SCALE_IDS` / `isContentLocationScaleId` when deciding creatable or first-class semantics.
   */
  scale: LocationScaleId;
  category?: string;
  imageKey?: string | null;
  parentId?: string;
  ancestorIds?: string[];
  sortOrder?: number;
  label?: LocationLabel;
  aliases?: string[];
  tags?: string[];
  connections?: LocationConnection[];
  /** Building identity / function (`scale === 'building'`). */
  buildingMeta?: LocationBuildingMeta;
  /** Building interior topology — vertical links, etc. (`scale === 'building'`). */
  buildingStructure?: LocationBuildingStructure;
  /**
   * @deprecated Combined legacy block — prefer `buildingMeta` + `buildingStructure`.
   * May still be present on persisted documents until migration.
   */
  buildingProfile?: LocationBuildingProfile;
}

/**
 * Shared domain location entity (no campaign/source/access — those live on client `ContentItem` or server `LocationDoc`).
 */
export type Location = LocationBaseFields;
