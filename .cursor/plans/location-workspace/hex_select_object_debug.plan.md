---
name: ""
overview: ""
todos: []
isProject: false
---

# Debug plan: hex map — Select mode does not surface placed objects (Selection rail)

**Context:** In the location editor, clicking a hex cell that contains a placed object should drive `mapSelection` to `{ type: 'object', cellId, objectId }` so the **Selection** tab shows object details. Reports indicate this still fails on hex while square behaves as expected.

---

## 0. Prior attempts — exhausted (do not repeat)

### Attempt 1 — Tighten path pick tolerance (hex + objects)

**What:** Reduced `DEFAULT_PATH_PICK_TOLERANCE_PX` for hex cells whose anchor has objects, so `resolveNearestPathHit` wouldn't steal from the interior draft check.

**Result:** Did not resolve.

### Attempt 2 — Promote draft objects/linked above path geometry in resolver

**What:** In `resolveSelectModeInteractiveTarget`, inserted an early check for `objectsByCellId[anchorCellId]` and `linkedLocationByCellId[anchorCellId]` **between** the edge geometry check and the path geometry check. This guaranteed the resolver returned `{ type: 'object' }` before path picking could fire, regardless of path proximity. Also replaced the trailing `resolveSelectModeAfterPathEdgeHits` call with `resolveSelectModeRegionOrCellSelection` (since objects/linked were already resolved). All 33 select-mode unit tests passed (including 3 new regression tests for object-over-path priority). Tests in `resolveSelectModeInteractiveTarget.test.ts` and `*.rectFallback.test.ts` confirmed the resolver logic was correct.

**Result:** Did not resolve. The bug persists in the browser even though the resolver returns the correct value in unit tests.

### Attempt 3 — Anchor-scoped DOM picks (`pickDomMapSelectionFromStack`)

**What:** Tightened DOM resolution so object/link hits must belong to the clicked cell’s `anchorCellId`: helpers `objectNodeBelongsToAnchorCell` / `linkedNodeBelongsToAnchorCell` (explicit `data-map-*-cell-id` match, else require node under that anchor’s `[role=gridcell][data-cell-id]`). Grid-wide rect pass filters candidates to the anchor before topmost tie-break; stack walk no longer uses `data-map-object-cell-id ?? anchorCellId` for foreign nodes. Regression test: foreign stack node + draft object on anchor falls through to interior.

**Result:** Did not resolve in the browser (user report). Suggests either (a) path geometry still wins before draft interior in the shipped order, (b) `objectsByCellId[anchorCellId]` empty at click time despite visible icons, or (c) click / selection pipeline outside the resolver.

### Attempt 4 — Hex + `objectsByCellId[anchor]` before `resolveNearestPathHit` (restore + trim)

**What:** Re-applied Attempt 3 anchor-scoped DOM logic. Added an explicit branch in `resolveSelectModeInteractiveTarget`: when `isHex` and the draft has at least one placed object for the anchor cell (`trim`ped id, with fallback lookup on raw `p.anchorCellId` if keys differ), return `resolveSelectModeAfterPathEdgeHits` **before** path geometry so `resolveNearestPathHit` cannot steal clicks meant for object selection. `useLocationGridSelectMode` passes `cell.cellId.trim()` into the resolver and region-drill refinement. Unit tests: `hex: draft object wins over path geometry through the same cell`, plus stack-walk foreign-node regression.

**Tradeoff:** Selecting a path segment that runs through a hex cell that also has placed objects may require clicking another cell along the path (or future path-only hit target).

**Result:** Did not resolve in the browser (user report).

### Attempt 5 — Hex `.hex-inner` `pointer-events: auto` (hover / Tooltip)

**What:** In `HexGridEditor`, changed `.hex-inner` from `pointerEvents: 'none'` to `'auto'`. The old value was intended so clicks pass through to the `button[role=gridcell]`, but it appears to block MUI `Tooltip` and consistent hit-testing over object icons on hex (matches “no outline / no tooltip on hex” above).

**Result:** Pending verification in browser.

### What these attempts rule out

| Hypothesis | Status |
|------------|--------|
| Path geometry stealing before interior draft check | **Inconclusive.** Attempt 2 (reorder) did not fix in browser; Attempt 3 (DOM-only) did not fix — **retry explicit hex + `objectsByCellId[anchor]` before `resolveNearestPathHit`** in current code path. |
| Resolver priority ordering (pure-function logic) | **Eliminated.** Unit tests prove the resolver returns `{ type: 'object' }` given correct inputs (no DOM, no paths, hex, objects in draft). |
| `resolveSelectModeAfterPathEdgeHits` not finding objects in `objectsByCellId` | **Eliminated in isolation.** Unit test `'interior: object wins over region on same cell'` passes with `isHex: true`. |

