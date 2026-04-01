# Locations domain (reference)

This document describes **where code lives** and **how the three layers** (location, map, transition) relate, plus **validation** boundaries. Use it to onboard quickly when extending authoring, APIs, or shared rules.

For the **location create/edit workspace** (full-width shell, `components/workspace/`, building floors, canvas zoom/pan hooks), see [location-workspace.md](./location-workspace.md).

## Mental model

| Layer | Role |
|-------|------|
| **Location** | Campaign place: name, scale, category, hierarchy (`parentId` / `ancestorIds`), optional connections, optional image. One location can have **multiple maps**. |
| **Map** | Tactical grid for a location: dimensions, cell unit, kind, cells, optional layout (e.g. excluded cells), sparse **cell authoring** (linked child locations + simple objects on cells). |
| **Transition** | Edge from a **source map cell** to a **target location** (and optionally target map / cells): doors, stairs, portals, zoom, etc. |

Persistence models live under `server/shared/models/`: `CampaignLocation`, `CampaignLocationMap`, `CampaignLocationTransition`.

---

## Shared grid domain (`shared/domain/grid/`)

**Single public entry:** import from `shared/domain/grid` (barrel: `index.ts`).

The grid domain provides geometry-aware types and helpers shared by locations and (in future) other grid consumers.

| File | Contents |
|------|----------|
| `gridCellIds.ts` | `GridPoint = { x, y }`, `makeGridCellId(x, y)` → `"x,y"`, `parseGridCellId`. |
| `gridGeometry.ts` | `GRID_GEOMETRY_IDS = ['square', 'hex'] as const`, `GridGeometryId`. |
| `gridDefinition.ts` | `GridDefinition = { geometry, columns, rows }` — bounded rect for both geometries. |
| `gridPresets.ts` | `GRID_SIZE_PRESETS` — named column×row preset sizes. |
| `gridHelpers.ts` | Geometry-aware pure helpers (see below). |

### Grid helpers

All accept a `GridDefinition` and branch on `geometry` internally:

| Helper | Square behavior | Hex behavior |
|--------|----------------|--------------|
| `isCellInBounds(grid, point)` | `0 ≤ x < cols`, `0 ≤ y < rows` | Same bounds check |
| `listGridPoints(grid)` | Row-major enumeration | Same enumeration |
| `getNeighborPoints(grid, point)` | 4 neighbors (N/E/S/W) | 6 neighbors (odd-q offset table) |
| `getNeighborCellIds(grid, cellId)` | String variant of above | String variant of above |
| `getGridDistance(grid, a, b)` | Chebyshev (`max(|dx|,|dy|)`) | Axial distance (internal offset→axial conversion) |

**Hex coordinate model:** first-pass hex uses bounded x/y with odd-q offset interpretation (odd columns shifted down by half a row). Axial conversion is internal only — the public API surface stays `GridPoint`-based.

### Grid cell styles (`src/features/content/locations/components/mapGrid/gridCellStyles.ts`)

Shared MUI styling tokens consumed by both `GridEditor` and `HexGridEditor` to keep border colors, selected shadow, etc. in visual parity.

---

## Shared domain (`shared/domain/locations/`)

**Single public entry:** import from `shared/domain/locations` (barrel: `index.ts`). Do not assume old flat filenames still exist at the folder root except the two listed below.

### Root files (stable paths)

| File | Contents |
|------|----------|
| `location.constants.ts` | `CONTENT_LOCATION_SCALE_IDS` (field policy), `SURFACE_LOCATION_CONTENT_SCALE_IDS` (standalone create + macro list), `INTERIOR_LOCATION_SCALE_IDS` (floor/room), `CAMPAIGN_LOCATION_LIST_SCALE_IDS` (list filters), `LOCATION_SCALE_ORDER`, `LEGACY_MAP_ZONE_LOCATION_SCALE_IDS`, `ALL_LOCATION_SCALE_IDS`, `LOCATION_SCALE_RANK_ORDER_LEGACY`, `LOCATION_CATEGORY_IDS`, `LOCATION_CONNECTION_KIND_IDS`. |
| `location.types.ts` | `LocationScaleId` (content + legacy), `ContentLocationScaleId`, `LocationCategoryId`, `LocationConnection`, `LocationLabel`, etc. |

**Important:** **Create/edit** and `LOCATION_SCALE_FIELD_POLICY` use **first-class content scales** only (`CONTENT_LOCATION_SCALE_IDS`). **Legacy** region/subregion/district may still appear on persisted locations; **rank/sort** uses `LOCATION_SCALE_RANK_ORDER_LEGACY`. **Linked locations** on maps no longer target those legacy scales — use **MapZone** on parent maps (`zones/`). **Allowed parent/child** pairs are **not** inferred from order alone; they live in `scale/locationScale.policy.ts` (`ALLOWED_PARENT_SCALES_BY_SCALE`).

