# Location editor workspace (reference)

This document describes the **full-width create/edit shell** for campaign locations: layout components under `components/workspace/`, **building + floor** editing, and **shared canvas** hooks used by the map editor. For the broader locations domain (mental model, shared `grid/` and `locations/` packages, validation, server layout), see [locations.md](./locations.md).

Location create and edit routes render inside a full-width workspace via `AuthMainFocus` layout mode, triggered by `isAuthMainFocusPath` in `src/app/layouts/auth/auth-main-path.ts`.

**Canonical map authoring on the wire:** path kinds use `LOCATION_MAP_PATH_KIND_IDS` (`road` | `river`); edge kinds use `LOCATION_MAP_EDGE_KIND_IDS` (`wall` | `window` | `door`). Persisted `LocationMap` fields include `pathEntries` (per-chain `id`, `kind`, ordered `cellIds`) and `edgeEntries` (`edgeId`, `kind`). At persistence and API boundaries, `normalizeLocationMapAuthoringFields` / `normalizeLocationMapBaseAuthoring` (`shared/domain/locations/map/locationMapAuthoring.normalize.ts`) ensure `cellEntries`, `pathEntries`, and `edgeEntries` are always arrays (never `undefined`), including server `toDoc`, client `locationMapRepo` responses, `bootstrapDefaultLocationMap`, and save/load paths in `LocationEditRoute`.

**Geometry vs rendering:** Canonical authored→geometry lives in shared: `pathEntriesToPolylineGeometry` / `pathEntryToPolylineGeometry` compose `pathEntryToCenterlinePoints` into `Point2D[]` polylines (`locationMapPathPolyline.helpers.ts`); square **edge** boundaries use `edgeEntriesToSegmentGeometrySquare` (`locationMapEdgeGeometry.helpers.ts`, square only). Square pixel layout (`squareCellCenterPx`, `squareEdgeSegmentPxFromEdgeId`, …) is in `shared/domain/grid/squareGridOverlayGeometry.ts` and re-exported from `components/squareGridMapOverlayGeometry.ts`. **Renderer adapters** (non-canonical): `polylinePoint2DToSmoothSvgPath` and `pathEntriesToSvgPaths` in `components/pathOverlayRendering.ts` apply Catmull-Rom smoothing and SVG `d` strings only—do not add grid math there.

### Location map authored model (reference)

**What is persisted** on `LocationMap` (sparse, map-owned):

| Collection | Role |
|------------|------|
| **`cellEntries`** | Per-cell authoring: optional `linkedLocationId`, optional `objects[]`, optional `cellFillKind` (terrain/surface fill). |
| **`pathEntries`** | Map-level **roads** and **rivers** as ordered authored chains: each entry has `id`, `kind` (`road` \| `river`), and ordered `cellIds` (adjacent along the grid). |
| **`edgeEntries`** | Map-level **walls**, **windows**, and **doors** on shared cell boundaries: each entry has canonical undirected `edgeId` and `kind`. |

**Derived vs persisted**

- **Geometry is derived from authored entries** (cell placement, path chains, edge ids). It is **not** persisted.
- **`pathEntries` and `edgeEntries` are canonical inputs** to the geometry seam (`pathEntriesToPolylineGeometry`, `edgeEntriesToSegmentGeometrySquare` on square grids).
- **SVG path strings**, Catmull-Rom smoothing, and overlay styling are **render-layer outputs**, not source of truth.

**Square vs hex (as implemented today)**

- **Paths:** cell-chain authoring and centerline geometry work for **both** square and hex (neighbor rules in `gridHelpers`).
- **Edges:** boundary authoring, hit-testing, and segment geometry are **square-first** (`edgeEntriesToSegmentGeometrySquare`; hex edge boundaries are not modeled in shared geometry). Hex maps may still **store** `edgeEntries`, but overlay and tools are square-oriented; see **Open issues** for hex edges.

**Where things live**

