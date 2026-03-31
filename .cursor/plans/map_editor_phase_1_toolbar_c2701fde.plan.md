---
name: Map editor Phase 1 toolbar
overview: Add map editor modes (select / place / paint / clear-fill), a left vertical toolbar with paint swatch tray, right-rail place palette, policy-derived palette helpers, persisted cell-fill support in `cellEntries`, grid pointer gestures for paint/clear-fill, and a world+city link modal—while extending shared persistence and bridging placed-object vocabulary to existing link/object models.
todos:
  - id: fix-mapcontent-syntax
    content: Fix unquoted string literals in locationCellFill.types.ts, locationMapIconNames.ts, locationScaleMapContent.policy.test.ts
    status: completed
  - id: shared-cell-fill
    content: Add cellFillKind to LocationMapCellAuthoringEntry, Mongoose schema, validateCellEntriesStructure, cellAuthoringMappers + LocationGridDraftState
    status: completed
  - id: meta-palette-helpers
    content: Extend LOCATION_PLACED_OBJECT_KIND_META (linkedScale, iconName); add getPaintPaletteItemsForScale / getPlacePaletteItemsForScale + tests
    status: completed
  - id: placement-bridge
    content: Add resolvePlacedKindToAction(kind, hostScale) pure resolver + tests; wire city@world modal and object/link branches without scattered linkedScale conditionals
    status: completed
  - id: grid-ui-gestures
    content: Extend GridEditor/HexGridEditor + LocationGridAuthoringSection for paint/clear-fill pointer strokes, fill rendering, pan propagation
    status: completed
  - id: toolbar-shell
    content: LocationMapEditorToolbar + PaintTray + Place sidebar panel; integrate in LocationEditRoute canvas column with useLocationMapEditorState
    status: completed
  - id: path-place-reliability
    content: "Follow-up: path/edge clicks sometimes miss or skip draft updates (pan vs click); reproduce with instrumentation, consider pointer capture on cell down in place mode or pan guard"
    status: pending
  - id: hex-map-overlays
    content: "Hex maps: path/edge SVG overlay + place preview parity with square (geometry helpers)"
    status: pending
  - id: phase2-undo-stroke
    content: "Optional: batch paint/clear-fill/place strokes for undo; structure refs per plan §9"
    status: pending
isProject: false
---

# Phase 1 location map editor toolbar

## Current fit (what exists today)

- Workspace layout: `[LocationEditorWorkspace.tsx](src/features/content/locations/components/workspace/LocationEditorWorkspace.tsx)` is header + **row** `{ canvas | rightRail }`. Canvas is `[LocationEditorCanvas](src/features/content/locations/components/workspace/LocationEditorCanvas.tsx)`: outer `Box` applies `[useCanvasPan](src/ui/hooks/useCanvasPan.ts)` `pointerHandlers` + inner transform + grid child.
- Map draft state: `[LocationGridDraftState](src/features/content/locations/components/locationGridDraft.types.ts)` holds `selectedCellId`, `excludedCellIds`, `linkedLocationByCellId`, `objectsByCellId`. Persistence ↔ `cellEntries` via `[cellAuthoringMappers.ts](src/features/content/locations/domain/maps/cellAuthoringMappers.ts)`.
- Shared persisted shape: `[LocationMapCellAuthoringEntry](shared/domain/locations/map/locationMap.types.ts)` = `{ cellId, linkedLocationId?, objects? }` — **no cell fill yet**.
- Scale-authored content policy: `[LOCATION_SCALE_MAP_CONTENT_POLICY](src/features/content/locations/domain/mapContent/locationScaleMapContent.policy.ts)` + existing helpers like `getAllowedCellFillKindsForScale` / `getAllowedPlacedObjectKindsForScale`.
- **Separate vocabularies:** “Placed object kinds” for tools live in `[locationPlacedObject.types.ts](src/features/content/locations/domain/mapContent/locationPlacedObject.types.ts)`. Persisted cell `objects[].kind` must be `[LocationMapObjectKindId](shared/domain/locations/map/locationMap.constants.ts)` (`marker` | `obstacle` | `treasure` | `door` | `stairs`). `[locationMapPlacement.policy.ts](shared/domain/locations/map/locationMapPlacement.policy.ts)` constrains which of those are allowed per host scale. **Phase 1 must bridge** tool palette → links and/or persisted object kinds (see “Placement bridge” below).
- Grid renderers: `[GridEditor](src/ui/patterns/grid/GridEditor.tsx)` / `[HexGridEditor](src/ui/patterns/grid/HexGridEditor.tsx)` — `onCellClick` only today; paint/clear-fill needs pointer-down / enter / up (or equivalent) on cells.

