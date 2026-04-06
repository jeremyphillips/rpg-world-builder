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
| `location.constants.ts` | `CONTENT_LOCATION_SCALE_IDS` (first-class content scales for new authoring), `SURFACE_CONTENT_LOCATION_SCALE_IDS` / `INTERIOR_CONTENT_LOCATION_SCALE_IDS` (surface vs interior groupings), `LOCATION_MAP_ZONE_KIND_IDS` (region/subregion/district — map subdivisions, not creatable content scales), `CAMPAIGN_LOCATION_LIST_SCALE_IDS` (list filters, includes legacy ids), `LOCATION_SCALE_ORDER`, `LOCATION_SCALE_IDS_WITH_LEGACY` (compatibility union incl. legacy scale-like ids), `LOCATION_SCALE_RANK_ORDER_LEGACY` (sorting legacy rows only), `LOCATION_CATEGORY_IDS`, `LOCATION_CONNECTION_KIND_IDS`. |
| `location.types.ts` | `LocationScaleId` (content + legacy), `ContentLocationScaleId`, `LocationCategoryId`, `LocationConnection`, `LocationLabel`, etc. |

**Important — vocabulary sources (avoid mixing up):**

| Surface | Constants / helpers |
|--------|------------------------|
| **New authoring** (creatable first-class scales, form field policy) | `CONTENT_LOCATION_SCALE_IDS`, `SURFACE_CONTENT_LOCATION_SCALE_IDS`, `INTERIOR_CONTENT_LOCATION_SCALE_IDS`, `isContentLocationScaleId` |
| **Legacy compatibility** (persisted rows, API typing) | `LOCATION_SCALE_IDS_WITH_LEGACY` / `LocationScaleId`, `isValidLocationScaleId` |
| **Map zone as legacy scale** (`region` / `subregion` / `district` on old locations) | `LOCATION_MAP_ZONE_KIND_IDS`, `isLegacyMapZoneLocationScaleId` — prefer **MapZone** on maps for new work |
| **Campaign list filters** (match old rows) | `CAMPAIGN_LOCATION_LIST_SCALE_IDS` — not the same as “creatable scales” |
| **Sort / rank only** | `LOCATION_SCALE_RANK_ORDER_LEGACY` — not parent/child rules |

**Create/edit** and `LOCATION_SCALE_FIELD_POLICY` use **first-class content scales** only (`CONTENT_LOCATION_SCALE_IDS`). **Legacy** region/subregion/district may still appear on persisted locations; **rank/sort** uses `LOCATION_SCALE_RANK_ORDER_LEGACY`. **Linked locations** on maps no longer target those legacy scales — use **MapZone** on parent maps (`zones/`). **Allowed parent/child** pairs are **not** inferred from order alone; they live in `scale/locationScale.policy.ts` (`ALLOWED_PARENT_SCALES_BY_SCALE`).

**Map content policy:** `LOCATION_SCALE_MAP_CONTENT_POLICY` is keyed by every `LocationScaleId` (including legacy keys with empty buckets) so the map model stays exhaustive — empty entries for region/subregion/district are **not** an endorsement of new authoring at those scales.

### Subfolders (re-exported by barrel)

| Folder | Responsibility |
|--------|----------------|
| `scale/` | Scale **business policy** (who may parent whom), **field policy** (categories, cell units, **grid geometries**, which form fields apply per scale), **rules** (valid scale id, rank, world check), **UI policy** (`locationScaleUi.policy.ts` — campaign list vs standalone create vs interior), **parent validation** (`validateParentChildScales` for hierarchy). |
| `map/` | Map **constants** (kinds, cell units by kind, object kinds), **types** (`LocationMapBase`, grid, cells, cell authoring, **`LocationMapAuthoredObjectRenderItem`**), **helpers** (`mapKindForLocationScale`, `getDefaultMapKindForScale` — derives map kind during save/bootstrap, `isCellUnitAllowedForScale`), **authored-object render derivation** (`deriveLocationMapAuthoredObjectRenderItems`, `locationMapAuthoredObjectRender.helpers.ts`), **placement policy** (what can be placed / linked on cells by scale), **validation** (grid, cells, map input, cell authoring structure). |
| `zones/` | **MapZone** — painted named areas on a map (`MapZone`, `MapZoneKindId`, `MAP_ZONE_KIND_META`). **`ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE`** / helpers: which zone kinds may be authored for each host location scale. Separate from `LOCATION_SCALE_FIELD_POLICY`, linked-location policy (`locationMapPlacement.policy.ts`), and the feature **map model** (`domain/model/map`, `domain/model/placedObjects`, `domain/model/policies`). Phase 1: shared types/policy only; paint UI and persistence deferred. |
| `transitions/` | Transition **kinds** (`LOCATION_TRANSITION_KIND_IDS`) and **shared types** (`LocationTransitionBase`, `from` / `to` shapes). |