- **Authoring types:** `shared/domain/locations/map/locationMap.types.ts` (`LocationMapAuthoringContent`, path/edge/cell entry shapes).
- **Normalization at boundaries:** `locationMapAuthoring.normalize.ts`.
- **Derived geometry (pixels, polylines, segments):** `locationMapPathPolyline.helpers.ts`, `locationMapEdgeGeometry.helpers.ts`, `squareGridOverlayGeometry.ts` / `hexGridMapOverlayGeometry.ts` as appropriate.
- **Feature SVG / smoothing:** `pathOverlayRendering.ts` and components such as `LocationGridAuthoringSection`.

---

## Client feature touchpoints

| Area | Purpose |
|------|---------|
| `src/features/content/locations/routes/` | Create and edit routes compose the workspace; detail stays content-width. |
| `components/workspace/` | Map-first editor shell — see below. |
| `components/LocationGridAuthoringSection.tsx` | Interactive grid preview; dispatches to `GridEditor` or `HexGridEditor` by geometry. Renders SVG overlays for paths (both geometries) and edges (square only). |

---

## Workspace layout (`components/workspace/`)

The workspace is composed of feature-owned components:

| Component | Role |
|-----------|------|
| `LocationEditorWorkspace` | Outer flex column: header slot + body row (canvas + right rail). Body row capped at `calc(100vh - headerHeight)`. |
| `LocationEditorHeader` | Sticky header: title, ancestry breadcrumbs, global save button, right-rail toggle, optional actions (e.g. delete). |
| `LocationEditorCanvas` | Flex-filling canvas region with zoom/pan transform wrapper. Hosts `LocationGridAuthoringSection` as child content and renders `ZoomControl` (fixed positioned). |
| `LocationEditorRightRail` | Collapsible right rail (default open). Uses CSS width transition with `overflow: hidden` outer and scrollable inner. |
| `LocationEditorRailSectionTabs` | Right-rail tabs: **Location** (location metadata forms), **Map** (active tool palette / hints for place, draw, paint, erase, select), **Selection** (inspector). Section state is separate from toolbar mode. |
| `LocationEditorSelectionPanel` | Selection section dispatcher: cell / object / path / edge inspectors from authored map data; region remains a placeholder. |
| `LocationAncestryBreadcrumbs` | Builds a breadcrumb trail from `parentId` chain; used in the header. |
| `BuildingFloorStrip` | **Building edit only:** floor tabs + add-floor control above the canvas (see **Building scale** below). |
| `locationEditor.constants.ts` | Shared pixel constants: `LOCATION_EDITOR_HEADER_HEIGHT_PX`, `LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX`, `LOCATION_EDITOR_TOOLBAR_WIDTH_PX` (map toolbar), plus `LOCATION_EDITOR_PAINT_TRAY_WIDTH_PX` and `LOCATION_EDITOR_DRAW_TRAY_WIDTH_PX` when those tools are active. |

---

## Map editor toolbar and related UI

When the map grid is shown in create/edit (`showMapGridAuthoring` in `LocationEditRoute.tsx`), the canvas column includes **map editor chrome** to the left of `LocationEditorCanvas`: a vertical toolbar and, depending on mode, a slim **paint** swatch column and/or **draw** kind column.

### `LocationMapEditorToolbar`

| | |
|---|---|
| **File** | `src/features/content/locations/components/mapEditor/LocationMapEditorToolbar.tsx` |
| **Width** | `LOCATION_EDITOR_TOOLBAR_WIDTH_PX` (`locationEditor.constants.ts`) |
| **Control** | MUI vertical `ToggleButtonGroup` (exclusive), icon-only buttons |

**Modes** (`LocationMapEditorMode` in `domain/mapEditor/locationMapEditor.types.ts`):

