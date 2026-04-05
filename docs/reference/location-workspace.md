# Location editor workspace (reference)

This document describes the **full-width create/edit shell** for locations in a campaign: layout components under `components/workspace/`, **building + floor** editing, and **shared canvas** hooks used by the map editor. For the broader locations domain (mental model, shared `grid/` and `locations/` packages, validation, server layout), see [locations.md](./locations.md).

Location create and edit routes render inside a full-width workspace via `AuthMainFocus` layout mode, triggered by `isAuthMainFocusPath` in `src/app/layouts/auth/auth-main-path.ts`.

**Canonical map authoring on the wire:** path kinds use `LOCATION_MAP_PATH_KIND_IDS` (`road` | `river`); edge kinds use `LOCATION_MAP_EDGE_KIND_IDS` (`wall` | `window` | `door`). Persisted `LocationMap` fields include `pathEntries` (per-chain `id`, `kind`, ordered `cellIds`) and `edgeEntries` (`edgeId`, `kind`). At persistence and API boundaries, `normalizeLocationMapAuthoringFields` / `normalizeLocationMapBaseAuthoring` (`shared/domain/locations/map/locationMapAuthoring.normalize.ts`) ensure `cellEntries`, `pathEntries`, and `edgeEntries` are always arrays (never `undefined`), including server `toDoc`, client `locationMapRepo` responses, `bootstrapDefaultLocationMap`, and save/load paths in `LocationEditRoute` (full-width UI is composed through **`LocationEditHomebrewWorkspace`** or **`LocationEditSystemPatchWorkspace`** — see **Workspace layout**).

**Geometry vs rendering:** Canonical authored→geometry lives in shared: `pathEntriesToPolylineGeometry` / `pathEntryToPolylineGeometry` compose `pathEntryToCenterlinePoints` into `Point2D[]` polylines (`locationMapPathPolyline.helpers.ts`); square **edge** boundaries use `edgeEntriesToSegmentGeometrySquare` (`locationMapEdgeGeometry.helpers.ts`, square only). Square pixel layout (`squareCellCenterPx`, `squareEdgeSegmentPxFromEdgeId`, `resolveSquareCellIdFromGridLocalPx`, …) is in `shared/domain/grid/squareGridOverlayGeometry.ts` and re-exported from `components/authoring/geometry/squareGridMapOverlayGeometry.ts`. **Renderer adapters** (non-canonical): `polylinePoint2DToSmoothSvgPath` and `pathEntriesToSvgPaths` in `components/authoring/geometry/pathOverlayRendering.ts` apply Catmull-Rom smoothing and SVG `d` strings only—do not add grid math there.

**Authored base-map layer order (square editor and combat underlay should match intent):** cell fills / region tint → **paths** → **edges** → **authored object icons** (cell-anchored). The path/edge SVG overlay is stacked **below** the cell grid (`SquareMapAuthoringSvgOverlay` z-order under `GridEditor`) so object icons inside cells remain visible. Object display rules align with `deriveLocationMapAuthoredObjectRenderItems` / `LocationMapAuthoredObjectRenderItem` in `shared/domain` (see `locationMapAuthoredObjectRender.helpers.ts`).

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
- **Edges:** boundary authoring, hit-testing, and segment geometry are **square-first** (`edgeEntriesToSegmentGeometrySquare`; hex edge boundaries are not modeled in shared geometry). Hex maps may still **store** `edgeEntries`; the editor uses **constrained** hex behavior (no edge overlay/tools; info alert when stored edges exist). See **Open issues §1**.

**Where things live**

- **Authoring types:** `shared/domain/locations/map/locationMap.types.ts` (`LocationMapAuthoringContent`, path/edge/cell entry shapes).
- **Normalization at boundaries:** `locationMapAuthoring.normalize.ts`.
- **Derived geometry (pixels, polylines, segments):** `locationMapPathPolyline.helpers.ts`, `locationMapEdgeGeometry.helpers.ts`, `squareGridOverlayGeometry.ts` / `hexGridMapOverlayGeometry.ts` as appropriate.
- **Feature SVG / smoothing:** `components/authoring/geometry/pathOverlayRendering.ts` and components such as `LocationGridAuthoringSection`.

### Location map styling

Presentation is split so hex/terrain colors, overlay rules, and grid chrome stay traceable:

| Layer | Where | Role |
|--------|--------|------|
| **Primitives & map colors** | `src/app/theme/colorPrimitives.ts`, `mapColors.ts` | Hex scales; terrain swatches (`baseMapSwatchColors`); region preset colors (`baseMapRegionColors`). |
| **Map UI tokens** | `domain/presentation/map/locationMapUiStyles.ts` | Stroke widths, opacities, SVG/path/edge emphasis, region overlay placeholders; `resolveLocationMapUiStyles(theme)` for palette-dependent strokes. |
| **Grid cells** | `components/mapGrid/gridCellStyles.ts` | `gridCellPalette` (MUI paths for borders/backgrounds) and selected inset shadow — shared by `GridEditor` / `HexGridEditor`. |
| **Cell hover / selection chrome (Select mode)** | `components/mapGrid/mapGridCellVisualState.ts` | Pure helpers `shouldApplyCellHoverChrome`, `isSelectHoverChromeSuppressed`, `shouldApplyCellSelectedChrome`; re-exported from `components/mapGrid/index.ts`. |

App-wide MUI theme (`palette`, etc.) still applies; map-specific tuning should go through these modules rather than ad hoc values in components. See [color-theming.md](./color-theming.md) and [locations.md](./locations.md) (grid renderers + styling parity).

### Select mode: interactive targets and cell chrome

**Unified resolver:** `domain/authoring/editor/selectMode/resolveSelectModeInteractiveTarget.ts` is the single entry for **Select**-mode hover and click targeting. Priority: **DOM** hit on map object (`[data-map-object-id]`) → **DOM** hit on linked-location icon (`[data-map-linked-cell]`) → **square** edge geometry → **path** polyline → **draft interior** via `resolveSelectModeAfterPathEdgeHits`.

**Interior resolution** (`resolveSelectModeRegionOrCellSelection.ts` — `resolveSelectModeAfterPathEdgeHits`): after path/edge misses, **map objects → region assignment → linked location → bare cell**. Region is ordered **before** linked so that hovering the **cell interior** (not the link icon) treats the **region** as the primary target; that drives `selectHoverTarget` in `LocationGridAuthoringSection` and keeps cell-level hover chrome off unless the winner is actually **`cell`**. Direct pointer hits on the link icon still resolve to `{ type: 'cell' }` via the DOM branch first.

**Region drill-in (click only):** `refineSelectModeClickAfterRegionDrill` — if the base resolver returns the **same** region as the current map selection, the next click becomes a **cell** selection. Not applied to hover.