## Blocker: fix invalid TS in mapContent (before features)

These files use bare identifiers instead of string literals in `as const` arrays (e.g. `forest_light` without quotes). Fix so the project typechecks: `[locationCellFill.types.ts](src/features/content/locations/domain/mapContent/locationCellFill.types.ts)`, `[locationMapIconNames.ts](src/features/content/locations/domain/mapContent/locationMapIconNames.ts)`, and `[locationScaleMapContent.policy.test.ts](src/features/content/locations/domain/mapContent/locationScaleMapContent.policy.test.ts)` (e.g. `stone_floor` in `expect`).

## 1) Types and editor state

Add a small editor-focused module under the feature (names can match your list):

- `**locationMapEditor.types.ts`** (e.g. under `src/features/content/locations/domain/mapEditor/` or `components/mapEditor/` — pick one folder and keep all Phase-1 editor types + barrel export there):
  - `MapEditorMode = 'select' | 'place' | 'paint' | 'clear-fill'`
  - `ActivePlaceSelection` (category `'object'` + `kind: LocationPlacedObjectKindId` | `null`)
  - `ActivePaintSelection = LocationCellFillKindId | null`
  - `PendingLinkedPlacement` (object kind + `targetCellId` + `linkedScale: LocationScaleId`) | `null` — used only while the city modal is open
  - Optional UI-facing `MapPaintPaletteItem` / `MapPlacePaletteItem` as you described (pull `swatchColorKey` type from `[LocationMapSwatchColorKey](src/features/content/locations/domain/mapContent/locationMapSwatchColors.types.ts)`, not `string`).
- `**useLocationMapEditorState.ts`** (hook): holds `mode` (default `**select`**), `activePaint`, `activePlace`, `pendingLinkedPlacement`, and setters. Reset paint/place when switching mode if that keeps UX predictable (document in code). Keep hook **purely client**; route composes it with `gridDraft` / modal.

This avoids replacing `[LocationGridDraftState](src/features/content/locations/components/locationGridDraft.types.ts)`; **extend** it (next section).

## 2) Persisted cell fills (paint / clear-fill)

**Model:** Add optional `cellFillKind` to shared `[LocationMapCellAuthoringEntry](shared/domain/locations/map/locationMap.types.ts)`. Values should match `[LOCATION_CELL_FILL_KIND_IDS](src/features/content/locations/domain/mapContent/locationCellFill.types.ts)` (consider **re-exporting** a single const from shared later; Phase 1 can validate with a duplicated readonly tuple in `shared` **or** import-free string validation against a shared list added under `shared/domain/locations/map/` to avoid `server` → `src` imports).

**Server:** Extend `[mapCellAuthoringEntrySchema](server/shared/models/CampaignLocationMap.model.ts)` with optional `cellFillKind: String`.

**Validation:** Extend `[validateCellEntriesStructure](shared/domain/locations/map/locationMapCellAuthoring.validation.ts)` to accept optional `cellFillKind` when present (non-empty string, allowed set).

**Draft:** Extend `LocationGridDraftState` with `cellFillByCellId: Record<string, LocationCellFillKindId | undefined>` (or `Partial<Record<...>>`). Extend `[cellAuthoringMappers](src/features/content/locations/domain/maps/cellAuthoringMappers.ts)` to merge **link keys + object keys + fill keys**; each `LocationMapCellAuthoringEntry` may carry `linkedLocationId`, `objects`, and/or `cellFillKind`. Prune entries when all three are empty after clear-fill.

**Seeding:** Update all `cellEntriesToDraft` call sites in `[LocationEditRoute](src/features/content/locations/routes/LocationEditRoute.tsx)` (and `[LocationCreateRoute](src/features/content/locations/routes/LocationCreateRoute.tsx)` if it hydrates draft) to populate `cellFillByCellId`.

## 3) Metadata and policy-derived helpers

- **Extend** `[LOCATION_PLACED_OBJECT_KIND_META](src/features/content/locations/domain/mapContent/locationPlacedObject.types.ts)` with:
  - `iconName?: LocationMapIconName` (use existing tokens like `map_city` / `map_building` / `map_site` from `[locationMapPresentation.constants.ts](src/features/content/locations/domain/mapContent/locationMapPresentation.constants.ts)` patterns — avoid inventing `city` unless you add it to `[LOCATION_MAP_ICON_NAME_IDS](src/features/content/locations/domain/mapContent/locationMapIconNames.ts)` + `[locationMapIconNameMap.tsx](src/features/content/locations/domain/map/locationMapIconNameMap.tsx)`).
  - `linkedScale?: LocationScaleId` — `city` → `'city'`; `building` → `'building'`; `site` → `'site'`; omit for `tree`, `table`, etc.
