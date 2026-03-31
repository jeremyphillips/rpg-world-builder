# Location editor workspace (reference)

This document describes the **full-width create/edit shell** for campaign locations: layout components under `components/workspace/`, **building + floor** editing, and **shared canvas** hooks used by the map editor. For the broader locations domain (mental model, shared `grid/` and `locations/` packages, validation, server layout), see [locations.md](./locations.md).

Location create and edit routes render inside a full-width workspace via `AuthMainFocus` layout mode, triggered by `isAuthMainFocusPath` in `src/app/layouts/auth/auth-main-path.ts`.

---

## Client feature touchpoints

| Area | Purpose |
|------|---------|
| `src/features/content/locations/routes/` | Create and edit routes compose the workspace; detail stays content-width. |
| `components/workspace/` | Map-first editor shell — see below. |
| `components/LocationGridAuthoringSection.tsx` | Interactive grid preview; dispatches to `GridEditor` or `HexGridEditor` by geometry. |

---

## Workspace layout (`components/workspace/`)

The workspace is composed of feature-owned components:

| Component | Role |
|-----------|------|
| `LocationEditorWorkspace` | Outer flex column: header slot + body row (canvas + right rail). Body row capped at `calc(100vh - headerHeight)`. |
| `LocationEditorHeader` | Sticky header: title, ancestry breadcrumbs, global save button, right-rail toggle, optional actions (e.g. delete). |
| `LocationEditorCanvas` | Flex-filling canvas region with zoom/pan transform wrapper. Hosts `LocationGridAuthoringSection` as child content and renders `ZoomControl` (fixed positioned). |
| `LocationEditorRightRail` | Collapsible right rail (default open) containing all form fields. Uses CSS width transition with `overflow: hidden` outer and scrollable inner. |
| `LocationAncestryBreadcrumbs` | Builds a breadcrumb trail from `parentId` chain; used in the header. |
| `BuildingFloorStrip` | **Building edit only:** floor tabs + add-floor control above the canvas (see **Building scale** below). |
| `locationEditor.constants.ts` | Shared pixel constants: `LOCATION_EDITOR_HEADER_HEIGHT_PX`, `LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX`, `LOCATION_EDITOR_TOOLBAR_WIDTH_PX` (map toolbar), plus paint-tray width when the paint tool is active. |

---

## Map editor toolbar and related UI

When the map grid is shown in create/edit (`showMapGridAuthoring` in `LocationEditRoute.tsx`), the canvas column includes **map editor chrome** to the left of `LocationEditorCanvas`: a vertical toolbar and, depending on mode, a slim paint tray.

### `LocationMapEditorToolbar`

| | |
|---|---|
| **File** | `src/features/content/locations/components/mapEditor/LocationMapEditorToolbar.tsx` |
| **Width** | `LOCATION_EDITOR_TOOLBAR_WIDTH_PX` (`locationEditor.constants.ts`) |
| **Control** | MUI vertical `ToggleButtonGroup` (exclusive), icon-only buttons |

**Modes** (`LocationMapEditorMode` in `domain/mapEditor/locationMapEditor.types.ts`):

| Mode | Purpose |
|------|---------|
| `select` | Default: click cells to select and focus the cell rail; map pan works from the grid (pointer events not consumed for placement). |
| `place` | Place **objects**, **paths**, **edges**, or **linked locations** (per scale). Choice of *what* to place comes from the **Place** panel in the right rail (`LocationMapEditorPlacePanel`), driven by `getGroupedPlacePaletteForScale` and `activePlace` in `useLocationMapEditorState`. |
| `paint` | Paint **cell fills**; **active** swatch from `LocationMapEditorPaintTray` + `activePaint`. Stroke gestures on cells (pointer down / enter / up) update `cellFillByCellId`. |
| `clear-fill` | Stroke to clear terrain fill on cells without removing links/objects/paths/edges. |
| `erase` | Click a cell to remove the highest-priority feature there (`resolveEraseTargetAtCell`: edge → object → path → link). |

**State hook:** `useLocationMapEditorState` (`domain/mapEditor/useLocationMapEditorState.ts`) holds `mode`, `activePaint`, `activePlace`, `pathAnchorCellId` for two-click path segments, and `pendingPlacement` for the linked-location modal. Switching away from **place** clears anchors and pending placement. Edge placement no longer uses a two-click anchor; it uses **boundary-paint** (see below).

**Layout:** `LocationEditRoute` sets `leftMapChromeWidthPx` to `LOCATION_EDITOR_TOOLBAR_WIDTH_PX` plus `LOCATION_EDITOR_PAINT_TRAY_WIDTH_PX` only while `mode === 'paint'`. That value is passed to `LocationGridAuthoringSection` as `leftChromeWidthPx` so the grid width accounts for left chrome.

### Related components