| Mode | Purpose |
|------|---------|
| `select` | Default: inspect/select authored content; map pan works from the grid when appropriate. |
| `paint` | **Fill-like** authoring: paint **cell fills** (`cellFillByCellId`). Active swatch from `LocationMapEditorPaintTray` + `activePaint`. Region painting is intended to extend this tool later. |
| `place` | **Discrete** placement only: **linked content** (child locations) and **map objects** (props), per `LOCATION_SCALE_MAP_CONTENT_POLICY`. Palette: `getPlacePaletteItemsForScale` → `LocationMapEditorPlacePanel`; selection `activePlace` (`linked-content` \| `map-object`). Resolver: `resolvePlacedKindToAction`. |
| `draw` | **Line/boundary** authoring: **paths** and **edges** (per policy). Palette: `getGroupedDrawPaletteForScale` → toolbar `LocationMapEditorDrawTray` + Map rail `LocationMapEditorDrawPanel`; selection `activeDraw` (`path` \| `edge`). Path segments use `pathAnchorCellId`; edges use boundary-paint in `LocationGridAuthoringSection`. Resolver: `resolveDrawSelectionToAction`. |
| `erase` | **Removal**: click uses `resolveEraseTargetAtCell` (edge → object → path → link → **cell fill**). Stroke-drag in erase mode clears terrain fill like the former clear-fill tool. Edge hits can use `onEraseEdge` for direct boundary targeting. |

**State hook:** `useLocationMapEditorState` holds `mode`, `activePaint`, `activePlace`, `activeDraw`, `pathAnchorCellId` (for **Draw → path**), and `pendingPlacement` for the linked-location modal. Leaving **place** clears place selection and pending placement; leaving **draw** clears draw selection and path anchor.

**Layout:** `LocationEditRoute` sets `leftMapChromeWidthPx` to `LOCATION_EDITOR_TOOLBAR_WIDTH_PX` plus paint and/or draw tray widths when those modes are active. Passed to `LocationGridAuthoringSection` as `leftChromeWidthPx`.

### Related components

| Component | Role |
|-----------|------|
| `LocationMapEditorPaintTray` | Shown when `mode === 'paint'`; swatches from `getPaintPaletteItemsForScale`. |
| `LocationMapEditorDrawTray` | Shown when `mode === 'draw'`; compact kind buttons from `getGroupedDrawPaletteForScale`. |
| `LocationMapEditorPlacePanel` | Map rail when `mode === 'place'`; groups **Linked content** vs **Map objects** (`getPlacePaletteItemsForScale`). |
| `LocationMapEditorDrawPanel` | Map rail when `mode === 'draw'`; groups **Paths** vs **Edges** when both exist. |
| `LocationGridAuthoringSection` | Renders `GridEditor` or `HexGridEditor`, applies fills, icons, map-editor pointer behavior, and SVG overlays for paths (both geometries) and edges (square only). |

---

## Path authoring (cell-chain model)

Paths (roads, rivers) use a **cell-chain** interaction model that works on both **square** and **hex** grids. The user selects adjacent cells sequentially and a smooth curve is generated through the chain of cell centers.

**Interaction flow:**

1. Select a path tool (road or river) from the **Draw** tool (toolbar + Map rail).
2. **Click first cell** — sets the anchor; cell receives a primary-color inset ring highlight.
3. **Hover adjacent cell** — a smooth curve preview extends the current chain to include the hovered cell. Non-adjacent cells show no preview.
4. **Click adjacent cell** — extends the current authored path chain (same kind) when the anchor is the chain end; otherwise starts a new chain. The anchor moves to the clicked cell so the next click extends further.
5. **Continue clicking** adjacent cells to grow the chain. The entire chain renders as one smooth Catmull-Rom spline.
6. **End the chain** by pressing **Escape**, clicking the current anchor cell, or switching tools.

**Smooth curve rendering:** all committed path segments plus the hover-cell preview are rendered as a single SVG `<path>` per chain using Catmull-Rom to cubic Bézier interpolation (`chainToSmoothSvgPath` in `pathOverlayRendering.ts`). The `pathSvgData` memo in `LocationGridAuthoringSection` extends the active chain with the hover cell so the preview is visually seamless with committed segments.

