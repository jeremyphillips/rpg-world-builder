---
name: Shrink location edit files
overview: Reduce line count in `LocationEditRoute.tsx` (~1.6k lines) and `LocationGridAuthoringSection.tsx` (~1.5k lines) by extracting repeated JSX into small shell components, consolidating duplicated effects and submit branches, and splitting the grid component into focused hooks and presentational subcomponents—without changing domain behavior documented in `location-workspace.md`.
todos:
  - id: extract-map-canvas-column
    content: Extract LocationEditorMapCanvasColumn (toolbar + trays + LocationEditorCanvas + grid slot) from LocationEditRoute; unify 3 JSX copies
    status: completed
  - id: dedupe-map-load-effect
    content: Single hydrate helper/hook for listLocationMaps → form + gridDraft (campaign vs floor owner id)
    status: completed
  - id: trim-submit-and-panels
    content: Factor handleCampaignSubmit overlap; merge system/campaign LocationEditorSelectionPanel into one tree
    status: pending
  - id: grid-cell-overlay-paths
    content: Extract LocationMapCellAuthoringOverlay + LocationMapPathSvgPaths; hex boundary segment helper
    status: pending
  - id: grid-hooks-edge-layout
    content: Extract useLocationAuthoringGridLayout, useSquareEdgeBoundaryPaint, usePruneGridDraftOnDimensionChange
    status: pending
isProject: false
---

# Reduce size of LocationEditRoute and LocationGridAuthoringSection

## Context

- Workspace architecture is documented in [docs/reference/locations/location-workspace.md](docs/reference/locations/location-workspace.md): map toolbar, `useLocationMapEditorState`, `LocationGridAuthoringSection`, zoom/pan hooks, and select-mode resolvers should stay the **single sources of truth** for behavior; refactors should **move code**, not duplicate or fork interaction rules.
- [LocationEditRoute.tsx](src/features/content/locations/routes/LocationEditRoute.tsx) and [LocationGridAuthoringSection.tsx](src/features/content/locations/components/LocationGridAuthoringSection.tsx) are the two largest touchpoints; both are valid candidates for extraction.

---

## LocationEditRoute: main pain points

### 1. Triple-duplicated “map chrome + canvas + grid” block

The same structure appears **three** times (system patch branch ~1186–1244, building branch ~1361–1432, non-building campaign ~1448–1504):

- `LocationMapEditorToolbar` + conditional `LocationMapEditorPaintTray` + `LocationMapEditorDrawTray`
- `LocationEditorCanvas` with identical zoom/pan props
- `LocationGridAuthoringSection` with the same handler props; only **host** identity props and **empty state** differ (building shows “no floors” placeholder).

**Direction:** Extract a presentational component, e.g. `LocationEditorMapCanvasColumn` (under `components/workspace/` or `components/mapEditor/`), that accepts:

- Map chrome: `mapEditor`, `paintPaletteItems`, `drawPaletteItems`, `handlePaintChange`, `handleMapEditorModeChange`, `showMapEditorChrome`
- Canvas: zoom/pan props (unchanged)
- Grid: either a **render prop** `renderGrid()` or explicit `grid` ReactNode so building-specific empty UI stays one branch inside the shell

This alone removes **~120–180 lines** of repeated JSX and makes future toolbar changes single-edit.

### 2. Nearly identical `useEffect` blocks loading default maps

Lines ~309–348 (campaign location) and ~350–394 (building `activeFloorId`) both: `listLocationMaps` → pick default map → `setValue` grid fields → build `next` draft from `normalizeLocationMapAuthoringFields` + `cellEntriesToDraft` → `setGridDraft` / baseline.

**Direction:** Extract a function in the domain or a small hook `useHydrateLocationMapDraft` that takes `{ campaignId, mapOwnerLocationId, loc, setValue, setGridDraft, setGridDraftBaseline, geometryDefaultScale }` and contains **one** async load + cancel pattern. The route keeps two call sites (different `mapOwnerLocationId` and guards) but **one** implementation body.

### 3. `handleCampaignSubmit` building vs non-building overlap

Both paths: validate grid bootstrap → `toLocationInput` → `locationRepo.updateEntry` → `bootstrapDefaultLocationMap` with `normalizedAuthoringPayloadFromGridDraft` → `reset` + baseline update. Building adds floor name lookup and early validation for missing floor.

**Direction:** Extract inner helpers, e.g. `persistCampaignLocationMap(campaignId, locationId, values, draft, scaleForBootstrap)` and let the route compose building vs single-location **or** a single function with a discriminated `target: { kind: 'floor'; floorId: string; floorName: string } | { kind: 'self' }`.

### 4. Duplicate selection panels

`systemSelectionPanel` and `campaignSelectionPanel` (~1113–1155) differ only in `cellPanelProps` host fields.

**Direction:** One JSX tree with `hostLocationId` / `hostScale` / `hostName` computed once above the return (you already compute `mapHostLocationId`, `mapHostScale`, `mapHostName` for campaign paths—align system patch path to the same variables where semantics match).