- **New** `locationMapEditorPalette.helpers.ts` (next to policy or `mapEditor/`):
  - `getPaintPaletteItemsForScale(scale)` → filter `[getAllowedCellFillKindsForScale](src/features/content/locations/domain/mapContent/locationScaleMapContent.policy.ts)`, map through `[LOCATION_CELL_FILL_KIND_META](src/features/content/locations/domain/mapContent/locationCellFill.types.ts)`.
  - `getPlacePaletteItemsForScale(scale)` → filter `getAllowedPlacedObjectKindsForScale`, map through extended placed-object meta.
- **Placement seam (explicit, not metadata-only):** Add a small pure `**resolvePlacedKindToAction(kind, hostScale)`** (name exact or `resolveLocationPlacedKindToAction` if you want prefix consistency) in domain next to palette helpers or `locationPlacedObject*.ts`. It returns a **discriminated result**, e.g. `'link-modal'` (with target scale hint from meta), `'place-object'` with `LocationMapObjectKindId`, `'unsupported'`, etc. `**LOCATION_PLACED_OBJECT_KIND_META.linkedScale` (and labels/icons) inform the resolver but do not replace it** — UI and grid handlers branch on **resolver output only**, avoiding scattered `if (kind === 'city' && hostScale === 'world')` strings. Phase 1 implements the rows the product needs (at minimum city@world → link-modal); other kinds resolve to `unsupported` or concrete mappings per the table below.
- **Tests:** Add/extend Vitest for palette helpers, `**resolvePlacedKindToAction`** matrix (kind × hostScale), and keep `[locationScaleMapContent.policy.test.ts](src/features/content/locations/domain/mapContent/locationScaleMapContent.policy.test.ts)` aligned after fixing syntax.

## 4) Placement bridge (tool “placed object” → persisted draft)

**Single entry point:** `resolvePlacedKindToAction(kind, hostScale)` (see §3). The table below is the **authoritative mapping** the resolver should encode; meta is supplementary for display and hints.


| Tool kind                         | Phase 1 persistence strategy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **city** @ **world**              | **No new object kind.** On confirm, set `linkedLocationByCellId[cellId] = chosenCityId`. Matches existing link model + `[getAllowedLinkedLocationOptions](shared/domain/locations/map/locationMapPlacement.policy.ts)`.                                                                                                                                                                                                                                                                                         |
| **tree** (city)                   | Place `**marker`** object (allowed on city per `[ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE](shared/domain/locations/map/locationMapPlacement.policy.ts)`), optional label from meta if desired later.                                                                                                                                                                                                                                                                                                              |
| **stairs** / **treasure** (floor) | Use existing kinds `stairs` / `treasure`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **table** (floor)                 | **Not** in `LOCATION_MAP_OBJECT_KIND_IDS` today — **either** add `table` to shared constants + validation + `[LOCATION_MAP_OBJECT_KIND_ICON_NAME](src/features/content/locations/domain/mapContent/locationMapPresentation.constants.ts)` + Mongoose + placement policy for `floor`, **or** Phase-1 map to `marker` with a distinct label. Prefer one clear approach and document it.                                                                                                                           |
| **building** / **site** (city)    | Ideal: link flows (`linkedLocationId`) with modals filtered by `linkedScale` (reuse option filtering pattern from `[LocationCellAuthoringPanel](src/features/content/locations/components/LocationCellAuthoringPanel.tsx)`). If timeboxed: **gate** with resolver returning `unsupported` for Phase 1 except **city@world**, and disable or toast for others — only if you must ship minimal; otherwise implement the same modal pattern for building/site using campaign locations filtered by scale + policy. |


**Unresolved links:** When `**resolvePlacedKindToAction`** returns `**link-modal`**, set `**LocationMapPendingPlacement**` to `{ type: 'linked-location', ... }` and **do not** write `linkedLocationByCellId` until modal confirm.

## 5) City link modal (world + city placement)