**Hex click-gap handling:** hex cells use CSS `clip-path` for hexagonal shapes, which can leave narrow dead zones between cells. `resolveNearestHexCell` (in `hexGridMapOverlayGeometry.ts`) resolves pointer positions to the nearest hex center, used by both the fallback click handler and the hover resolver to ensure clicks and previews work even when the pointer lands between cells.

**Adjacency:** consecutive cells in an authored path chain are geometry-aware. Both the client (`handleAuthoringCellClick` in **Draw** mode in `LocationEditRoute.tsx`, `pathSvgData` memo) and the server-side validation (`validatePathEntriesStructure` in `locationMapFeatures.validation.ts`) use `getNeighborPoints` from `shared/domain/grid/gridHelpers.ts`, which handles both square orthogonal neighbors and hex offset-column neighbors.

**Persistence:** paths are stored on the map as `pathEntries`: each entry has an `id`, a `kind` (`road` | `river`), and ordered `cellIds` for that chain. This is the canonical authored model; SVG smoothing is a render concern.

**Key modules:**

| Module | Exports |
|--------|---------|
| `components/pathOverlayRendering.ts` | `pathEntriesToSvgPaths` (path chains → SVG `d` strings), `chainToSmoothSvgPath` (Catmull-Rom to cubic Bézier) |
| `components/hexGridMapOverlayGeometry.ts` | `hexCellCenterPx`, `hexOverlayDimensions`, `resolveNearestHexCell` |
| `components/squareGridMapOverlayGeometry.ts` | `squareCellCenterPx`, `squareEdgeSegmentPxFromEdgeId` |
| `shared/domain/grid/gridHelpers.ts` | `getNeighborPoints` (geometry-aware: square + hex offset-column) |
| `shared/domain/locations/map/locationMapFeatures.validation.ts` | `validatePathEntriesStructure` (accepts `geometry` param) |
| `shared/domain/locations/map/locationMapPathAuthoring.helpers.ts` | `removePathChainSegment` (erase one step along a chain) |

**Palette filtering:** `LocationEditRoute` builds **place** items from `getPlacePaletteItemsForScale` (objects/links only). **Draw** items come from `getGroupedDrawPaletteForScale`; on **hex** geometry, only **path** kinds are shown (edges are square-first; see **Open issues**).

---

## Edge authoring (boundary-paint model)

Edges (walls, windows, doors) use a **boundary-paint** interaction model on **square grids**. Instead of two-click placement through cell centers, the pointer resolves the nearest cell-boundary edge:

1. **Hover** — moving over the grid shows a dashed preview on the nearest edge boundary.
2. **Pointer down** — starts an edge stroke; the first boundary is added and the axis locks to horizontal or vertical based on the clicked edge's orientation.
3. **Drag** — crossing neighboring boundaries adds them to the stroke. Edges are constrained to be **collinear** (same boundary line) and **sequential** (next cell along that line), preventing branches from hand jitter.
4. **Pointer up** — commits the stroke to the draft.
5. **Shift held** — temporarily unlocks the axis, allowing direction changes mid-stroke for L-shaped or cornered walls. The new direction becomes the locked axis when Shift is released.

**Pointer event architecture:** when an edge tool is active, `LocationGridAuthoringSection` attaches **capture-phase** pointer handlers (`onPointerDownCapture`, `onPointerMoveCapture`, `onPointerUpCapture`) on the grid container Box. Capture-phase fires before child elements, so cell-level `stopPropagation` cannot block edge detection. The container also sets `cursor: crosshair` with `& * { cursor: crosshair !important }` to override the canvas pan handler's `grab` cursor in gap areas.

**Key modules:**