### What remains

The resolver's pure-function logic is correct. **The failure is in the runtime pipeline surrounding the resolver** — either the resolver never runs, receives wrong inputs, or its output is lost/ignored before reaching the Selection rail.

### Runtime symptom: hover on placed-object icon (square vs hex)

**Observed (user):**

| Grid | Hover over object icon (MUI `Tooltip` + outline from `selectHoverTarget`) |
|------|---------------------------------------------------------------------------|
| **Square** | Object **outline** appears + **tooltip** shows. |
| **Hex** | **No** outline and **no** tooltip. |

**Why this matters:**

- **Tooltip** only activates when the pointer actually hits the **trigger** DOM (the `span` / `Tooltip` child). No tooltip ⇒ the pointer is **not** reaching the interactive layer under hex the same way as on square.
- **Outline** in `LocationMapCellAuthoringOverlay` depends on `selectHoverTarget` from `handleSelectPointerMove` → `resolveSelectModeInteractiveTarget` matching `{ type: 'object', cellId, objectId }`. Missing outline on hex can mean either (a) pointer never hits `[data-map-object-id]` so DOM/stack resolution differs, or (b) hover resolution never yields `type: 'object'` for that cell.
- Together, this strongly suggests **hex-specific stacking / `pointer-events` / `clip-path`** (see `HexGridEditor` `.hex-inner` `pointerEvents: 'none'`, hex `clip-path` on the cell button) blocking or diverting events before they reach the overlay icons — **not** (only) resolver priority.

**Next checks:** `elementsFromPoint` / event `target` over a hex object icon vs square; whether `.hex-inner { pointer-events: none }` + children must explicitly re-enable hits for Tooltip in the target browser; compare `GridEditor` cell DOM (no `hex-inner` none layer).

---

## 1. End-to-end data flow (what to verify)

1. **Pointer / click** hits the map → `HexGridEditor` cell `onClick` → `LocationGridAuthoringSection` `onCellClick` → (when `mapEditorMode === 'select'`) `onSelectModeCellClick`.
2. **`onSelectModeCellClick`** (`useLocationGridSelectMode`) calls **`resolveSelectModeInteractiveTarget`** with `anchorCellId: cell.cellId`, `clientX/Y`, `gx/gy` (grid-local), `targetElement: e.target`, and draft slices from **`buildSelectModeInteractiveTargetInput`**.
3. **Result** is written to **`gridDraft.mapSelection`** (and `selectedCellId` via **`selectedCellIdForMapSelection`**).
4. **Selection rail** reads **`mapSelection`** and renders **`LocationMapObjectInspector`** when `selection.type === 'object'` (`LocationEditorSelectionPanel`).

Any break between (1) and (3), or a wrong `mapSelection` shape, will look like "object never recognized."

---

## 2. Key files and symbols (by layer)

### 2.1 Orchestration (workspace / grid host)

| File | What to inspect |
|------|------------------|
| `src/features/content/locations/components/workspace/LocationGridAuthoringSection.tsx` | `onCellClick` branches (place/draw/erase/paint vs select); `onSelectModeCellClick`; `gridContainerRef` used for `gx`/`gy`; `handleHexFallbackClick` (hex container click — mostly place/path gap, **not** select); overlay order: `LocationGridAuthoringHexMapOverlayLayer` then inner `Box` + `HexGridEditor`. |
| `src/features/content/locations/components/workspace/useLocationGridSelectMode.ts` | **`onSelectModeCellClick`**: builds `gx`/`gy` from `gridContainerRef.getBoundingClientRect()`; calls **`resolveSelectModeInteractiveTarget`**; **`refineSelectModeClickAfterRegionDrill`**; **`handleSelectPointerMove`** (hover uses `elementsFromPoint` + anchor resolution including **`resolveHexCellFromClient`**); **`handleSelectGridContainerClick`** returns early when **`isHex`** (gap clicks for **square** only). |

### 2.2 Hex cell UI (DOM / hit-testing)

