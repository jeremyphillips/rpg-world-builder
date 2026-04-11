# Location ↔ map schema relations

This document summarizes how **campaign location** rows, **location maps**, and **transitions** relate, what is authoritative for each concern, and domain rules enforced in code.

**Related:** [domain.md](./domain.md) (layer overview and file layout).

## Layers

| Layer | Mongoose model | Role |
|--------|----------------|------|
| Location | `CampaignLocation` | Name, scale, hierarchy, access, **`buildingMeta`** (identity/function), **`buildingStructure`** (vertical links). |
| Map | `CampaignLocationMap` | Grid, **`cellEntries`** (linked child locations, placed objects, fills, regions). |
| Transition | `CampaignLocationTransition` | Gameplay edges from a **source map cell** to a **target location** (optional target map/cells). |

## Authoritative sources (by concern)

- **Building identity / function** (type, storefront, staff, etc.): persisted on the building location as **`buildingMeta`**. Not duplicated as the source of truth on maps.
- **Interior topology** (paired stairs between floors): **`buildingStructure.verticalConnections`** on the building location. Floor maps hold stair **endpoints** on cells; the pairing record is the canonical graph for authoring.
- **City (or site) placement** of a building: authoritative on the **host** location’s map — `cellEntries[]` rows with **`linkedLocationId`** pointing at the building, plus marker/object data for footprint/presentation. The building row does not own a second editable copy of grid coordinates.
- **Gameplay traversal** (doors, street ingress, zoom, etc.): **`CampaignLocationTransition`** rows keyed by `fromMapId` + `fromCellId`.

## Stored vs derived (short)

- **Persist:** `buildingMeta`, `buildingStructure`, map `cellEntries`, transition documents.
- **Derive at read/UI time:** district/overlay membership from **`regionId`** on cells (or future map zones), compatibility hints, layout suggestions.

## Invariant: one building ↔ one map placement (campaign)

A **building** location (`scale === 'building'`) may appear as **`linkedLocationId` in at most one** `cellEntries` row **across all maps** in the campaign.

- Enforced on **map create/update** in `validateBuildingSinglePlacementInCampaign` (`locationMaps.service.ts`): duplicate links on the same map, or a link that conflicts with another map’s cell, return validation errors (`DUPLICATE_BUILDING_LINK`, `BUILDING_ALREADY_PLACED`).

### Client picker vs server

On **city** and **site** maps, the editor **prefetches** which building locations are already linked on another cell and **disables** those entries in the building link picker. That UX aligns with the invariant above but is **not** authoritative: persistence still runs the same validation, and **`DUPLICATE_BUILDING_LINK` / `BUILDING_ALREADY_PLACED`** remain the source of truth if UI state is stale (e.g. another tab, concurrent edits) or a race occurs.

## Migration note

Legacy combined **`buildingProfile`** was split into **`buildingMeta`** + **`buildingStructure`** and removed from the API and Mongoose schema. The script `scripts/migrateLocationBuildingProfile.ts` (see `npm run migrate:location-building-profile`) performs the data move. **Create/update** requests must not send `buildingProfile` (rejected with `DEPRECATED`).

## Open / deferred

- **`placementId`** / **`cityPlacementRef`** back-pointers on maps and buildings (plan Phase “placement backpointer”).
- **Building ↔ street** transitions as first-class `CampaignLocationTransition` edges.