**Grid wiring:** `GridEditor` / `HexGridEditor` receive optional `selectHoverTarget` (`LocationMapSelection`) when the map editor is in **select** mode (`LocationGridAuthoringSection` passes it; other modes omit it so cells keep normal hover). **Square** grids: `handleSelectPointerMove` uses `resolveSquareCellIdFromGridLocalPx` in `shared/domain/grid/squareGridOverlayGeometry.ts` (re-exported from `components/authoring/geometry/squareGridMapOverlayGeometry.ts`) when `elementFromPoint` does not resolve a `[role="gridcell"]` (e.g. pointer in the inter-cell gap). **Hex** grids continue to use `resolveNearestHexCell` for that fallback.

**Rendering note:** Grid cells use MUI `Box` with `component="button"`. When Select-mode hover is suppressed for a cell (region/path/object/edge winner), `GridEditor` applies **mirrored** `:hover` styles (same border/background as the idle state) so native `<button>` hover does not compete with the resolved target. Policy summary: `domain/authoring/editor/selectMode/selectModeChrome.policy.ts` (`SELECT_MODE_CHROME_POLICY_DOC`).

**Gesture vs pan:** `useCanvasPan` exposes `consumeClickSuppressionAfterPan()` — after a pan drag past the threshold, the next **click** on the map is ignored (`LocationGridAuthoringSection`, `CombatGrid`) so canvas navigation does not commit selection/placement.

**Known gap:** Residual edge cases (timing, DOM vs geometry order) — see **Open issues §4**.

---

## Client feature touchpoints

| Area | Purpose |
|------|---------|
| `src/features/content/locations/routes/` | Create and edit routes compose the workspace; `LocationEditRoute` uses `locationEdit/` hooks (`useLocationEditWorkspaceModel`, `useLocationMapHydration`, `useLocationEditSaveActions`) then branches to **`LocationEditHomebrewWorkspace`** vs `LocationEditSystemPatchWorkspace`. Detail views stay content-width. |
| `components/workspace/` | Map-first editor shell — see below. |
| `components/workspace/LocationGridAuthoringSection.tsx` | Interactive grid preview; dispatches to `GridEditor` or `HexGridEditor` by geometry. SVG layers: `mapGrid/authoring/SquareMapAuthoringSvgOverlay` (paths + edges + boundary-paint preview) and `HexMapAuthoringSvgOverlay` (paths + hex region outlines). Select-mode resolver input: `domain/authoring/editor/selectMode/` (`buildSelectModeInteractiveTargetInput`, `resolveSelectModeInteractiveTarget`). |

---

## Workspace layout (`components/workspace/`)

**Subfolders (ownership):** `header/`, `canvas/`, `leftTools/` (with `paint/` and `draw/` barrels), `rightRail/` with **`types/`**, **`selection/`**, **`adapters/`**, **`panels/`** (mode Map-rail panels + **cell inspector** `LocationCellAuthoringPanel`), **`linkedLocation/`** (linked-location placement modal), plus rail shell and tabs at `rightRail/` root. `rightRail/__tests__/` holds rail-local tests. `setup/` holds the location create setup dialog. Top-level workspace files include the edit shells, `LocationEditorWorkspace`, **`LocationGridAuthoringSection`** (workspace-level map authoring orchestrator), and `BuildingFloorStrip`. **Authoring helpers** live under **`components/authoring/draft/`** (grid draft types + persist/compare utilities) and **`components/authoring/geometry/`** (overlay geometry and path-rendering adapters). **`components/index.ts`** re-exports map toolbar and rail panels from **`workspace/leftTools`** and **`workspace/rightRail/...`**.

The workspace is composed of feature-owned components:

| Component | Role |
|-----------|------|
| `LocationEditHomebrewWorkspace` | **Homebrew (user-authored) edit** — persisted `source === 'campaign'` (including building + floor): wraps `FormProvider`, optional `BuildingFloorStrip` + map column, `LocationEditorWorkspace`, location form + visibility in the rail, `LocationMapEditorLinkedLocationModal`, delete `ConfirmModal`. |
| `LocationEditSystemPatchWorkspace` | **System-location patch:** `LocationEditorWorkspace` with patch header and patch-driven location panel (no `FormProvider`). |
| `LocationEditorWorkspace` | Outer flex column: header slot + body row (canvas + right rail). Body row capped at `calc(100vh - headerHeight)`. |
| `LocationEditorHeader` | Sticky header: title, ancestry breadcrumbs, global save button, right-rail toggle, optional actions (e.g. delete). |
| `LocationEditorCanvas` | Flex-filling canvas region with zoom/pan transform wrapper. Hosts `LocationGridAuthoringSection` as child content and renders `ZoomControl` (fixed positioned). |
| `LocationEditorRightRail` | Collapsible right rail (default open). Uses CSS width transition with `overflow: hidden` outer and scrollable inner. |
| `LocationEditorRailSectionTabs` | Right-rail tabs: **Location** (location metadata forms), **Map** (active tool palette / hints for place, draw, paint, erase, select), **Selection** (inspector). Section state is separate from toolbar mode. |
| `LocationEditorSelectionPanel` | Selection section dispatcher: cell / object / path / edge inspectors from authored map data; region remains a placeholder. |
| `LocationAncestryBreadcrumbs` | Builds a breadcrumb trail from `parentId` chain; used in the header. |
| `BuildingFloorStrip` | **Building edit only:** floor tabs + add-floor control above the canvas (see **Building scale** below). |
| `locationEditorWorkspaceUiTokens` | Static layout pixels for the location editor shell (header height, right rail width, map toolbar, unified tool tray). Defined in **`domain/presentation/map/locationEditorWorkspaceUiTokens.ts`**; also re-exported from **`components/workspace/index.ts`** and **`components/index.ts`**. **`resolveLeftMapChromeWidthPx`** lives in the same module. |

**Edit route composition:** `LocationEditRoute` loads the entry, then calls **`useLocationEditWorkspaceModel`** (`routes/locationEdit/useLocationEditWorkspaceModel.ts`) for form state, grid draft, map editor, palettes, canvas zoom/pan, and handlers. **Hydration** (`useLocationMapHydration`) wraps `hydrateDefaultLocationMapState` for non-building vs building-floor maps. **Save / patch / add floor** (`useLocationEditSaveActions`) centralizes **homebrew** submit (`handleHomebrewSubmit`), `useSystemPatchActions`, and floor creation. The route still builds `mapAuthoringPanel`, `selectionPanel`, and `mapCanvasColumn` JSX and passes them into **`LocationEditHomebrewWorkspace`** or `LocationEditSystemPatchWorkspace`.

### Shared authoring contract (editor-facing)