| File | What to inspect |
|------|------------------|
| `src/features/content/locations/components/mapGrid/HexGridEditor.tsx` | Outer **`component="button"`** `role="gridcell"`; inner **`.hex-inner`** has **`pointerEvents: 'none'`**; `clip-path` hex shape; `renderCellContent` (icons) lives inside inner wrapper — affects **`e.target`** and **`elementsFromPoint`** stack vs square `GridEditor`. |
| `src/features/content/locations/components/mapGrid/LocationMapCellAuthoringOverlay.tsx` | **`data-map-object-id`**, **`data-map-object-cell-id`** on object wrapper; outer container **`pointerEvents: 'none'`** with inner **`Stack`** **`pointerEvents: 'auto'`**; **Tooltip** wraps each object. |

### 2.3 SVG overlays (z-order vs pointer-events)

| File | What to inspect |
|------|------------------|
| `src/features/content/locations/components/workspace/locationGridAuthoringMapOverlayLayers.tsx` | Hex overlay host: **`pointerEvents: 'none'`** on wrapper; child **`HexMapAuthoringSvgOverlay`**. |
| `src/features/content/locations/components/mapGrid/authoring/HexMapAuthoringSvgOverlay.tsx` | Root **`<svg style={{ pointerEvents: 'none' }}>`** — confirm **child** `<path>` / `<line>` do not override to receive hits in target browsers. |
| `src/features/content/locations/components/mapGrid/LocationMapPathSvgPaths.tsx` | Path elements (no explicit `pointer-events`; should inherit SVG root). |

### 2.4 Select-mode resolver (single source of truth)

| File | What to inspect |
|------|------------------|
| `src/features/content/locations/domain/authoring/editor/selectMode/resolveSelectModeInteractiveTarget.ts` | **`resolveSelectModeInteractiveTarget`**: order is DOM stack / `targetElement` → square **edges** → **path** (`resolveNearestPathHit`) → **`resolveSelectModeAfterPathEdgeHits`**; **`pickDomMapSelectionFromStack`**, **`pickObjectOrLinkedByGridWideRects`**, **`gridcellButtonForAnchorCellId`**. |
| `src/features/content/locations/domain/authoring/editor/selectMode/resolveSelectModeRegionOrCellSelection.ts` | **`resolveSelectModeAfterPathEdgeHits`**: **objects (draft) → linked → region → cell** — requires **`objectsByCellId[anchorCellId]`** populated. |
| `src/features/content/locations/domain/authoring/editor/selectMode/locationMapSelectionHitTest.ts` | **`resolveNearestPathHit`**, **`DEFAULT_PATH_PICK_TOLERANCE_PX`**; hex+object tightening (if present) lives next to the **`resolveNearestPathHit`** call site in the resolver file. |
| `src/features/content/locations/domain/authoring/editor/selectMode/buildSelectModeInteractiveTargetInput.ts` | **`buildSelectModeInteractiveTargetInput`**: passes **`objectsByCellId`**, **`pathPolys`**, **`isHex`**, etc., from **`LocationGridDraftState`**. |
| `src/features/content/locations/domain/authoring/editor/selectMode/refineSelectModeClickAfterRegionDrill.ts` | Only refines **region → cell** on repeated same-region click; does not promote to **object**. |

### 2.5 Geometry helpers (hex-specific)

| File | What to inspect |
|------|------------------|
| `src/features/content/locations/components/authoring/geometry/hexGridMapOverlayGeometry.ts` | **`hexCellCenterPx`**, **`hexOverlayDimensions`**, **`resolveNearestHexCell`** — must stay aligned with **`HexGridEditor`** layout math. |
| `src/features/content/locations/hooks/useLocationAuthoringGridLayout.ts` | Supplies **`cellCenterPx`** for path polylines and **`hexGridGeometry`** for overlay size. |

### 2.6 Draft / rail

| File | What to inspect |
|------|------------------|
| `src/features/content/locations/components/authoring/draft/locationGridDraft.types.ts` | **`objectsByCellId`** shape. |
| `src/features/content/locations/domain/authoring/map/cellAuthoringMappers.ts` | **`cellEntriesToDraft`** / **`cellDraftToCellEntries`** — key consistency for **`cellId`** strings. |
| `src/features/content/locations/components/workspace/rightRail/selection/LocationEditorSelectionPanel.tsx` | **`case 'object'`** → **`LocationMapObjectInspector`**. |
| `src/features/content/locations/components/workspace/rightRail/locationEditorRail.helpers.ts` | **`selectedCellIdForMapSelection`** — object selection keeps **`cellId`** for grid chrome. |