| Component | Role |
|-----------|------|
| `LocationMapEditorPaintTray` | Shown when `mode === 'paint'`; swatches from `getPaintPaletteItemsForScale`. |
| `LocationMapEditorPlacePanel` | Shown when `mode === 'place'`; cards for objects / paths / edges (and link flows resolved by `resolvePlacedKindToAction`). |
| `LocationGridAuthoringSection` | Renders `GridEditor` or `HexGridEditor`, applies fills, icons, map-editor pointer behavior, and **square-only** path/edge SVG overlay (see **Open issues** below). |

---

## Edge authoring (boundary-paint model)

Edges (walls, windows, doors) use a **boundary-paint** interaction model on **square grids**. Instead of two-click placement through cell centers, the pointer resolves the nearest cell-boundary edge:

1. **Hover** — moving over the grid shows a dashed preview on the nearest edge boundary.
2. **Pointer down** — starts an edge stroke; the first boundary is added.
3. **Drag** — crossing neighboring boundaries adds them to the stroke (deduplicated).
4. **Pointer up** — commits the stroke to the draft.

**Key modules:**
- `domain/mapEditor/edgeAuthoring.ts` — pure helpers: `resolveNearestCellEdgeSide`, `resolveEdgeTargetFromGridPosition`, `applyEdgeStrokeToDraft` (with replace/no-op rules).
- `squareGridMapOverlayGeometry.ts` — `squareEdgeSegmentPxFromEdgeId` for rendering committed and preview edges.
- `LocationGridAuthoringSection` — wrapper-level pointer handlers resolve edge targets and manage stroke state; SVG overlay renders both hover preview and accumulated stroke.

**Replace/overwrite rules:** same kind on same edge = no-op; different kind replaces in place; empty edge = add.

**Erase:** in Erase mode, the pointer resolves the nearest edge boundary and removes that specific edge feature (`onEraseEdge`). Cell-level erase (`resolveEraseTargetAtCell`) still handles objects, paths, and links.

### Open issues

### 1. Hex maps: no path/edge overlay — palette entries hidden

`LocationGridAuthoringSection` draws persisted path segments, edge features, and edge previews only when the map is **square** (`squareGridGeometry && !isHex`). On **hex** geometry, that SVG layer is omitted.

**Current mitigation:** `LocationEditRoute` filters `placePaletteItems` to **exclude** `path` and `edge` categories when `gridGeometry === 'hex'`, so users cannot select tools that have no visual feedback. Existing path/edge data stored against a hex grid is preserved but not rendered.

**Long-term direction:** Add hex-aware segment geometry (`hexGridMapOverlayGeometry.ts` with hex cell-center and shared-edge helpers), use `getNeighborPoints` from `shared/domain/grid/gridHelpers.ts` for adjacency in `handlePlaceCell`, and add a hex SVG overlay branch in `LocationGridAuthoringSection`. See [locations.md](./locations.md) *Grid geometry* and *What is deferred* for hex scope.

### 2. Canvas pan vs reliable clicks (place mode)

Map pan is implemented with `useCanvasPan` on the canvas wrapper. Three layers of hardening are now in place:

1. **`suppressCanvasPanOnCells`** — in **place** mode, cell `pointerdown`/`pointerup` events call `stopPropagation` so the canvas pan handler never starts a drag from cell clicks.
2. **Window-level `pointerup` safety net** — `useCanvasPan` registers a `window` `pointerup` listener that clears drag state even when a child stops propagation, preventing stranded `isDragging` / grabbing cursor.
3. **`hasDragMoved` guard** — `LocationGridAuthoringSection` checks `hasDragMoved()` before dispatching `onCellClick`, matching the pattern used by `EncounterGrid`. This blocks accidental cell actions from drag gestures that started outside cells.

**Remaining scope:** switching to `pointerup`-based placement (instead of browser `click`) with a movement threshold would further improve reliability on trackpads. This is deferred.

---

## Building scale (special edit workspace)

For **`scale === building`** (campaign edit only), the editor is **building-centric** but **maps live on floor children**, not on the building record:

- **Floors** are separate locations: `scale: floor`, `parentId` = building id. Each floor has its own default map (normal persistence — no merged multi-floor document).
- **UI:** a **`BuildingFloorStrip`** sits under the header in the canvas column (full-width strip). Tabs show **Floor 1**, **Floor 2**, … (labels from sorted order); **+ Add floor** creates the next floor + bootstraps its map. Only **one** floor’s grid is mounted at a time (`activeFloorId` in route state; URL stays `/locations/:buildingId/edit`).
- **Save** updates the **building** location (metadata, etc.) and **bootstraps the active floor’s** map. If there are no floors yet, save is disabled until at least one floor exists.
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
4. **Map toolbar / path-edge placement:** new tools live under `components/mapEditor/` and `domain/mapEditor/`; grid integration in `LocationGridAuthoringSection.tsx`. Before changing behavior, read **Open issues** above (hex overlay gap, pan vs click).

For domain, map policy, transitions, grid geometry policy, and hex rendering math, see [locations.md](./locations.md) (section *Pointers for the next agent*).