The **shared editor-facing contract** for dirty state, saveability, and projections is defined in TypeScript as **`LocationWorkspaceAuthoringContract`** (`routes/locationEdit/locationWorkspaceAuthoringContract.ts`). **Thin adapters** build that shape: **`buildHomebrewLocationWorkspaceAuthoringContract`** (full-draft snapshot vs baseline) and **`buildSystemLocationWorkspaceAuthoringContract`** (patch JSON + grid persistable token, combined dirty via `isSystemLocationWorkspaceDirty`). **`useLocationEditWorkspaceModel`** exposes **`authoringContract`** (or `null` when the entry is missing). **`LocationEditRoute`** passes **`authoringContract.isDirty`**, **`!canSave`** (as `saveDisabled`), and **`saveBlockReason`** into **`LocationEditHomebrewWorkspace`** and **`LocationEditSystemPatchWorkspace`** / **`LocationEditorHeader`** so the shell does not branch on mode-specific persistence. Modes are **`system`** (patch-backed) vs **`homebrew`** (user-authored locations; persisted `source === 'campaign'` — the contract name is editor vocabulary). **Dirty** and **saveable** remain separate fields (`isDirty` / `canSave` / `saveBlockReason`). **Projections** (`draftProjection`, `persistedBaselineProjection`) are comparable views for tooling or future generic UI; homebrew uses the serialized persistable snapshot string; system uses `stableStringify({ patch, grid })` (see `locationWorkspaceAuthoringAdapters.ts`).

### Vocabulary: `homebrew` vs storage `campaign`

In **editor and workspace code**, use **homebrew** for user-authored location editing (full-document / snapshot semantics, `LocationWorkspaceAuthoringMode` `'homebrew'`). On the **wire and in persisted documents**, locations still use **`source === 'campaign'`** — that field name is **not** renamed in this architecture pass. Types and helpers **`HomebrewWorkspacePersistableParts`**, **`buildHomebrewWorkspacePersistableParts`**, **`getHomebrewWorkspaceSaveBlockReason`**, and **`LocationEditHomebrewWorkspace`** reflect the editor concept.

### Dirty state and Save (homebrew edit)

The header **Save** button is driven by **`authoringContract.isDirty`** (homebrew mode) from the shared contract, not React Hook Form’s `isDirty` alone. The model still exposes **`isWorkspaceDirty`** as an alias for that homebrew dirty flag. **Dirty** means the **persistable workspace snapshot** differs from the last baseline.

**Single source of truth:** **`buildHomebrewWorkspacePersistableParts`** (`routes/locationEdit/workspacePersistableSnapshot.ts`) builds the same **`locationInput`** (for `locationRepo.updateEntry`) and **`mapBootstrapPayload`** (for `bootstrapDefaultLocationMap`) that **`handleHomebrewSubmit`** uses. **`serializeLocationWorkspacePersistableSnapshot`** stringifies those parts for dirty comparison, so save and dirty cannot drift.

- **Location slice:** `toLocationInput(form values)`, with building saves merging `buildingProfile` and **`stairConnections`** when `loc` is a campaign building.
- **Map slice:** `buildPersistableMapPayloadFromGridDraft` in `authoring/draft/locationGridDraft.utils.ts` — sorted `excludedCellIds`, wire-normalized authoring fields (`normalizeLocationMapAuthoringFields` / `normalizeRegionAuthoringEntry`), and **stable-sorted** `pathEntries` / `edgeEntries` / `regionEntries` by id. **`gridDraftPersistableEquals`** compares `stableStringify` of that same payload (no compare-vs-save drift).

The **baseline** string is set after successful map hydration and after a successful homebrew save. Until the first baseline is recorded, Save stays disabled (not dirty).

### Normalization policy (dirty vs save)

**Review anchor:** grep `LOCATION_WORKSPACE_NORMALIZATION` in `locationWorkspaceNormalizationPolicy.ts`.

**Taxonomy** (per persistable field or slice):

| Policy | Meaning |
|--------|---------|
| **normalized for compare and save** | One shaped value feeds both dirty snapshot and save/bootstrap. **Default.** |
| **normalized for save only** | Compare uses a rawer value; save cleans up. **Rare** — document why. |
| **raw / whitespace-significant** | Dirty when spacing or formatting changes; save preserves it. |
| **custom** | Special rules — document compare and save in one place. |

**Current slices (homebrew)**

| Slice | Policy | Where declared / implemented |
|-------|--------|------------------------------|
| Location form (name, description, building profile strings, labels) | normalized for compare and save | `toLocationInput` + form registry `parse` (`getNameDescriptionFieldSpecs`, `locationForm.mappers.ts`) |
| Map persistable payload | normalized for compare and save | `buildPersistableMapPayloadFromGridDraft`; shared with `gridDraftPersistableEquals` and `serializeLocationWorkspacePersistableSnapshot` map half |
| Building stair connections | normalized for compare and save | `mergeBuildingProfileForSave` in `workspacePersistableSnapshot.ts` |

**Whitespace:** Trimming and region row normalization are **intentional** for the fields above — spacing-only edits often do **not** dirty the workspace. Do not rely on “whatever a mapper happens to trim” without updating this table and `LOCATION_WORKSPACE_NORMALIZATION`.

**Future raw / whitespace-significant field:** Add an explicit `parse`/mapper path (identity or custom rules), set policy to **raw** or **custom** in `LOCATION_WORKSPACE_NORMALIZATION`, add a matrix row in `workspacePersistableSnapshot.test.ts`, and document the rule here. Until then, treat **region description** and **object labels** as **trimmed** at persistence boundaries (`normalizeRegionAuthoringEntry`, `cellDraftToCellEntries`).

The three right-rail tabs (**Location**, **Map**, **Selection**) are not separate dirty stores: they all feed the shared form, `LocationGridDraftState`, and (for buildings) stair-connection state. **Map-only** UI such as toolbar mode, paint selection, and `mapSelection` is not part of the persistable snapshot (see `authoring/draft/locationGridDraft.utils.ts`).

### Dirty vs saveable (homebrew header)

These are **separate** concepts:

| Concept | Meaning |
| ------- | ------- |
| **Dirty** (`authoringContract.isDirty` in homebrew mode; alias **`isWorkspaceDirty`** on the model) | The persistable workspace snapshot differs from the last baseline — unsaved work. |
| **Saveable** (`authoringContract.canSave`; **`homebrewWorkspaceCanSave`** on the model) | The same **gates** as [`handleHomebrewSubmit`](src/features/content/locations/routes/locationEdit/useLocationEditSaveActions.ts) before persistence: see [`getHomebrewWorkspaceSaveBlockReason`](src/features/content/locations/routes/locationEdit/homebrewWorkspaceSaveGate.ts) — e.g. **building** locations need an **active floor**; [`validateGridBootstrap`](src/features/content/locations/domain/authoring/map/bootstrapDefaultLocationMap.ts) must pass for grid bootstrap fields. |

The header **Save** button uses **`saveDisabled={!authoringContract.canSave}`** (via **`LocationEditRoute`**) in addition to the usual **not dirty** / **saving** rules. A draft can be **dirty** while **not** saveable (e.g. invalid grid columns); Save stays disabled until the block reason is cleared. When blocked, [`LocationEditorHeader`](src/features/content/locations/components/workspace/header/LocationEditorHeader.tsx) can show a **tooltip** (`saveDisabledReason` from **`authoringContract.saveBlockReason`**) explaining why.

### Dirty state — system location patch

System entries (`source === 'system'`) are **not** saved through the homebrew `handleHomebrewSubmit` pipeline. **Header dirty/saveability** still flows through **`authoringContract`** (system mode). Under the hood the contract uses a **two-part** dirty rule:

| Input | Meaning |
| ----- | ------- |
| **`patchDriver.isDirty()`** | The JSON **patch document** managed by [`patchDriver`](src/features/content/shared/editor/patchDriver.ts) differs from the loaded system entry (location metadata / patch fields). |
| **`isGridDraftDirty`** | Same as homebrew map semantics: `!gridDraftPersistableEquals(gridDraft, gridDraftBaseline)` — authored **map** cells, paths, edges, regions, etc., changed vs hydrate/save baseline. |

**Combined:** `isSystemLocationWorkspaceDirty(patchDriver.isDirty(), isGridDraftDirty)` in [`systemLocationWorkspaceDirty.ts`](src/features/content/locations/routes/locationEdit/systemLocationWorkspaceDirty.ts). Either side can enable Save. **Save blocking** (e.g. patch rail `validateAll`) is exposed as **`authoringContract.canSave`** / **`saveBlockReason`** on the system adapter.

**Not used for system dirty semantics:** the campaign **`serializeLocationWorkspacePersistableSnapshot`** / **`workspacePersistBaseline`** pipeline — those are for **homebrew** (`toLocationInput` + map bootstrap). Do not replace the system branch with the campaign snapshot unless product requires one unified model (would need patch state folded into a snapshot).

### Performance (homebrew snapshot)

`useLocationEditWorkspaceModel` memoizes **`serializeLocationWorkspacePersistableSnapshot(...)`** with dependencies on the full form watch result, `gridDraft`, `buildingStairConnections`, and `loc`. If profiling shows the snapshot as a hotspot, consider narrowing form subscriptions or caching normalized map slices only after measuring.

### Adding persisted workspace state (participation checklist)

**Assembly:** Declare new persistable data in [`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts) — the module doc lists **location** vs **map** slices. `buildHomebrewWorkspacePersistableParts` / `serializeLocationWorkspacePersistableSnapshot` drive homebrew dirty + save; **`mapWorkspacePersistableTokenFromGridDraft`** must stay aligned with the map slice so **system** `draftProjection` / `persistedBaselineProjection` do not drift from homebrew map semantics.

When you introduce new data that must be **saved** from this editor:

1. **Homebrew snapshot + save** — Extend **`buildHomebrewWorkspacePersistableParts`** (and types such as `LocationFormValues` / `LocationGridDraftState` / building stairs as needed) so the snapshot includes the new field. **`handleHomebrewSubmit`** should follow automatically if it uses the shared builder.
2. **Map-only fields** — Update the **full** map pipeline so dirty/save stay consistent:
   - Normalization / wire shape: [`buildPersistableMapPayloadFromGridDraft`](src/features/content/locations/components/authoring/draft/locationGridDraft.utils.ts) (built on [`normalizedAuthoringPayloadFromGridDraft`](src/features/content/locations/components/authoring/draft/locationGridDraft.utils.ts)) and shared `normalizeLocationMapAuthoringFields` as applicable.
   - Draft **comparison** (dirty): [`gridDraftPersistableEquals`](src/features/content/locations/components/authoring/draft/locationGridDraft.utils.ts) — delegates to the same payload as save; must not diverge from the snapshot map slice.
   - **System** map side: projections use **`mapWorkspacePersistableTokenFromGridDraft`** via [`locationWorkspaceAuthoringAdapters.ts`](src/features/content/locations/routes/locationEdit/locationWorkspaceAuthoringAdapters.ts); do **not** route system map dirty through the homebrew snapshot string (patch + grid baselines remain the system model).
3. **Baselines** — Update **baseline** callers if the new state is **not** already covered by existing hydration/save paths: [`useLocationMapHydration.ts`](src/features/content/locations/routes/locationEdit/useLocationMapHydration.ts) (after load) and post-save baseline in [`useLocationEditSaveActions.ts`](src/features/content/locations/routes/locationEdit/useLocationEditSaveActions.ts).
4. **Tests** — Add a **matrix** row or focused case in [`workspacePersistableSnapshot.test.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.test.ts) proving the snapshot changes when that field changes; for map changes, cross-mode parity is covered in [`locationWorkspaceAuthoringAdapters.test.ts`](src/features/content/locations/routes/locationEdit/locationWorkspaceAuthoringAdapters.test.ts).
5. **Normalization** — Does whitespace/formatting matter for this field? Which policy row (**normalized for compare and save**, **save only**, **raw**, **custom**)? Update [`LOCATION_WORKSPACE_NORMALIZATION`](src/features/content/locations/routes/locationEdit/locationWorkspaceNormalizationPolicy.ts) and the **Normalization policy** table in this doc. Add a focused test for spacing-only vs semantic edits.

**Whitespace / normalization:** See **Normalization policy (dirty vs save)** above and `LOCATION_WORKSPACE_NORMALIZATION` in `locationWorkspaceNormalizationPolicy.ts`. Plan archive: [.cursor/plans/location-workspace/location_workspace_normalization_policy.plan.md](.cursor/plans/location-workspace/location_workspace_normalization_policy.plan.md).

**Plan (slice participation):** `.cursor/plans/location-workspace/location_workspace_persistable_slice_participation.plan.md` (shared map token / assembly).

### State ownership (authoring standard)

Persistable authoring state for homebrew edit lives in **workspace-owned** structures: `LocationFormValues` (RHF), `LocationGridDraftState` (`gridDraft`), building stair connections, and related route-held state. **Header dirty** (`authoringContract` / `isWorkspaceDirty` for homebrew) and **Save** compare and persist that model — not private panel-local buffers.

| Rule | Meaning |
| ---- | ------- |
| **Persistable field → workspace draft** | Any value that must be included when the user saves must be reflected in the workspace draft (or the shared snapshot builder). It must **not** exist only in a panel’s `useState` or a nested form’s values until some secondary action. |
| **Ephemeral panel UI → local state** | Open/closed sections, hover or preview, search/filter text that does not persist, async loading flags, picker chrome, stair floor/stair dropdown options while resolving — keep local. |
| **Header dirty / Save → workspace draft only** | **Dirty** = current persistable snapshot ≠ baseline. **Save** = persist current workspace draft (subject to gates). No child panel should hold a second hidden persistable source required for “truth.” |
| **Validation vs dirty** | **Dirty** means “changed from baseline.” **Saveable** means “allowed to persist” (see **Dirty vs saveable**). A draft can be dirty while invalid (e.g. bad grid dimensions); Save stays disabled until fixed. |

**When to use local state vs workspace draft (checklist)**

- **Workspace draft / form / snapshot:** anything that should appear in `buildHomebrewWorkspacePersistableParts` / `serializeLocationWorkspacePersistableSnapshot` or `handleHomebrewSubmit` output — including map cells, paths, edges, regions, placed objects, location fields, building stairs.
- **Local state only:** UI that would be wrong to save (tool mode, selection, zoom, rail tab, transient modal fields) or derived UI lists (e.g. stair options fetched for a picked floor).

**Concrete examples (current inspectors)**