### 2.7 Tests (repro / regression)

| File | Role |
|------|------|
| `src/features/content/locations/domain/authoring/editor/__tests__/selectMode/resolveSelectModeInteractiveTarget.test.ts` | Interior priority, path vs region, hex tolerance cases. |
| `src/features/content/locations/domain/authoring/editor/__tests__/selectMode/resolveSelectModeInteractiveTarget.rectFallback.test.ts` | DOM stack / rect fallbacks for **`[data-map-object-id]`**. |

---

## 3. Remaining hypotheses (re-prioritized after attempt 2)

Since the resolver returns correct results in unit tests but the bug persists in the browser, **the failure is in runtime wiring, not pure resolver logic.** The next agent **MUST add temporary runtime instrumentation** (`console.log` / breakpoints) to the browser to identify which layer fails. Do not attempt another code-only fix without runtime evidence.

### Tier A — Most likely (check first)

**A1. `pickDomMapSelectionFromStack` returns a wrong non-null result that preempts everything**

The DOM-based check runs FIRST in the resolver (before any draft or geometry check). In hex cells, `document.elementsFromPoint` may return an element whose `.closest()` walk matches an unexpected `[data-map-object-id]` or `[data-map-linked-cell]` from a **different** cell, a stale Tooltip Portal node, or an overlay element — causing `pickDomMapSelectionFromStack` to return `{ type: 'object', cellId: <wrong>, objectId: <wrong> }` or `{ type: 'cell', cellId: <wrong> }`. That early return would explain why both attempt 1 (path tolerance) and attempt 2 (draft objects above paths) had no effect.

**How to verify:** In `resolveSelectModeInteractiveTarget`, log `fromStack` and `el` on the first two branches. If `fromStack` is non-null for every hex click, the bug is here.

**A2. `onSelectModeCellClick` is never reached (click suppression or wrong mode branch)**

- `consumeClickSuppressionAfterPan` in `onCellClick` (`LocationGridAuthoringSection.tsx` line 411) may be returning `true` after every pan, swallowing the click.
- `mapEditorMode` may not be `'select'` when expected (e.g., stale prop or race after mode switch).
- The hex container `onClick` handler (`handleHexFallbackClick`) fires on the same click event (after bubble from cell button). It returns early in select mode, but verify it doesn't call `e.stopPropagation()` or interfere.

**How to verify:** Add `console.log('onSelectModeCellClick', cell.cellId)` at the top of the callback in `useLocationGridSelectMode.ts`. If it never fires on hex clicks, the problem is upstream.

**A3. `objectsByCellId[anchorCellId]` is empty at resolve time (stale or missing draft data)**