### Subfolders (re-exported by barrel)

| Folder | Responsibility |
|--------|----------------|
| `scale/` | Scale **business policy** (who may parent whom), **field policy** (categories, cell units, **grid geometries**, which form fields apply per scale), **rules** (valid scale id, rank, world check), **UI policy** (`locationScaleUi.policy.ts` — campaign list vs standalone create vs interior), **parent validation** (`validateParentChildScales` for hierarchy). |
| `map/` | Map **constants** (kinds, cell units by kind, object kinds), **types** (`LocationMapBase`, grid, cells, cell authoring), **helpers** (`mapKindForLocationScale`, `getDefaultMapKindForScale` — derives map kind during save/bootstrap, `isCellUnitAllowedForScale`), **placement policy** (what can be placed / linked on cells by scale), **validation** (grid, cells, map input, cell authoring structure). |
| `zones/` | **MapZone** — painted named areas on a map (`MapZone`, `MapZoneKindId`, `MAP_ZONE_KIND_META`). **`ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE`** / helpers: which zone kinds may be authored for each host location scale. Separate from `LOCATION_SCALE_FIELD_POLICY`, linked-location policy (`locationMapPlacement.policy.ts`), and feature `mapContent`. Phase 1: shared types/policy only; paint UI and persistence deferred. |
| `transitions/` | Transition **kinds** (`LOCATION_TRANSITION_KIND_IDS`) and **shared types** (`LocationTransitionBase`, `from` / `to` shapes). |

### Shared vs feature: where map authoring content lives

- **`shared/domain/locations`** holds **cross-environment** domain code: vocabulary and types used by **client and server**, pure **validation**, persisted map **shapes**, **placement** and **transition** rules, and scale **policy** that APIs rely on. Prefer importing from `@/shared/domain/locations` here.
- **`src/features/content/locations/domain/mapContent/`** holds **authoring / presentation** for future map tools: cell fill / path / edge / placed-object **kind ids and metadata**, **`LOCATION_SCALE_MAP_CONTENT_POLICY`**, semantic **`LocationMapIconName`** tokens, swatch **keys**, and **`LOCATION_SCALE_MAP_ICON_NAME` / `LOCATION_MAP_OBJECT_KIND_ICON_NAME`**. The server does **not** consume this folder today. Import from `@/features/content/locations/domain` (barrel re-exports `mapContent`) or `.../domain/mapContent` directly. Map swatch hex values stay in `src/app/theme/mapColors.ts`.
- If server-side validation of authored map payloads is added later, consider **promoting** policy and kind-id unions back into `shared` (or keep validation in the feature — avoid `server/` importing `src/features/` unless that is an explicit product decision).

### Tests

Under `shared/domain/locations/__tests__/`, mirroring source: e.g. `__tests__/scale/`, `__tests__/map/`, `__tests__/zones/`. **`mapContent`** policy tests live next to the feature module: `src/features/content/locations/domain/mapContent/*.test.ts`.

---

## Layer details

### Location layer

- **Constants & types:** `location.constants.ts`, `location.types.ts`.
- **Hierarchy helpers (server-facing but pure rank/ancestor construction):** `server/features/content/locations/domain/locations.hierarchy.ts` — imports scale vocabulary and re-exports `validateParentChildScales` from shared (`scale/locationParent.validation.ts` via barrel).
- **Field / UX policy:** `scale/locationScaleField.policy.ts` — per-scale allowed categories, cell units, **grid geometries**, fixed/hidden fields; used by client form registry and server normalization (e.g. category/cell unit/geometry). Parent eligibility remains in `locationScale.policy.ts`.
- **Server:** `locations.service.ts` enforces create/update rules (scale, parent, categories, etc.) using shared validators and DB lookups.

### Map layer

- **Authoring vocabulary:** `map/locationMap.constants.ts` (`LOCATION_MAP_KIND_IDS`, `LOCATION_CELL_UNIT_IDS`, object kinds).
- **Shapes:** `map/locationMap.types.ts` (`LocationMapGrid` — includes optional `geometry?: GridGeometryId`, `LocationMapCell`, `LocationMapCellAuthoringEntry`, …).
- **Pure validation:** `map/locationMap.validation.ts`, `map/locationMapCellAuthoring.validation.ts` — no database; safe for client and server.
- **Placement rules (gameplay policy):** `map/locationMapPlacement.policy.ts` — e.g. which object kinds / link rules apply on a host scale (complements field policy). Linked targets still include region/subregion/district during migration; see file comment and `zones/` for **MapZone** direction.
- **Map zones (phase 1):** `zones/` — `MapZone` shape and host-scale zone-kind policy. Future: paint/area tool; not wired to storage yet.
- **Authored map content (types + per-scale policy):** `src/features/content/locations/domain/mapContent/` — four **categories** of future editor content, each with stable ids and lightweight display metadata (`LOCATION_*_KIND_META`):
  1. **Cell fills** — whole-cell terrain / surface (`LOCATION_CELL_FILL_KIND_IDS`).
  2. **Path features** — linear / network strokes (`LOCATION_PATH_FEATURE_KIND_IDS`).
  3. **Edge features** — boundary features (`LOCATION_EDGE_FEATURE_KIND_IDS`).
  4. **Placed objects** — anchored / footprint props (`LOCATION_PLACED_OBJECT_KIND_IDS`).
  **`LOCATION_SCALE_MAP_CONTENT_POLICY`** lists which ids apply at **world**, **city**, and **floor** (other scales are empty until extended). Intended future tools: **paint** (fills + paths), **edge** (edges), **place** (objects). Not wired to persistence or UI in the first pass.