1. **Region metadata (Selection → region):** [`LocationMapRegionMetadataForm`](src/features/content/locations/components/workspace/rightRail/selection/LocationMapRegionMetadataForm.tsx) uses RHF for field UX; **`onPatchRegion(regionId, patch)`** writes through [`regionMetadataDraftAdapter.ts`](src/features/content/locations/components/workspace/rightRail/adapters/regionMetadataDraftAdapter.ts) into **`gridDraft.regionEntries`**. **Description** uses [`useDebouncedPersistableField`](src/ui/hooks/useDebouncedPersistableField.ts) for typing ergonomics, with **flush** on region change (`useLayoutEffect`), rail tab unmount, and via **`flushDebouncedPersistableFieldsRef`** before header Save (wrapped in **`flushSync`** in [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx) so `gridDraftRef` matches before submit). No separate “apply” step for persistable data.
2. **Stair pairing / stair endpoint:** [`LocationMapSelectionInspectors.tsx`](src/features/content/locations/components/workspace/rightRail/selection/LocationMapSelectionInspectors.tsx) uses **`FormProvider` + `useForm`** for controlled fields and **`onAfterChange`** / **Link endpoints** to update **`gridDraft`** (e.g. `onUpdateCellObjects`). RHF handles inputs; **persistable** updates are immediate draft writes, not a nested HTML form submit to the workspace.

**Rails using RHF:** Nested `FormProvider` is fine for validation and controlled fields. The rule is that **persistable** values must not be gated on `handleSubmit` / panel Submit — they flow into **`gridDraft` / location form / stairs** through explicit callbacks or subscriptions.

### Debounced persistable fields (flush-on-boundary)

Free-text fields may **debounce** writes into **`gridDraft`** so typing stays responsive. Any such field must **flush** the latest buffered value before destructive transitions (header **Save**, changing **region** selection, leaving the **Selection** tab, **unmount**), or the persistable snapshot can miss the last edit.

- **Hook:** [`useDebouncedPersistableField`](src/ui/hooks/useDebouncedPersistableField.ts) — `flush()`, `cancelPendingTimer()`, debounced `onCommit`.
- **Workspace registration:** [`useLocationEditWorkspaceModel`](src/features/content/locations/routes/locationEdit/useLocationEditWorkspaceModel.ts) exposes **`flushDebouncedPersistableFieldsRef`**; [`LocationMapRegionMetadataForm`](src/features/content/locations/components/workspace/rightRail/selection/LocationMapRegionMetadataForm.tsx) registers its **`flush`** when mounted (region selection).
- **Save:** [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx) runs the registered flush inside **`flushSync`** before **`handleHomebrewFormSaveClick`** / **`handlePatchSave`** so **`gridDraftRef`** is up to date for the save pipeline.

### Contributor rules (workspace authoring)

- Extend **`LocationWorkspaceAuthoringContract`** intentionally when adding editor-facing behavior (dirty, saveability, projections); surface it through **`authoringContract`** on **`useLocationEditWorkspaceModel`** and **`LocationEditRoute`**.
- Keep **mode-specific** persistence inside the **adapters** and save hooks (`buildHomebrewLocationWorkspaceAuthoringContract`, `buildSystemLocationWorkspaceAuthoringContract`, `useLocationEditSaveActions`), not in one-off header branches.
- Keep **persistable** state in workspace-owned **`gridDraft`**, RHF values, building stairs, and the **patch driver** for system — not isolated panel `useState` that only flushes on Save.
- Do **not** assume system and homebrew persistence work the same internally: system is **patch JSON + grid baseline**; homebrew is **full snapshot** + `locationRepo.updateEntry` / `bootstrapDefaultLocationMap`.
- Keep **dirty** and **saveable** separate (`isDirty` vs `canSave` / `saveBlockReason`).
- Prefer **homebrew** names in new TypeScript; retain **`source === 'campaign'`** at persistence and API boundaries unless a wire-format migration explicitly changes it.

**Why two persistence strategies:** System locations are platform-defined; the app stores overrides as a **patch** while sharing the same map authoring UX. User-authored locations are normal campaign content; saves align a **serialized baseline** with `handleHomebrewSubmit`. This is a **code architecture** distinction — not a request to merge DB schemas.

#### Historical context (dirty-state migration Phases B–D)

The nested **submit-to-commit** persistable gap (region metadata only) was removed in Phase B; a later Phase D re-audited Selection / map rails and removed noop `AppForm` wrappers from stair inspectors in favor of `FormProvider`. Inventory for that migration:

| Slice | Persistable path | Notes |
| ----- | ---------------- | ----- |
| Region metadata | `onPatchRegion` → `gridDraft.regionEntries` | Adapter normalization |
| Cell / objects / stairs | Callbacks → `gridDraft` | |
| Stair pairing / endpoint | `FormProvider` + draft callbacks | Replaces former noop form shells |
| Path / edge / paint rail | Route handlers → `gridDraft` or remove-only | |

Plan archive: `.cursor/plans/location-workspace/location_workspace_dirty_state_4d54eedc.plan.md`. Related plans are grouped under `.cursor/plans/location-workspace/` ([README](.cursor/plans/location-workspace/README.md)).

---

## Map editor toolbar and related UI

When the map grid is shown in create/edit (`showMapGridAuthoring` in `LocationEditRoute.tsx`; panels are wired from the route into the active workspace shell), the canvas column includes **map editor chrome** to the left of `LocationEditorCanvas`: a vertical toolbar and, depending on mode, a slim **paint** swatch column and/or **draw** kind column.

### Object authoring UX modernization (roadmap)

**Parent roadmap:** [.cursor/plans/location-workspace/location_workspace_object_authoring_roadmap.plan.md](../../.cursor/plans/location-workspace/location_workspace_object_authoring_roadmap.plan.md) (also indexed from [.cursor/plans/location-workspace/README.md](../../.cursor/plans/location-workspace/README.md)). Plans share the prefix `location_workspace_object_authoring_*`.

The long-term direction is a **registry-driven** object authoring system: **toolbar palette** (with category/group presentation), explicit **loaded** placement state, **variants**, **edge placement** for doors/windows (and similar), and **rail-first** inspection/configuration after placement — without collapsing palette grouping into the persisted map model. Implementation is **phased** (palette foundation → variants → edge placement → config/editing); until those child plans land, behavior remains as documented below (`LocationMapEditorPlacePanel` in the Map rail, `getPlacePaletteItemsForScale`, etc.). That plan is **explicitly** scoped to object authoring UX and registry/placement boundaries; it does **not** subsume dirty/save work or a full shell redesign. **Phase 1 (palette foundation):** [.cursor/plans/location-workspace/location_workspace_object_authoring_phase1_palette_foundation.plan.md](../../.cursor/plans/location-workspace/location_workspace_object_authoring_phase1_palette_foundation.plan.md). **Phase 2 (variants):** [.cursor/plans/location-workspace/location_workspace_object_authoring_phase2_variants.plan.md](../../.cursor/plans/location-workspace/location_workspace_object_authoring_phase2_variants.plan.md). **Phase 3 (edge placement, placeholder):** [.cursor/plans/location-workspace/location_workspace_object_authoring_phase3_edge_placement.plan.md](../../.cursor/plans/location-workspace/location_workspace_object_authoring_phase3_edge_placement.plan.md). **Phase 4 (config and editing, placeholder):** [.cursor/plans/location-workspace/location_workspace_object_authoring_phase4_config_editing.plan.md](../../.cursor/plans/location-workspace/location_workspace_object_authoring_phase4_config_editing.plan.md).