- Local state: `**pendingPlacement: LocationMapPendingPlacement`** (non-null) + `AppModal` open when user clicked a target cell and the resolver returned `**link-modal`** (Phase 1: typically **city** @ **world**, encoded in `pendingPlacement` as `type: 'linked-location'` with `linkedScale: 'city'`, `hostScale: 'world'`).
- Form: wrap modal body in `FormProvider` + local `useForm`; `[FormSelectField](src/ui/patterns/form/FormSelectField.tsx)` for city id.
- Options: start from `getAllowedLinkedLocationOptions(host, locations, { campaignId, excludeLocationId })` and **filter** `loc.scale === 'city'`. **“Published”** is not modeled on `[ContentItem](src/features/content/shared/domain/types/content.types.ts)` today — **document assumption** in code: e.g. “all campaign cities allowed by link policy” until a `published` (or equivalent) field exists; optionally exclude entries missing a default map if you add a cheap predicate.

## 6) UI structure

- **Workspace:** Prefer **not** changing `[LocationEditorWorkspace](src/features/content/locations/components/workspace/LocationEditorWorkspace.tsx)` API initially. Instead, wrap the **canvas** subtree in a horizontal flex inside `[LocationEditRoute](src/features/content/locations/routes/LocationEditRoute.tsx)` / building branch: `[ toolbar column | LocationEditorCanvas ]` so the toolbar is **inside** the canvas column, flush left of the viewport region.
- `**LocationMapEditorToolbar`:** Vertical `ToggleButtonGroup` or `IconButton` stack (MUI) with active styling; tools: Select, Place, Paint, Clear fill. Compact sizing consistent with app patterns.
- `**LocationMapEditorPaintTray`:** Renders when `mode === 'paint'`; docks **to the right of the toolbar** (row layout) with a slim vertical swatch list or small grid; colors from theme via existing `[getMapSwatchColor](src/app/theme/mapColors.ts)` / meta `swatchColorKey`. Selected swatch clearly highlighted (`activePaint: LocationMapActivePaintSelection`).
- **Place palette in right rail:** When `mode === 'place'`, inject a **Place** panel above or within the Metadata tab (or a third tab — prefer **conditional block in Metadata tab** to avoid tab explosion): list/grid of `MapPlacePaletteItem` from `getPlacePaletteItemsForScale(mapHostScale)`. Selecting an item sets `activePlace: LocationMapActivePlaceSelection`. Reuse patterns from `[LocationCellAuthoringPanel](src/features/content/locations/components/LocationCellAuthoringPanel.tsx)` (chips/cards) where sensible.

Constants: add `LOCATION_EDITOR_TOOLBAR_WIDTH_PX` next to `[locationEditor.constants.ts](src/features/content/locations/components/workspace/locationEditor.constants.ts)` for layout and grid width calculations in `[LocationGridAuthoringSection](src/features/content/locations/components/LocationGridAuthoringSection.tsx)` (`canvasW` currently subtracts only right rail).

## 7) Interaction: pan, paint, clear-fill, place

**Pan / paint conflict:** Canvas pan attaches to the outer `[LocationEditorCanvas](src/features/content/locations/components/workspace/LocationEditorCanvas.tsx)` `Box`. Cell buttons bubble pointer events upward. For **paint** and **clear-fill** strokes, **stopPropagation** (capture phase) on the grid wrapper when handling painting so `useCanvasPan` does not treat the gesture as pan. For **select**, keep current behavior.

**Optional refinement:** Add `panEnabled` / `suppressPan` to `LocationEditorCanvas` or pass **no-op** `pointerHandlers` while `isPaintingGesture` — but propagation stop on grid is usually enough if the grid fills the interactive area.

**Paint / clear-fill gesture model:**

- Add optional props to `GridEditor` and `HexGridEditor` (same shape): e.g. `onCellPointerDown`, `onCellPointerEnter`, `onCellPointerUp` (or one `onCellPaintEvent` discriminated union). Wire from `[LocationGridAuthoringSection](src/features/content/locations/components/LocationGridAuthoringSection.tsx)` to handlers that:
  - Maintain a `Set<string>` for current stroke (`cellId`) for **dedupe**.
  - **Paint:** if no active swatch, no-op; else batch updates to `cellFillByCellId` in a **single** `setGridDraft` per stroke segment (pointerup flushes if you defer — simplest: update state per new cell but use a Set to skip duplicates; **optional** `strokeBatchRef` to commit one undo-sized batch later).
  - **Clear-fill:** remove `cellFillKind` for cells in stroke only (do not touch `linkedLocationByCellId` / `objectsByCellId`).
- **Cursor:** `LocationEditorCanvas` `sx.cursor` — `crosshair` or `cell` for paint/clear-fill when not dragging; keep `grab`/`grabbing` for select.

**Place mode:** `onCellClick` (or pointer up without drag) resolves cell; if `linkedScale` from meta + host scale indicates modal flow, open modal with `targetCellId`; else apply placement bridge directly.