- **Client:** default map bootstrap, grid drafting, cell authoring mappers under `src/features/content/locations/domain/mapAuthoring/`; map content vocabulary under `domain/mapContent/`; display icons under `domain/mapPresentation/`; repo helpers `locationMapRepo.ts`.

### Transition layer

- **Shared:** `transitions/locationTransition.constants.ts`, `transitions/locationTransition.types.ts`.
- **Server:** `locationTransitions.service.ts` plus **`locationTransitionValidation.ts`** — validates kind, resolves source/target maps and locations, ensures `from.cellId` exists on source map cells (`cellIdExistsOnMap` from shared map validation).
- **Facade:** `server/.../locationValidation.ts` re-exports transition validators alongside map and hierarchy helpers so feature code has one import surface.

---

## Validation (brief)

| Kind | Where | Notes |
|------|--------|--------|
| **Pure / shared** | `shared/domain/locations` (map input, cells, cell entries structure, parent scale pairing, transition kind enum) | No I/O; same rules client + server. |
| **Server facade** | `server/features/content/locations/services/locationValidation.ts` | Re-exports shared validators + renames (e.g. `validateLocationScaleNesting`) + transition exports from `locationTransitionValidation.ts`. |
| **Persistence-aware** | `locationTransitionValidation.ts`, `locations.service.ts`, `locationMaps.service.ts` | Loads `CampaignLocation` / `CampaignLocationMap`, checks existence, campaign scope, references. |

**Error shapes:** map errors use `LocationMapValidationError` (shared); transition errors use `TransitionValidationError` in `locationTransitionValidation.ts` (`path`, `code`, `message`).

**Client-side change validation:** `src/features/content/locations/domain/validation/validateLocationChange.ts` coordinates UX constraints when editing.

---

## Client feature layout (`src/features/content/locations/`)

| Area | Purpose |
|------|---------|
| `routes/` | List, create, edit, detail routes. Create and edit use the full-width workspace shell ([location-workspace.md](./location-workspace.md)); detail stays content-width for now. |
| `domain/forms/` | Form types, registry (`locationForm.registry.ts`), mappers, sanitize, dependent-field policy / UI rules. |
| `domain/repo/` | `locationRepo`, `locationMapRepo` — API/data access for lists and maps. |
| `domain/mapAuthoring/` | `bootstrapDefaultLocationMap` (client-side default map creation/update), `gridLayoutDraft` (prune cell keys when dimensions change), `cellAuthoringMappers` (draft ↔ `cellEntries`). Uses `getDefaultMapKindForScale` from shared domain to derive map kind. |
| `domain/mapContent/` | Authored-map vocabulary, per-scale map content policy, presentation tokens (icon names, swatch keys, cell-fill meta). See **Shared vs feature** above. |
| `domain/mapPresentation/` | `locationMapUiStyles`, `locationMapIconNameMap`, `locationMapDisplayIcons` — map chrome styling and semantic icon name → MUI resolution. |
| `components/` | `LocationGridAuthoringSection` (interactive grid preview; dispatches to `GridEditor` or `HexGridEditor` based on scale geometry), cell modal, cards. |
| `components/workspace/` | Map-first editor shell — [location-workspace.md](./location-workspace.md). |
| `hooks/` | Campaign data, parent picker options, default world scale, dependent field effects. |

Imports of shared vocabulary should prefer **`@/shared/domain/locations`** for scale constants, map constants, and policies.

---

## Server feature layout (`server/features/content/locations/`)

| Area | Purpose |
|------|---------|
| `services/` | `locations.service`, `locationMaps.service`, `locationTransitions.service`, `locationValidation`, `locationTransitionValidation`. |
| `domain/` | `locations.hierarchy`, tests. |
| `controllers/`, `routes/` | HTTP API wiring. |

---

## Grid geometry (hex support)