Icons render from `draft.objectsByCellId` in `LocationMapCellAuthoringOverlay`. The resolver reads `d.objectsByCellId` inside `setDraft((d) => ...)`. If the `setDraft` callback receives a stale or wrong draft (e.g., the draft was just initialized, or the object was placed via a different state path that hasn't flushed), the lookup returns undefined.

**How to verify:** Inside the `setDraft` callback in `onSelectModeCellClick`, log `cell.cellId`, `Object.keys(d.objectsByCellId)`, and `d.objectsByCellId[cell.cellId]`. If the key exists but the array is empty, or if the key is missing entirely while icons are visible, the bug is in draft hydration.

### Tier B — Less likely but not eliminated

**B1. `refineSelectModeClickAfterRegionDrill` transforms a correct object selection into cell/region**

Code review shows it only acts on `resolved.type === 'region'`, so this should be safe — but it hasn't been verified at runtime for hex.

**How to verify:** Log both `resolved` (from `resolveSelectModeInteractiveTarget`) and `ms` (from `refineSelectModeClickAfterRegionDrill`) inside `onSelectModeCellClick`.

**B2. Selection tab not switching or showing stale panel**

`LocationEditorSelectionPanel` switches on `selection.type`. If `mapSelection` is written correctly but the rail tab state doesn't flip to the Selection tab, or if `cellPanelProps.objectsByCellId` is stale, the panel may render stale content.

**How to verify:** In `LocationEditorSelectionPanel`, log `selection` on render. Confirm it changes to `{ type: 'object' }` after a hex click. If it does but the inspector is blank, the bug is inside `LocationMapObjectInspector`.

**B3. `anchorCellId` format mismatch**

`HexGridEditor` creates cells with `makeGridCellId(x, y)` → `"x,y"`. Draft keys come from `cellEntriesToDraft` using `e.cellId` from persisted entries. If there's a trimming, padding, or encoding difference, the lookup would silently miss.

**How to verify:** Log `cell.cellId` in `onSelectModeCellClick` and compare with `Object.keys(d.objectsByCellId)` in the `setDraft` callback.

---

## 4. Required next step: runtime instrumentation

**Do not attempt another code fix without runtime evidence.** The pure-function resolver is correct; the bug is in the wiring around it.

Add **temporary** `console.log` statements (guarded by `process.env.NODE_ENV === 'development'` or just temporary — remove before committing) to `useLocationGridSelectMode.ts` inside `onSelectModeCellClick`:

```ts
// TEMPORARY — instrument hex select debug
const _debugTarget = e.target as HTMLElement;
console.log('[hex-select-debug] onSelectModeCellClick', {
  cellId: cell.cellId,
  targetNodeName: _debugTarget?.nodeName,
  targetRole: _debugTarget?.getAttribute?.('role'),
  targetDataCellId: _debugTarget?.getAttribute?.('data-cell-id'),
  clientX: e.clientX,
  clientY: e.clientY,
});
```

Inside the `setDraft((d) => { ... })` callback, before the `resolveSelectModeInteractiveTarget` call:

```ts
console.log('[hex-select-debug] draft at resolve time', {
  cellId: cell.cellId,
  objectsForCell: d.objectsByCellId[cell.cellId],
  allObjectKeys: Object.keys(d.objectsByCellId),
  mapEditorMode, // from closure — should be 'select'
});
```

After the resolver call:

```ts
console.log('[hex-select-debug] resolved', {
  resolved,
  refined: ms,
});
```

Optionally, add a one-shot log in `pickDomMapSelectionFromStack`:

```ts
console.log('[hex-select-debug] pickDomStack', {
  stackLength: stack.length,
  stackTags: stack.slice(0, 6).map(n => `${n.nodeName}.${(n as HTMLElement).className?.split?.(' ')?.[0] ?? ''}`),
  result: fromStack, // the return value
});
```

Run the app, reproduce the bug on a hex map, and read the console output. The logs will tell you exactly which layer is failing.

---

## 5. Definition of done

- Repro steps documented (grid size, hex, object kind, presence/absence of paths/regions/links).
- **Runtime logs captured** identifying which layer fails: click not firing, wrong `pickDom` result, empty `objectsByCellId`, wrong `mapSelection` type, or UI not reading state.
- Targeted fix with a test at the appropriate layer (resolver unit test vs component test vs E2E).

---

## 6. DOM structure reference (hex vs square)

### HexGridEditor DOM (per cell)

```
button[role=gridcell][data-cell-id] (clip-path, position:absolute)
  └─ Box.hex-inner (position:absolute, inset:strokePx, clip-path, pointer-events:none)
       └─ Box (maxWidth:70%, display:flex)  ← renderCellContent wrapper
            └─ LocationMapCellAuthoringOverlay:
                 ├─ Box (position:absolute, inset:0, pointer-events:none)  ← region tint
                 └─ Stack (pointer-events:auto, position:relative, zIndex:1)
                      └─ Tooltip > span[data-map-object-id][data-map-object-cell-id]
                           └─ PlacedObjectCellVisualDisplay
```

Key: `.hex-inner` has `pointer-events: none` — clicks pass through to the button. The `Stack` re-enables `pointer-events: auto` for icons, but icon bounding rects are small (22×22px) relative to the hex cell (~48px).

### GridEditor (square) DOM (per cell)

```
button[role=gridcell][data-cell-id] (position:relative, overflow:hidden)
  └─ Box (px:0.25, display:flex)  ← renderCellContent wrapper, NO pointer-events:none
       └─ LocationMapCellAuthoringOverlay:
            ├─ Box (position:absolute, inset:0, pointer-events:none)  ← region tint
            └─ Stack (pointer-events:auto, position:relative, zIndex:1)
                 └─ Tooltip > span[data-map-object-id][data-map-object-cell-id]
                      └─ PlacedObjectCellVisualDisplay
```

Key difference: no intermediate `pointer-events: none` layer in square.

---

## 7. Related reference

- `docs/reference/locations/location-workspace.md` — Select mode section (`resolveSelectModeInteractiveTarget`, interior priority, hex gap note).