| Module | Exports |
|--------|---------|
| `domain/mapEditor/edgeAuthoring.ts` | `resolveNearestCellEdgeSide`, `resolveEdgeTargetFromGridPosition`, `applyEdgeStrokeToDraft` (replace/no-op rules), `shouldAcceptStrokeEdge` (axis lock + collinearity + adjacency), `areEdgesAdjacent`, `getSquareEdgeOrientation`, types `ResolvedEdgeTarget`, `EdgeOrientation` |
| `squareGridMapOverlayGeometry.ts` | `squareEdgeSegmentPxFromEdgeId` for rendering committed and preview edges |
| `domain/mapEditor/resolveEraseTarget.ts` | `resolveEraseEdgeByEdgeId` for precise edge-specific erase |
| `LocationGridAuthoringSection` | Capture-phase pointer handlers, stroke refs (`edgeStrokeActive`, `edgeStrokeSeen`, `edgeStrokeEdgeIds`, `edgeStrokeLockedAxis`, `edgeStrokeLastTarget`, `shiftHeld`), SVG overlay for hover preview and stroke accumulation |

**Stroke constraint rules (`shouldAcceptStrokeEdge`):**
1. **Axis lock** — the initial click locks the axis (horizontal or vertical). Subsequent edges must match unless Shift is held.
2. **Collinearity** — same-axis edges must share the same boundary line (same row index for horizontal, same column index for vertical).
3. **Sequential** — the running index along the boundary must differ by exactly 1 from the last accepted edge.
4. **Shift override** — when Shift is held, adjacency is checked loosely (shared or neighboring cells) and axis switches to the candidate's orientation.

**Replace/overwrite rules:** same kind on same edge = no-op; different kind replaces in place; empty edge = add.

**Erase:** in Erase mode, the pointer resolves the nearest edge boundary and removes that edge by canonical `edgeId` (`onEraseEdge`). Cell-level erase (`resolveEraseTargetAtCell`) still handles objects, path segments along chains, and links.

**Persistence:** edges are stored on the map as `edgeEntries`: `{ edgeId, kind }` with no per-feature id; `edgeId` is the canonical shared boundary key (`between:cellA|cellB`).

**Edge rendering:** committed edges render at 15px stroke width on the cell boundary (gutter). Wall uses near-opaque text color; window uses dashed info-blue; door uses warning-amber. The `EdgeOrientation` type is designed as a union (`'horizontal' | 'vertical'`) extensible for hex grids (`'hex-a' | 'hex-b' | 'hex-c'`).

---

## Open issues

### 1. Hex maps: no edge overlay — edge palette entries hidden

Edge authoring (walls, windows, doors) is implemented for **square grids only**. The boundary-paint pointer model, edge geometry resolution, and SVG overlay all assume square cell boundaries. On **hex** geometry, edge palette items are filtered out so users cannot select tools that have no visual feedback. Existing edge data stored against a hex grid is preserved but not rendered.

**Direction:** hex edge authoring would require hex-specific boundary resolution (6 edges per cell with 3 orientations), hit-testing against hex edge geometry, and a hex edge SVG overlay. The `EdgeOrientation` type already includes placeholder values for hex (`'hex-a' | 'hex-b' | 'hex-c'`).

### 2. Canvas pan vs reliable clicks (place / draw path)

Map pan is implemented with `useCanvasPan` on the canvas wrapper. Three layers of hardening are now in place:

1. **`suppressCanvasPanOnCells`** — in **place** mode and **draw → path** mode, cell `pointerdown`/`pointerup` events call `stopPropagation` so the canvas pan handler never starts a drag from cell clicks.
2. **Window-level `pointerup` safety net** — `useCanvasPan` registers a `window` `pointerup` listener that clears drag state even when a child stops propagation, preventing stranded `isDragging` / grabbing cursor.
3. **`hasDragMoved` guard** — `LocationGridAuthoringSection` checks `hasDragMoved()` before dispatching `onCellClick`, matching the pattern used by `EncounterGrid`. This blocks accidental cell actions from drag gestures that started outside cells.

**Remaining scope:** switching to `pointerup`-based placement (instead of browser `click`) with a movement threshold would further improve reliability on trackpads. This is deferred.

### 3. Path chain preview responsiveness