### `LocationMapEditorToolbar`

| | |
|---|---|
| **File** | `src/features/content/locations/components/workspace/leftTools/LocationMapEditorToolbar.tsx` |
| **Width** | `locationEditorWorkspaceUiTokens.mapToolbarWidthPx` |
| **Control** | MUI vertical `ToggleButtonGroup` (exclusive), icon-only buttons |

**Modes** (`LocationMapEditorMode` in `domain/authoring/editor/types/locationMapEditor.types.ts`):

| Mode | Purpose |
|------|---------|
| `select` | Default: inspect/select authored content; map pan works from the grid when appropriate. |
| `paint` | **Fill-like** authoring: paint **cell fills** (`cellFillByCellId`). Active swatch from `LocationMapEditorPaintTray` + `activePaint`. Region painting is intended to extend this tool later. |
| `place` | **Discrete** placement only: **linked content** (child locations) and **map objects** (props), per `LOCATION_SCALE_MAP_CONTENT_POLICY`. Palette: `getPlacePaletteItemsForScale` → `LocationMapEditorPlacePanel`; selection `activePlace` (`linked-content` \| `map-object`). Resolver: `resolvePlacedKindToAction`. |
| `draw` | **Line/boundary** authoring: **paths** and **edges** (per policy). Palette: `getGroupedDrawPaletteForScale` → toolbar `LocationMapEditorDrawTray` + Map rail `LocationMapEditorDrawPanel`; selection `activeDraw` (`path` \| `edge`). Path segments use `pathAnchorCellId`; edges use boundary-paint in `LocationGridAuthoringSection`. Resolver: `resolveDrawSelectionToAction`. |
| `erase` | **Removal**: click uses `resolveEraseTargetAtCell` (edge → object → path → link → **cell fill**). Stroke-drag in erase mode clears terrain fill like the former clear-fill tool. Edge hits can use `onEraseEdge` for direct boundary targeting. |

**State hook:** `useLocationMapEditorState` holds `mode`, `activePaint`, `activePlace`, `activeDraw`, `pathAnchorCellId` (for **Draw → path**), and `pendingPlacement` for the linked-location modal. Leaving **place** clears place selection and pending placement; leaving **draw** clears draw selection and path anchor.

**Layout:** `useLocationEditWorkspaceModel` sets `leftMapChromeWidthPx` via **`resolveLeftMapChromeWidthPx`**: whenever map editor chrome is on, it reserves **toolbar + unified tool tray** width in grid layout math so cell sizing does not reflow when switching modes or opening trays (trays overlay the canvas). Passed to `LocationGridAuthoringSection` as `leftChromeWidthPx`.

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

**Smooth curve rendering:** all committed path segments plus the hover-cell preview are rendered as a single SVG `<path>` per chain using Catmull-Rom to cubic Bézier interpolation (`chainToSmoothSvgPath` in `authoring/geometry/pathOverlayRendering.ts`). The `pathSvgData` memo in `LocationGridAuthoringSection` extends the active chain with the hover cell so the preview is visually seamless with committed segments.

**Hex click-gap handling:** hex cells use CSS `clip-path` for hexagonal shapes, which can leave narrow dead zones between cells. `resolveNearestHexCell` (in `authoring/geometry/hexGridMapOverlayGeometry.ts`) resolves pointer positions to the nearest hex center, used by both the fallback click handler and the hover resolver to ensure clicks and previews work even when the pointer lands between cells.

**Adjacency:** consecutive cells in an authored path chain are geometry-aware. Both the client (`handleAuthoringCellClick` in **Draw** mode in `LocationEditRoute.tsx`, `pathSvgData` memo) and the server-side validation (`validatePathEntriesStructure` in `locationMapFeatures.validation.ts`) use `getNeighborPoints` from `shared/domain/grid/gridHelpers.ts`, which handles both square orthogonal neighbors and hex offset-column neighbors.

**Persistence:** paths are stored on the map as `pathEntries`: each entry has an `id`, a `kind` (`road` | `river`), and ordered `cellIds` for that chain. This is the canonical authored model; SVG smoothing is a render concern.

**Key modules:**

| Module | Exports |
|--------|---------|
| `components/authoring/geometry/pathOverlayRendering.ts` | `pathEntriesToSvgPaths` (path chains → SVG `d` strings), `chainToSmoothSvgPath` (Catmull-Rom to cubic Bézier) |
| `components/authoring/geometry/hexGridMapOverlayGeometry.ts` | `hexCellCenterPx`, `hexOverlayDimensions`, `resolveNearestHexCell` |
| `components/authoring/geometry/squareGridMapOverlayGeometry.ts` | `squareCellCenterPx`, `squareEdgeSegmentPxFromEdgeId`, `resolveSquareCellIdFromGridLocalPx` (grid-local point → cell id; gaps return null) |
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
| `domain/authoring/editor/edge/edgeAuthoring.ts` | `resolveNearestCellEdgeSide`, `resolveEdgeTargetFromGridPosition`, `applyEdgeStrokeToDraft` (replace/no-op rules), `shouldAcceptStrokeEdge` (axis lock + collinearity + adjacency), `areEdgesAdjacent`, `getSquareEdgeOrientation`, types `ResolvedEdgeTarget`, `EdgeOrientation` |
| `authoring/geometry/squareGridMapOverlayGeometry.ts` | `squareEdgeSegmentPxFromEdgeId` for rendering committed and preview edges |
| `domain/authoring/editor/erase/resolveEraseTarget.ts` | `resolveEraseTargetAtCell` (priority stack); `resolveEraseEdgeByEdgeId` for precise edge-only erase |
| `LocationGridAuthoringSection` | Composes **`useSquareEdgeBoundaryPaint`** (`mapGrid/authoring/useSquareEdgeBoundaryPaint.ts`) for capture-phase edge place/erase + stroke state; **`SquareMapAuthoringSvgOverlay`** for preview and committed segments |

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

## Performance — workspace snapshot (profiling pass)

**Pass:** evidence-first measurement of **homebrew persistable snapshot** cost (`serializeLocationWorkspacePersistableSnapshot` → `buildHomebrewWorkspacePersistableParts` → `toLocationInput` + `buildPersistableMapPayloadFromGridDraft` + `stableStringify`). No speculative optimization was applied.

### What was measured