### Shared vs feature: where map authoring content lives

- **`shared/domain/locations`** holds **cross-environment** domain code: vocabulary and types used by **client and server**, pure **validation**, persisted map **shapes**, **placement** and **transition** rules, and scale **policy** that APIs rely on. Prefer importing from `@/shared/domain/locations` here.
- **Feature map model** (no legacy `mapContent/` folder): split under `src/features/content/locations/domain/model/` — **`model/map/`** (cell fill / path / edge vocabulary, swatch and region keys, icon name ids, presentation constants), **`model/placedObjects/`** (placed-object registry, selectors, persistence, runtime), **`model/policies/`** (`LOCATION_SCALE_MAP_CONTENT_POLICY`). The server does **not** consume these modules today. Import from `@/features/content/locations/domain` (barrel re-exports `model`) or subpaths such as `.../domain/model/map` / `.../model/placedObjects`. **Presentation** (MUI icon maps, UI stroke tokens) lives under `domain/presentation/map/`. Map swatch hex values stay in `src/app/theme/mapColors.ts`.
- **`locationMap.types.ts` (two files):** Shared wire shapes live in **`shared/domain/locations/map/locationMap.types.ts`**. The locations feature also has **feature-local** map entity types in **`src/features/content/locations/domain/model/map/locationMap.types.ts`** (`LocationMap` with `campaignId`, etc.). Do not import the wrong one — prefer explicit paths or the barrel that matches your layer.
- If server-side validation of authored map payloads is added later, consider **promoting** policy and kind-id unions back into `shared` (or keep validation in the feature — avoid `server/` importing `src/features/` unless that is an explicit product decision).

### Tests

Under `shared/domain/locations/__tests__/`, mirroring source: e.g. `__tests__/scale/`, `__tests__/map/`, `__tests__/zones/`. Feature map policy tests: `src/features/content/locations/domain/model/policies/__tests__/`; placed-object selector tests: `model/placedObjects/__tests__/`.

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
- **Authored map content (types + per-scale policy):** `src/features/content/locations/domain/model/map/`, `model/placedObjects/`, and `model/policies/` — four **categories** of future editor content, each with stable ids and lightweight display metadata (`LOCATION_*_KIND_META`):
  1. **Cell fills** — whole-cell terrain / surface (`LOCATION_CELL_FILL_KIND_IDS`).
  2. **Path features** — linear / network strokes (`LOCATION_PATH_FEATURE_KIND_IDS`).
  3. **Edge features** — boundary features (`LOCATION_EDGE_FEATURE_KIND_IDS`).
  4. **Placed objects** — anchored / footprint props (`LOCATION_PLACED_OBJECT_KIND_IDS`).
  **`LOCATION_SCALE_MAP_CONTENT_POLICY`** lists which ids apply at **world**, **city**, and **floor** (other scales are empty until extended). Intended future tools: **paint** (fills + paths), **edge** (edges), **place** (objects). Not wired to persistence or UI in the first pass.
- **Client:** default map bootstrap, grid drafting, cell authoring mappers under `src/features/content/locations/domain/authoring/map/`; map model under `domain/model/`; display icons and map chrome under `domain/presentation/map/`; repo helpers `locationMapRepo.ts`.

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

### `authoring` folders (disambiguation)

Several folders use “authoring” in the name; they are **not** interchangeable:

- **`domain/authoring/map/`** — Client map bootstrap, `cellDraftToCellEntries` / `cellEntriesToDraft`, `gridLayoutDraft` (prune cell keys when grid dimensions change).
- **`components/authoring/`** — UI-adjacent helpers: **`draft/`** (grid draft types + persist/compare utilities), **`geometry/`** (hex/square overlay math and path SVG adapters).
- **`components/mapGrid/authoring/`** — Grid subtree only: hex/square **SVG authoring overlays** and **`useSquareEdgeBoundaryPaint`** (square edge tooling).

---

## Client feature layout (`src/features/content/locations/`)