The smooth curve preview (hover → smooth Catmull-Rom spline) recalculates the full chain curve on every pointer move. On long chains or slower machines this can feel choppy. A potential optimization would be to cache the committed portion of the chain curve and only recompute the last 2–3 segments when the hover cell changes.

---

## Building scale (special edit workspace)

For **`scale === building`** (campaign edit only), the editor is **building-centric** but **maps live on floor children**, not on the building record:

- **Floors** are separate locations: `scale: floor`, `parentId` = building id. Each floor has its own default map (normal persistence — no merged multi-floor document).
- **UI:** a **`BuildingFloorStrip`** sits under the header in the canvas column (full-width strip). Tabs show **Floor 1**, **Floor 2**, … (labels from sorted order); **+ Add floor** creates the next floor + bootstraps its map. Only **one** floor's grid is mounted at a time (`activeFloorId` in route state; URL stays `/locations/:buildingId/edit`).
- **Save** updates the **building** location (metadata, etc.) and **bootstraps the active floor's** map. If there are no floors yet, save is disabled until at least one floor exists.
- **Code:** helpers in `domain/building/buildingWorkspaceFloors.ts`; branching in `LocationEditRoute.tsx` (map load/save keyed by `activeFloorId`, `hostScale: 'floor'` for grid authoring). Out of scope for this pass: basement labels, floor reorder/delete UX, stacked canvases.

---

## Shared canvas hooks (`src/ui/hooks/`)

Zoom and pan behavior is shared between the location editor and encounter active route via reusable hooks:

| Export | Role |
|--------|------|
| `useCanvasZoom` | Zoom state, `zoomIn`/`zoomOut`/`zoomReset`, `zoomControlProps` spread for `ZoomControl`, `wheelContainerRef` (non-passive listener for Ctrl/Cmd + scroll / trackpad pinch). `bindResetPan` coordinates pan reset with zoom reset. |
| `useCanvasPan` | Pan state, pointer drag handlers (`pointerHandlers` spread), `isDragging`, `hasDragMoved()` (distinguishes click from drag), `resetPan`. Includes a window-level `pointerup` listener so drag state is always cleared even when children stop propagation. |
| `CanvasPoint` | Shared type `{ x: number; y: number }`. |

Both hooks are used at the route level; derived values are passed down to canvas/grid components as props.

---

## Pointers for the next agent (workspace)

1. **Workspace layout changes:** modify components under `components/workspace/`; constants in `locationEditor.constants.ts`. Do not add workspace layout logic to the generic content template system.
2. **Zoom/pan enhancements:** extend `useCanvasZoom` / `useCanvasPan` in `src/ui/hooks/`; both location and encounter features consume them. `ZoomControl` supports `positioning` prop (`'fixed'` default, `'absolute'` for container-relative).
3. **Focus-mode routes:** add new full-width routes by extending the regex in `src/app/layouts/auth/auth-main-path.ts`.
4. **Path authoring:** persisted model is `pathEntries` on `LocationMap` (ordered `cellIds` per chain). Chain-building UX lives in `LocationEditRoute.tsx` (`handleAuthoringCellClick` in **Draw** mode); smooth curve rendering in `pathOverlayRendering.ts` (`pathEntriesToSvgPaths`); hex geometry helpers in `hexGridMapOverlayGeometry.ts`. The `pathSvgData` memo in `LocationGridAuthoringSection` unifies committed and preview curves. Tests in `pathOverlayRendering.test.ts` and `hexGridMapOverlayGeometry.test.ts`.
5. **Edge authoring:** edge logic lives under `domain/mapEditor/edgeAuthoring.ts` with tests in `edgeAuthoring.test.ts`; grid integration in `LocationGridAuthoringSection.tsx`. Before changing behavior, read **Edge authoring** and **Open issues** above (hex edge gap).
6. **Path preview performance:** if the chain preview feels sluggish, consider caching the committed chain curve and only recomputing the tail segments on hover. See **Open issues §3**.

For domain, map policy, transitions, grid geometry policy, and hex rendering math, see [locations.md](./locations.md) (section *Pointers for the next agent*).