**Select mode:** Preserve existing `onCellClick` selection + `onCellFocusRail`.

## 8) Visual: cell fill under icons

In `LocationGridAuthoringSection`, derive background color from `cellFillByCellId[cellId]` via meta + theme. Ensure **selected** / **excluded** border logic stays readable (fill can sit under existing `[gridCellStyles](src/ui/patterns/grid/gridCellStyles.ts)` tokens — may need semi-transparent overlay vs replacing `bgcolor`).

## 9) Tests (focused)

- Palette helper tests (allowed kinds × meta).
- Pure **stroke dedupe** helper if extracted (input: ordered cell ids, output: unique in order).
- `cellAuthoringMappers` round-trip including `cellFillKind` (new test file next to mappers).
- Optional: validation tests for `cellFillKind` in `validateCellEntriesStructure`.

## 10) Files likely touched (summary)


| Area                      | Files                                                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Syntax fixes              | `locationCellFill.types.ts`, `locationMapIconNames.ts`, `locationScaleMapContent.policy.test.ts`                                                                                       |
| Shared types / validation | `locationMap.types.ts`, `locationMapCellAuthoring.validation.ts`, possibly new shared const for fill ids                                                                               |
| Server schema             | `CampaignLocationMap.model.ts`, `locationMaps.service.ts` if merge validation                                                                                                          |
| Draft / mappers           | `locationGridDraft.types.ts`, `cellAuthoringMappers.ts`                                                                                                                                |
| Meta / helpers            | `locationPlacedObject.types.ts`, new `locationMapEditorPalette.helpers.ts`, `locationMapEditor.types.ts`                                                                               |
| UI                        | New toolbar + paint tray + place panel + city modal; `LocationGridAuthoringSection.tsx`, `GridEditor.tsx`, `HexGridEditor.tsx`, `LocationEditRoute.tsx`, `locationEditor.constants.ts` |
| Barrel exports            | `domain/index.ts` or mapEditor barrel as appropriate                                                                                                                                   |


## Follow-up gaps / assumptions

- **“Published” cities:** No `published` field found on content models — Phase 1 will use **policy-filtered campaign cities**; narrow later when product defines publish state.
- `**table` / full building-site modals:** May need shared `LOCATION_MAP_OBJECT_KIND_IDS` extension or explicit `marker` mapping — call out chosen approach in PR.
- **Undo batching:** Structure stroke state so a future undo stack can treat one pointer gesture as one operation; initial implementation can use per-cell updates with dedupe.
- **System patch route** (`isSystem && driver`): If map grid is shown, apply the same toolbar for parity **or** explicitly hide tools — product choice (default: **same** components when `showMapGridAuthoring`).

---

## Phase 2 continuation (build order)

Phase 1 scope above is **implemented in tree** (toolbar, paint/clear-fill, place palette + resolver bridge, cell fills persisted, grid gestures, linked-location modal pattern). Use this list when resuming work.

### A. Reliability and polish (highest when unblocked)

1. **Path/place click reliability** — If clicks still fail to persist segments after `suppressCanvasPanOnCells` in place mode, narrow down with: `pointerdown` capture on grid vs canvas order, `click` vs `pointerup` placement, trackpad micro-movement, and whether `useCanvasPan` should ignore `defaultPrevented` or check `event.target` inside grid. Optional **explicit commit on `pointerup`** on the cell (with slop threshold) instead of relying on `click`.
2. **Pan in place mode** — Document or add **secondary pan** (e.g. middle-mouse or modifier+drag) if full-grid “no pan on cells” feels too tight.

### B. Parity and product gaps from Phase 1 notes

1. **Hex maps** — `LocationGridAuthoringSection` only draws path/edge SVG overlays for **square** geometry; add hex line geometry + same place preview behavior or hide path/edge tools on hex until ready.
2. `**table` vs `marker`** — Decide per plan §4: extend `LOCATION_MAP_OBJECT_KIND_IDS` with `table` or map to `marker` + label; align validation and icons.
3. **Building/site link modals** — Same modal pattern as city@world where policy allows; gate behind resolver until implemented.

### C. Editor power

1. **Undo/redo** — Batch stroke updates (`cellFillByCellId`, paint stroke) into one undo step; optional for place-object drag stroke.
2. **Erase mode refinement** — Already have `resolveEraseTargetAtCell`; ensure ordering matches product (edge → object → path → link) and UX feedback.

### D. System route parity

1. `**LocationEditRoute` system branch** — Mirror map editor chrome when `showMapGridAuthoring` or document intentional omission.