| Area | Purpose |
|------|---------|
| `routes/` | List, create, edit, detail routes. Create and edit use the full-width workspace shell ([location-workspace.md](./location-workspace.md)); detail stays content-width for now. |
| `domain/forms/` | Form types, registry, mappers, config; **`rules/`** (sanitize, dependent-field policy, UI rules); **`setup/`** (create-flow helpers, entity ref picker). |
| `domain/repo/` | `locationRepo`, `locationMapRepo` — API/data access for lists and maps. |
| `domain/authoring/map/` | `bootstrapDefaultLocationMap` (client-side default map creation/update), `gridLayoutDraft` (prune cell keys when dimensions change), `cellAuthoringMappers` (draft ↔ `cellEntries`). Uses `getDefaultMapKindForScale` from shared domain to derive map kind. |
| `domain/model/` | **`model/map`**, **`model/placedObjects`**, **`model/policies`**, **`model/location`**, **`model/building`** — feature map vocabulary, placed-object registry, per-scale map content policy, location/transition types, building floor helpers. See **Shared vs feature** above. |
| `domain/authoring/editor/` | Map editor modes, tools (paint, draw, erase, place, select), palette/rail helpers, `useLocationMapEditorState`. |
| `domain/presentation/map/` | `locationMapUiStyles`, `locationMapIconNameMap`, `locationMapDisplayIcons` — map chrome styling and semantic icon name → MUI resolution. |
| `components/mapGrid/` | Shared **`GridEditor`** / **`HexGridEditor`**, cell/path/object layers, and **`mapGrid/authoring/`** (SVG overlays, square edge boundary-paint hook). |
| `components/workspace/` | Full-width map editor shell, **`LocationGridAuthoringSection`** (workspace-level orchestrator; dispatches to `GridEditor` or `HexGridEditor`), rail/header/canvas — [location-workspace.md](./location-workspace.md). |
| `components/` (other) | Cards, summaries, and presentation not covered above; prefer stable imports via `components/index.ts` where exported. |
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
4. **Rendering:** [`LocationGridAuthoringSection`](src/features/content/locations/components/workspace/LocationGridAuthoringSection.tsx) accepts a `gridGeometry` prop and renders `HexGridEditor` (hex) or `GridEditor` (square).

**Persistence:** `LocationMapGrid.geometry` is optional on the shared type and on the Mongoose schema (`enum: ['square', 'hex']`, not required). Legacy maps without the field work unchanged — they render using the scale policy default.

### Shared grid renderers (`src/features/content/locations/components/mapGrid/`)

| Component | Use |
|-----------|-----|
| `GridEditor` | Square grid — CSS grid layout, `aspectRatio: 1` cells. Used by encounters and square-scale locations. |
| `HexGridEditor` | Hex grid — CSS `clip-path` hexagons, absolute positioning with odd-q offset layout. Used by hex-scale locations only. |
| `gridCellStyles.ts` | `gridCellPalette` (border/background MUI paths), `gridCellSelectedShadow`, `gridCellSelectedInsetPx`. |
| `authoring/` | SVG path/region overlays for the location editor (`HexMapAuthoringSvgOverlay`, `SquareMapAuthoringSvgOverlay`) and `useSquareEdgeBoundaryPaint` for square edge strokes. |
| `__tests__/` | Grid-local tests (e.g. `mapGridCellVisualState` select-mode chrome). |

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
2. **Extend map rules:** prefer `map/locationMap.validation.ts` / `locationMapCellAuthoring.validation.ts` for structural checks; `locationMapPlacement.policy.ts` for “what may appear on a cell” by scale. For **authored map content** categories (fills, paths, edges, placed objects), extend `src/features/content/locations/domain/model/map/`, `model/placedObjects/`, and `model/policies/` (`LOCATION_SCALE_MAP_CONTENT_POLICY`) — keep it separate from `LOCATION_SCALE_FIELD_POLICY`. For **painted map zones** (region/subregion/district/hazard/territory/custom), extend `zones/mapZone.policy.ts` and `MAP_ZONE_KIND_IDS` — separate from linked-location lists.
3. **New transition kinds:** add to `LOCATION_TRANSITION_KIND_IDS` and any server checks; shared types in `transitions/`.
4. **Imports:** use the **barrel** `@/shared/domain/locations` for shared vocabulary and validation; use `@/features/content/locations/domain` (or `.../domain/model/...` / `.../domain/presentation/map/...`) for feature map model and presentation tokens. Canvas hooks: `@/ui/hooks` (see [location-workspace.md](./location-workspace.md) for how the editor uses them).
5. **Tests:** add shared tests under `shared/domain/locations/__tests__/scale/` or `__tests__/map/`; feature policy tests under `src/features/content/locations/domain/model/policies/__tests__/` (and related `model/` test folders); server tests next to services/domain in `server/features/content/locations/`.
6. **Hex geometry extensions:** geometry policy lives in `locationScaleField.policy.ts` (`allowedGeometries`, `defaultGeometry`). Grid math helpers are in `shared/domain/grid/gridHelpers.ts`. Rendering is in `mapGrid/HexGridEditor.tsx`. Do not add hex logic to encounter systems without a dedicated plan.
7. **Grid styling parity:** both `GridEditor` and `HexGridEditor` import border/shadow tokens from `src/features/content/locations/components/mapGrid/gridCellStyles.ts`. Keep this file updated when changing cell visuals.
8. **Workspace UI:** layout shell, building floors, zoom/pan route wiring — [location-workspace.md](./location-workspace.md).