1. **Synthetic Node benchmarks** — `workspacePersistableSnapshot.perf.test.ts` (Vitest) times repeated serialization for **minimal** (empty draft), **medium** (dozens of path chains, ~100+ edges, regions, sparse cell fills), and **stress** (very long chains, hundreds of edges). Median single-call time stays within loose CI thresholds (minimal sub-millisecond; medium and stress sub–tens of ms on typical dev hardware).
2. **Call frequency (code)** — `useLocationEditWorkspaceModel` builds `authoringContract` in `useMemo` with **`watch()`** (full form) as a dependency. Any **location form** field change recomputes the memo and runs the full homebrew snapshot for dirty comparison. **`gridDraft`** changes do the same. This is **breadth of subscription**, not a separate bug: the snapshot must reflect the whole persistable workspace.

### Cost centers (in order of work per call)

| Stage | Role |
|--------|------|
| `toLocationInput(values)` | Location slice from form values. |
| `mergeBuildingProfileForSave` | Stairs / building profile only when editing a **building** campaign location. |
| `buildPersistableMapPayloadFromGridDraft` | `cellDraftToCellEntries` + `normalizeLocationMapAuthoringFields` + stable sorts on path/edge/region ids + sorted `excludedCellIds`. |
| `stableStringify({ location, map })` | Deterministic string for baseline comparison. |

Downstream **React** render cost from `watch()`-driven updates is outside this micro-benchmark; it can dominate perceived latency before snapshot serialization does.

### Recommendation

- **No action** — for typical and medium-sized maps, snapshot derivation is **not** a material hot path in Node tests; keep the current single-source-of-truth pipeline.
- **Monitor** — if real maps routinely approach **stress**-sized payloads (very long path chains, huge edge sets), re-run profiling in the browser (Performance panel) and consider a **targeted** follow-up (e.g. memoizing snapshot on narrower form slices only if proven necessary).

### Path preview performance (deferred)

Smooth path **preview** (hover → full Catmull-Rom chain recompute on move) is **not** part of the persistable snapshot. It remains a **known future review** item in **Open issues §3** — optimize only if **profiling** or **clear user pain** (long chains, low-end devices) justifies a dedicated pass. This profiling pass does **not** change that.

---

## Open issues

### 1. Hex maps: constrained boundary-edge support (Option B)

Edge authoring (walls, windows, doors) is implemented for **square grids only**. The boundary-paint pointer model, edge geometry resolution, and SVG overlay assume square cell boundaries. On **hex** geometry:

- **Draw palette** — edge tools are hidden (`useLocationEditWorkspaceModel` filters `getGroupedDrawPaletteForScale` to paths only).
- **Rendering / hit-testing** — `LocationGridAuthoringSection` does not render committed edges or edge pick geometry on hex; Select mode skips edge hits (`resolveSelectModeInteractiveTarget` when `isHex`).
- **Stored data** — `edgeEntries` on a hex map are **preserved on save** but not shown or edited in the map. When any stored edges exist, an **info alert** above the grid explains that segments are kept but require a square grid to view or edit.
- **Erase** — cell erase does **not** prioritize removing invisible edges on hex (`resolveEraseTargetAtCell` with `skipEdgeTargets`), so users cannot silently delete stored edge data without visible feedback.
- **Stale UI** — switching to hex clears edge draw tool and edge/edge-run selection (`computeHexEdgeConstraintPatch`).

**Future (first-class hex edges):** hex-specific boundary resolution (6 edges per cell), hit-testing, and a hex edge SVG overlay. The `EdgeOrientation` type includes placeholder values for hex (`'hex-a' | 'hex-b' | 'hex-c'`).

### 2. Canvas pan vs reliable clicks (place / draw path)

Map pan is implemented with `useCanvasPan` on the canvas wrapper. Three layers of hardening are now in place:

1. **`suppressCanvasPanOnCells`** — in **place** mode and **draw → path** mode, cell `pointerdown`/`pointerup` events call `stopPropagation` so the canvas pan handler never starts a drag from cell clicks.
2. **Window-level `pointerup` safety net** — `useCanvasPan` registers a `window` `pointerup` listener that clears drag state even when a child stops propagation, preventing stranded `isDragging` / grabbing cursor.
3. **`consumeClickSuppressionAfterPan`** — `useCanvasPan` sets a one-shot suppress flag when a pan gesture exceeds the drag threshold; `LocationGridAuthoringSection` and `CombatGrid` consume it in cell **click** handlers so a drag release does not commit selection or placement. The movement threshold matches pan drag recognition (default 3px).

**Remaining scope:** optional `pointerup`-based placement for non–Select tools on trackpads can build on the same hook.

### 3. Path chain preview responsiveness (**deferred**)

The smooth curve preview (hover → smooth Catmull-Rom spline) recalculates the full chain curve on every pointer move. On long chains or slower machines this can feel choppy. A potential optimization would be to cache the committed portion of the chain curve and only recompute the last 2–3 segments when the hover cell changes.

**Status:** **Deferred** — do **not** implement unless browser profiling or reported user pain shows path preview as a real bottleneck. Workspace snapshot profiling (see **Performance — workspace snapshot**) did not target this path; it remains roadmap-only until justified.

### 4. Region vs cell hover chrome (hardened; edge cases remain)

**Intent:** In **Select** mode, one **primary** hover target drives feedback: `selectHoverTarget` from `resolveSelectModeInteractiveTarget`. Cell-level hover chrome applies only when the winner is `{ type: 'cell', cellId }` for that cell (`shouldApplyCellHoverChrome`). When the winner is region/path/edge/object, cells do not take the primary hover treatment; **`GridEditor` and `HexGridEditor`** mirror idle styles on `:hover` for those cells (`isSelectHoverChromeSuppressed`) so native button hover does not compete. Square and hex use the same suppression rule; only the mirrored visuals differ (square border/fill vs hex ring/inner fill).

**In place:** `resolveSelectModeAfterPathEdgeHits` interior priority (objects → linked → **region** → bare cell), `mapGridCellVisualState.ts`, `selectModeChrome.policy.ts`, and gap fallback for pointer-in-gap (`resolveSquareCellIdFromGridLocalPx` / `resolveNearestHexCell`).

**Still open:** Rare timing or hit-order glitches — extend the resolver/helpers rather than one-off JSX.

---

## Building scale (special edit workspace)

For **`scale === building`** (campaign edit only), the editor is **building-centric** but **maps live on floor children**, not on the building record:

- **Floors** are separate locations: `scale: floor`, `parentId` = building id. Each floor has its own default map (normal persistence — no merged multi-floor document).
- **UI:** a **`BuildingFloorStrip`** sits under the header in the canvas column (full-width strip), rendered inside **`LocationEditHomebrewWorkspace`** when `scale === building`. Tabs show **Floor 1**, **Floor 2**, … (labels from sorted order); **+ Add floor** creates the next floor + bootstraps its map. Only **one** floor's grid is mounted at a time (`activeFloorId` in route state; URL stays `/locations/:buildingId/edit`).
- **Save** updates the **building** location (metadata, etc.) and **bootstraps the active floor's** map. If there are no floors yet, save is disabled until at least one floor exists.
- **Code:** helpers in `domain/building/buildingWorkspaceFloors.ts`; branching in `LocationEditRoute.tsx` (map load/save keyed by `activeFloorId`, `hostScale: 'floor'` for grid authoring). Out of scope for this pass: basement labels, floor reorder/delete UX, stacked canvases.