Grid geometry is derived from `LOCATION_SCALE_FIELD_POLICY` — there is no user-facing geometry selector in the form. The policy defines `allowedGeometries` and `defaultGeometry` per scale:

| Scale | Allowed | Default |
|-------|---------|---------|
| world, region, subregion | `['hex']` | `hex` |
| city | `['square', 'hex']` | `hex` |
| district, site | `['square', 'hex']` | `square` |
| building, floor, room | `['square']` | `square` |

**How geometry flows:**

1. **Create route:** geometry is derived from `getDefaultGeometryForScale(scale)` when scale is selected. The dependent field sanitization (`sanitizeLocationFormValues`) auto-corrects geometry when scale changes.
2. **Edit route:** geometry is seeded from the persisted map (`def.grid.geometry`). For legacy maps without a stored geometry, falls back to `getDefaultGeometryForScale(loc.scale)`.
3. **Bootstrap:** `bootstrapDefaultLocationMap` threads geometry into the `grid` object saved to the database via `normalizeGridGeometryForScale`.
4. **Rendering:** `LocationGridAuthoringSection` accepts a `gridGeometry` prop and renders `HexGridEditor` (hex) or `GridEditor` (square).

**Persistence:** `LocationMapGrid.geometry` is optional on the shared type and on the Mongoose schema (`enum: ['square', 'hex']`, not required). Legacy maps without the field work unchanged — they render using the scale policy default.

### Shared grid renderers (`src/features/content/locations/components/mapGrid/`)

| Component | Use |
|-----------|-----|
| `GridEditor` | Square grid — CSS grid layout, `aspectRatio: 1` cells. Used by encounters and square-scale locations. |
| `HexGridEditor` | Hex grid — CSS `clip-path` hexagons, absolute positioning with odd-q offset layout. Used by hex-scale locations only. |
| `gridCellStyles.ts` | `gridCellPalette` (border/background MUI paths), `gridCellSelectedShadow`, `gridCellSelectedInsetPx`. |

Both renderers share the same callback shapes (`onCellClick`, `renderCellContent`, etc.) and cell identity convention (`makeGridCellId(x, y)` → `"x,y"`).

### What stays square-only

- **Encounters / interiors:** `createSquareGridSpace`, `GridViewModel`, `EncounterActiveRoute` — no hex integration yet.
- **GridEditor:** unchanged; not overloaded with hex logic.

### What is deferred

- Hex object placement / cell-entry authoring changes
- Hex drag-paint exclude-cell tools
- Full hex zoom/pan calibration
- Server-side geometry validation against scale policy
- Hex distance / neighbor logic in encounter mechanics

---

## Pointers for the next agent

1. **Extend scale rules:** edit `scale/locationScale.policy.ts` and `scale/locationParent.validation.ts`; keep `locationScaleField.policy.ts` in sync for categories/cell units/UI.
2. **Extend map rules:** prefer `map/locationMap.validation.ts` / `locationMapCellAuthoring.validation.ts` for structural checks; `locationMapPlacement.policy.ts` for “what may appear on a cell” by scale. For **authored map content** categories (fills, paths, edges, placed objects), extend `src/features/content/locations/domain/mapContent/` and `LOCATION_SCALE_MAP_CONTENT_POLICY` — keep it separate from `LOCATION_SCALE_FIELD_POLICY`. For **painted map zones** (region/subregion/district/hazard/territory/custom), extend `zones/mapZone.policy.ts` and `MAP_ZONE_KIND_IDS` — separate from linked-location lists.
3. **New transition kinds:** add to `LOCATION_TRANSITION_KIND_IDS` and any server checks; shared types in `transitions/`.
4. **Imports:** use the **barrel** `@/shared/domain/locations` for shared vocabulary and validation; use `@/features/content/locations/domain` (or `.../domain/mapContent`) for authored map content and presentation tokens. Canvas hooks: `@/ui/hooks` (see [location-workspace.md](./location-workspace.md) for how the editor uses them).
5. **Tests:** add shared tests under `shared/domain/locations/__tests__/scale/` or `__tests__/map/`; **mapContent** tests under `src/features/content/locations/domain/mapContent/`; server tests next to services/domain in `server/features/content/locations/`.
6. **Hex geometry extensions:** geometry policy lives in `locationScaleField.policy.ts` (`allowedGeometries`, `defaultGeometry`). Grid math helpers are in `shared/domain/grid/gridHelpers.ts`. Rendering is in `mapGrid/HexGridEditor.tsx`. Do not add hex logic to encounter systems without a dedicated plan.
7. **Grid styling parity:** both `GridEditor` and `HexGridEditor` import border/shadow tokens from `src/features/content/locations/components/mapGrid/gridCellStyles.ts`. Keep this file updated when changing cell visuals.
8. **Workspace UI:** layout shell, building floors, zoom/pan route wiring — [location-workspace.md](./location-workspace.md).