### 5. Optional: region-paint cluster

`handleUpdateRegionEntry`, `handleCreateRegionPaint`, `handleSelectActiveRegionPaint`, `handleActiveRegionColorKeyChange`, `handleEditRegionInSelection`, and the `useEffect` that clears invalid `activeRegionId` (~460–541) can move to `**useLocationRegionPaintRail`** (or under `domain/mapEditor/`) if you want the route file slimmer; this is lower priority than (1)–(4).

---

## LocationGridAuthoringSection: main pain points

### 1. Large inline `renderMapCellIcons` (~958–1084)

Region overlay, linked-location icon, object icons, and select-hover outlines are self-contained.

**Direction:** Extract `**LocationMapCellAuthoringOverlay`** (or reuse/extend [LocationCellAuthoringPanel.tsx](src/features/content/locations/components/LocationCellAuthoringPanel.tsx) naming carefully to avoid confusion—likely a **cell overlay** name, not the existing panel). Props: `cell`, `draft` slices needed, `selectHoverTarget`, `mapUi`, `locationById`, `isHex`.

### 2. Duplicated path `<path>` rendering in two SVGs

Square overlay (~~1352–1370) and hex overlay (~~1422–1440) map `pathSvgData` with **identical** stroke-width selection logic.

**Direction:** Small component `**LocationMapPathSvgPaths`** taking `pathSvgData`, `mapUi`, `draft.mapSelection`, `selectHoverTarget`—used in both square and hex SVG parents.

### 3. Edge + geometry hooks

Natural splits (each ~80–200 lines when moved):


| Slice                                                                    | Suggested extraction                                                                                      |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `gridSizePx`, `squareGridGeometry`, `hexGridGeometry`, `cellCenterPx`    | `useLocationAuthoringGridLayout`                                                                          |
| Edge refs, `resolveEdgeFromClient`, capture handlers, `commitEdgeStroke` | `useSquareEdgeBoundaryPaint` (square-only; depends on `squareGridGeometry`, `cols`, `rows`)               |
| Resize pruning `useEffect` (217–318)                                     | `usePruneGridDraftOnDimensionChange` in `domain/maps/` or `hooks/`—pure draft update logic stays testable |


### 4. Select-mode pointer + `onCellClick` duplication

`handleSelectPointerMove` and the two `resolveSelectModeInteractiveTarget` branches inside `onCellClick` (with/without `skipGeometry`) repeat argument construction.

**Direction:** Helper `**buildSelectModeResolverArgs(draft, pathPickPolys, edgePickGeoms, isHex)`** or inline factory so `onCellClick` calls one resolver with `{ ...base, gx, gy, targetElement, skipGeometry }`.

### 5. Hex region boundary memos

`hexSelectedRegionBoundarySegments` and `hexHoverRegionBoundarySegments` duplicate “build `Set` of cell ids for region id → `hexExposedRegionBoundarySegments`”.

**Direction:** Shared helper `**hexRegionBoundarySegmentsForCells(cols, rows, hexSize, cellIds)`** with two call sites passing different id sets.

---

## Cross-file overlap (route ↔ grid)

- **Adjacency for path authoring:** [LocationEditRoute](src/features/content/locations/routes/LocationEditRoute.tsx) `handleAuthoringCellClick` and [LocationGridAuthoringSection](src/features/content/locations/components/LocationGridAuthoringSection.tsx) `pathSvgData` both use `parseGridCellId` + `getNeighborPoints` for preview vs commit. Consider a shared helper in `shared/domain/locations/map/` or existing path helpers, e.g. `tryExtendPathPreview(anchor, hover, chains, …)`—**only if** you want one place for neighbor rules; not required for line-count reduction.
- **Erase handling:** `handleEraseCell` in the route implements policy; the grid calls `onEraseCellClick`—no duplication to merge beyond keeping the callback API stable.

---

## Suggested order of work

1. **LocationEditRoute:** `LocationEditorMapCanvasColumn` (or equivalent) + merge selection panels + dedupe map-load effect + trim submit duplication.
2. **LocationGridAuthoringSection:** `LocationMapCellAuthoringOverlay` + `LocationMapPathSvgPaths` + hex boundary helper.
3. **LocationGridAuthoringSection:** `useLocationAuthoringGridLayout` + `useSquareEdgeBoundaryPaint` + prune-on-resize hook.
4. Optional: region-paint hook for route; select-resolver arg factory for grid.

---

## Testing / safety

- Existing tests: [locationEditorRail.types.test.ts](src/features/content/locations/components/workspace/locationEditorRail.types.test.ts), [mapGridCellVisualState.test.ts](src/features/content/locations/components/mapGrid/mapGridCellVisualState.test.ts), domain tests for edge/path—re-run after extractions.
- No behavior change intended: keep props to `LocationGridAuthoringSection` and public route behavior identical; prefer **pure moves** first, then micro-refactors with snapshot or manual smoke on select/draw/edge/building floor flows.