---

## Shared canvas hooks (`src/ui/hooks/`)

Zoom and pan behavior is shared between the location editor and encounter active route via reusable hooks:

| Export | Role |
|--------|------|
| `useCanvasZoom` | Zoom state, `zoomIn`/`zoomOut`/`zoomReset`, `zoomControlProps` spread for `ZoomControl`, `wheelContainerRef` (non-passive listener for Ctrl/Cmd + scroll / trackpad pinch). `bindResetPan` coordinates pan reset with zoom reset. |
| `useCanvasPan` | Pan state, pointer drag handlers (`pointerHandlers` spread), `isDragging`, `consumeClickSuppressionAfterPan()` (suppress the next click after a pan drag), `hasDragMoved()`, `resetPan`. Window-level `pointerup` clears drag state when children stop propagation. |
| `CanvasPoint` | Shared type `{ x: number; y: number }`. |

Both hooks are used at the route level; derived values are passed down to canvas/grid components as props.

---

## Pointers for the next agent (workspace)

1. **Workspace layout changes:** modify components under `components/workspace/`; entry shells are **`LocationEditHomebrewWorkspace`** and `LocationEditSystemPatchWorkspace` (both wrap `LocationEditorWorkspace`). Layout pixel tokens: **`locationEditorWorkspaceUiTokens`** in `domain/presentation/map/locationEditorWorkspaceUiTokens.ts` (re-exported from the locations `components` barrel). Do not add workspace layout logic to the generic content template system.
2. **Zoom/pan enhancements:** extend `useCanvasZoom` / `useCanvasPan` in `src/ui/hooks/`; both location and encounter features consume them. `ZoomControl` supports `positioning` prop (`'fixed'` default, `'absolute'` for container-relative).
3. **Focus-mode routes:** add new full-width routes by extending the regex in `src/app/layouts/auth/auth-main-path.ts`.
4. **Path authoring:** persisted model is `pathEntries` on `LocationMap` (ordered `cellIds` per chain). Chain-building UX lives in `LocationEditRoute.tsx` (`handleAuthoringCellClick` in **Draw** mode); smooth curve rendering in `authoring/geometry/pathOverlayRendering.ts` (`pathEntriesToSvgPaths`); hex geometry helpers in `authoring/geometry/hexGridMapOverlayGeometry.ts`. The `pathSvgData` memo in `LocationGridAuthoringSection` unifies committed and preview curves. Tests in `authoring/geometry/__tests__/pathOverlayRendering.test.ts` and `authoring/geometry/__tests__/hexGridMapOverlayGeometry.test.ts`.
5. **Edge authoring:** edge logic lives under `domain/authoring/editor/edge/` with tests in `domain/authoring/editor/__tests__/edge/`; grid wiring uses `useSquareEdgeBoundaryPaint` in [`LocationGridAuthoringSection.tsx`](src/features/content/locations/components/workspace/LocationGridAuthoringSection.tsx). Before changing behavior, read **Edge authoring** and **Open issues** above (hex edge gap).
6. **Path preview performance:** deferred unless profiling or user pain justifies work — see **Open issues §3** and **Performance — workspace snapshot** (path preview called out as out-of-scope there).
7. **Select mode / region hover:** resolver and grid chrome live under `domain/authoring/editor/selectMode/` (`resolveSelectModeInteractiveTarget`, `buildSelectModeInteractiveTargetInput`, `resolveSelectModeRegionOrCellSelection`, `refineSelectModeClickAfterRegionDrill`, `locationMapSelectionHitTest`) plus `mapGridCellVisualState.ts`. See **Location map styling → Select mode** and **Open issues §4** before changing hover behavior.
8. **Persistable dirty snapshot:** when adding new state that is **saved** from this editor but not part of `LocationFormValues` or `gridDraft` (e.g. parallel `useState` merged in `handleHomebrewSubmit`), extend **`buildHomebrewWorkspacePersistableParts`** (shared by save + **`serializeLocationWorkspacePersistableSnapshot`**) and baseline updates in **`useLocationMapHydration`** / **`useLocationEditSaveActions`**. Tests: `workspacePersistableSnapshot.test.ts`.
9. **System location edit:** dirty uses **`isSystemLocationWorkspaceDirty`** (`patchDriver.isDirty()` OR **`isGridDraftDirty`**), not the homebrew snapshot — see **Dirty state — system location patch** above. Tests: `systemLocationWorkspaceDirty.test.ts`.
10. **State ownership:** persistable rail edits must live in **`gridDraft` / location form / stairs** (see **State ownership (authoring standard)**). Plan: `.cursor/plans/location-workspace/location_workspace_dirty_state_4d54eedc.plan.md`.
11. **Shared authoring contract:** extend editor-facing behavior via **`LocationWorkspaceAuthoringContract`** (`locationWorkspaceAuthoringContract.ts`); keep mode-specific persistence in adapters. Plan: `.cursor/plans/location-workspace/location_workspace_authoring_contract.plan.md`.
12. **Debounced persistable fields:** use **`useDebouncedPersistableField`** + **`flushDebouncedPersistableFieldsRef`** + **`flushSync`** before save as in region metadata; see **Debounced persistable fields** above. Plan: `.cursor/plans/location-workspace/location_workspace_debounced_persistable_flush.plan.md`.
13. **Persistable slice participation:** shared map assembly in **`buildMapWorkspacePersistablePayloadFromGridDraft`** / **`mapWorkspacePersistableTokenFromGridDraft`** ([`workspacePersistableSnapshot.ts`](src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts)); system adapters consume the same map token. See **Adding persisted workspace state** and plan: `.cursor/plans/location-workspace/location_workspace_persistable_slice_participation.plan.md`.
14. **Normalization policy (dirty vs save):** **Normalization policy (dirty vs save)** section above; `LOCATION_WORKSPACE_NORMALIZATION` in [`locationWorkspaceNormalizationPolicy.ts`](src/features/content/locations/routes/locationEdit/locationWorkspaceNormalizationPolicy.ts). Plan archive: [.cursor/plans/location-workspace/location_workspace_normalization_policy.plan.md](.cursor/plans/location-workspace/location_workspace_normalization_policy.plan.md).
15. **Object authoring roadmap** (`location_workspace_object_authoring_*`): parent [.cursor/plans/location-workspace/location_workspace_object_authoring_roadmap.plan.md](../../.cursor/plans/location-workspace/location_workspace_object_authoring_roadmap.plan.md); Phase 1–4 child plans in [.cursor/plans/location-workspace/](../../.cursor/plans/location-workspace/). Registry vs placement vs persistence vs UI layers; coordinate with **Map editor toolbar** above; do not mix in dirty/save scope unless a child plan explicitly includes it.

For domain, map policy, transitions, grid geometry policy, and hex rendering math, see [locations.md](./locations.md) (section *Pointers for the next agent*).
