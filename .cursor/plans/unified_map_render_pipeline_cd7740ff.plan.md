---
name: Unified map render pipeline
overview: Establish a shared authored-map render-model contract (cells, paths, edges, objects) with strict derive-vs-render split; wire all consumers—location editor, building-floor maps, combat authoring overlays—through the same derivation direction; fix stacking parity; extend encounter presentation only as one serialization of that model. Runtime GridObject/obstacle UI stays separate. Update relevant docs/reference to match the pipeline, layer order, and derive/render split.
todos:
  - id: contract-and-types
    content: Define LocationMapAuthoredObjectRenderItem + authored-map render-model doc; add shared derive helpers (objects) alongside path/edge precedents
    status: completed
  - id: serialize-and-consumers
    content: Wire canonical items into EncounterAuthoringPresentation + CombatGridAuthoringOverlay; align editor z-order and single authored-object render path (no divergent rules)
    status: completed
  - id: layer-order-audit
    content: Verify base-map layer order matches doc across editor/building/combat surfaces
    status: completed
  - id: duplication-note
    content: If LocationMapCellAuthoringOverlay is not fully deduped, document remaining duplication and why
    status: completed
  - id: docs-reference
    content: Update relevant docs/reference (see §12) for authored-map pipeline, layer order, EncounterAuthoringPresentation, editor vs combat
    status: completed
isProject: false
---

# Unified authored-map render pipeline

## 1. Goal — shared render-model, not a combat-only patch

The **real deliverable** is a **pipeline-oriented** shared **authored-map render model** whose layers are:

- **Cells** — terrain/region/fill intent (already flows via `cellFillByCombatCellId` / region keys + [`mergeAuthoringMapUnderlayIntoCellSx`](src/features/combat/components/grid/cellVisualStyles.ts); editor uses draft + cell backgrounds).
- **Paths** — centerline / polyline geometry from [`locationMapPathPolyline.helpers.ts`](shared/domain/locations/map/locationMapPathPolyline.helpers.ts), smoothed for display in [`pathOverlayRendering.ts`](src/features/content/locations/components/pathOverlayRendering.ts).
- **Edges** — segment geometry from [`locationMapEdgeGeometry.helpers.ts`](shared/domain/locations/map/locationMapEdgeGeometry.helpers.ts) (and related square helpers).
- **Objects** — **new** canonical render items derived from map `cellEntries` (presentation only).

**Consumers of the same direction** (must not drift):

- **Location workspace editor** (including **building** floor maps — same grid/draft surfaces).
- **Combat** [`CombatGridAuthoringOverlay`](src/features/combat/components/grid/CombatGridAuthoringOverlay.tsx) / encounter serialization.
- Any other surface that shows authored map chrome (e.g. setup previews) should **consume the same derivation** or the same serialized presentation blob—not one-off object rules.

Framing: **do not** treat the work as “only add objects to `EncounterAuthoringPresentation`.” That serialization is **one consumer** of the shared **derive** step; the **shared contract** is the authored render-model and helpers.

## 2. Precedent — cell / path stages (derive → style → render)

| Layer | Derive (state / geometry) | Resolve style | Render |
| ----- | --------------------------- | ------------- | ------ |
| **Combat tactical cells** | [`getCellVisualState`](src/features/combat/components/grid/cellVisualState.ts) from `GridCellViewModel` | [`getCellVisualSx`](src/features/combat/components/grid/cellVisualStyles.ts), [`mergeAuthoringMapUnderlayIntoCellSx`](src/features/combat/components/grid/cellVisualStyles.ts) for authored fills/regions | [`CombatGrid`](src/features/combat/components/grid/CombatGrid.tsx) |
| **Paths** | Shared [`pathEntryToPolylineGeometry`](shared/domain/locations/map/locationMapPathPolyline.helpers.ts) / `pathEntriesToPolylineGeometry` | [`resolveLocationMapUiStyles`](src/features/content/locations/domain/mapPresentation/locationMapUiStyles.ts) stroke tokens | Feature adapter [`pathOverlayRendering.ts`](src/features/content/locations/components/pathOverlayRendering.ts) (smoothing only) → SVG `d` |

**Objects** must mirror **paths**: shared domain = **pure items + geometry anchors**; feature = **icons, SVG/React, z-order, MUI**.

## 3. Strict derive vs render split

| Responsibility | Owner | Rule |
| -------------- | ----- | ---- |
| Pure render-item lists, cell/combat id mapping, numeric geometry (centers, segments, polylines) | `shared/domain` (and mechanics types for serialized blobs) | **No** `react`, **no** MUI, **no** `@/features/...` UI imports. |
| Icon selection (`getLocationMapObjectKindIcon`), JSX, SVG markup, `sx`, theme, stacking contexts, Catmull-Rom smoothing | Feature/components (`src/features/...`) | May import shared helpers and types. |

If a helper needs theme or components, it **does not** belong in `shared/domain`.

## 4. Canonical type — `LocationMapAuthoredObjectRenderItem`

**Suggested name:** `LocationMapAuthoredObjectRenderItem` (export from `shared/domain/locations/map/` alongside helpers).

**Minimum fields** (adjust naming slightly if needed for consistency with [`LocationMapCellObjectEntry`](shared/domain/locations/map/locationMap.types.ts), but **one** canonical shape everywhere—no parallel ad hoc `objectEntries` row types in multiple layers):

| Field | Purpose |
| ----- | ------- |
| `id` | Stable authored object id (from map persistence). |
| `authorCellId` | Authoring grid key (`"x,y"` style as elsewhere on the map). |
| `combatCellId` | Render/combat cell id (`c-x-y`) — single identity for overlays that align to [`squareCellCenterPx`](shared/domain/grid/squareGridOverlayGeometry.ts). |
| `kind` | `LocationMapObjectKindId` (or string union from shared types). |
| `authoredPlaceKindId?` | When present; bridges palette / future tooling. |
| `label?` | Optional display/tooltip text. |

**Derivation:** `deriveLocationMapAuthoredObjectRenderItems(map: LocationMapBase): LocationMapAuthoredObjectRenderItem[]` (or equivalent) — **flattened list** preferred so consumers do not re-implement grouping; index by `combatCellId` in the feature layer if needed.

**Serialization:** `EncounterAuthoringPresentation` should reference **this same shape** (e.g. `authoredObjectRenderItems: LocationMapAuthoredObjectRenderItem[]` or a thin array-of-rows that maps 1:1 to the canonical type). **Avoid** inventing a second object-row type in mechanics that duplicates fields with different names.

## 5. Rendering contract — cell-anchored overlay items

**Decision for the implementer (document in code + this plan):**

- Authored objects are **logically** “**one or more visual glyphs anchored to a single map cell**” (cell-centered or cell-bounded layout), **not** free-floating map annotations with arbitrary pixel coordinates.
- **Implementation** may still draw them in an **absolute overlay** (same as paths/edges): the **contract** is **cell identity + optional stack offset within the cell** if multiple objects share a cell—not arbitrary x/y in map space.

This keeps **editor, building-floor editor, and combat authoring overlay** aligned: same anchor semantics (`combatCellId` → center from shared geometry).

## 6. Base-map layer order (required)

**Authored base map** (bottom → top):

1. **Cell fills / region underlay** (including authored fill + region tint via cell styling where applicable).
2. **Paths** (strokes).
3. **Edges** (wall/door/window segments).
4. **Authored object glyphs** (icons or future symbols anchored per §5).

**Above** that stack (always):

- **Combat-specific** overlays: movement, AoE, placement bands, perception tints — from [`getCellVisualState`](src/features/combat/components/grid/cellVisualState.ts) / [`getCellVisualSx`](src/features/combat/components/grid/cellVisualStyles.ts).
- **Tokens** and **runtime obstacle letter/glyph** ([`CombatGrid`](src/features/combat/components/grid/CombatGrid.tsx) `obstacleLabel` / T–P)—see §7.

**Implementation must** preserve this order consistently across **editor** (including building), **combat** underlay, and any other authored viewer—adjusting **z-index** and **DOM order** deliberately, not per-surface one-offs.

## 7. Scope protection — authored presentation vs runtime mechanics

- **In scope:** Authored **map** object **presentation** derived from location map `cellEntries` / shared render items.
- **Out of scope for merging:** [`GridObject`](packages/mechanics/src/combat/space/space.types.ts), [`getEncounterGridObjects`](packages/mechanics/src/combat/space/space.helpers.ts), `obstacleKind` / `obstacleLabel` on [`GridCellViewModel`](packages/mechanics/src/combat/space/selectors/space.selectors.ts), procedural `tree`/`pillar` placement.
- **Do not** replace or blend authored icons with runtime obstacle labels; **do not** fold authored rendering into combat mechanics selectors.

## 8. Optional dedupe — `LocationMapCellAuthoringOverlay`

- **OK** if [`LocationMapCellAuthoringOverlay`](src/features/content/locations/components/mapGrid/LocationMapCellAuthoringOverlay.tsx) is **not** fully refactored in the first pass.
- **Not OK:** a **second, divergent** authored-object rule set (different kinds, ids, or positioning math). New UI must **consume** `LocationMapAuthoredObjectRenderItem[]` (filtered per cell) **or** a single shared presenter component fed by those items.
- If duplication remains for scope, **explicitly note** in PR/code comment: what is duplicated, why, and the follow-up to consolidate.

## 9. Symptom note — building maps / “edges only”

- **Combat:** `EncounterAuthoringPresentation` previously omitted objects; overlays drew paths + edges only—**one** gap.
- **Editor:** SVG overlay historically **above** the grid could **obscure** cell-hosted icons—**stacking** gap.
- Both are **examples** of why the **unified model + layer order** matters; fixing only encounter serialization without **derive contract** and **consumer alignment** would miss the pipeline goal.

## 10. Files and integration (non-exhaustive)

| Area | Action |
| ---- | ------ |
| `shared/domain/locations/map/` | Add `LocationMapAuthoredObjectRenderItem`, `deriveLocationMapAuthoredObjectRenderItems`, tests. |
| `packages/mechanics/.../space.types.ts` | Extend `EncounterAuthoringPresentation` using **canonical** object array shape. |
| `buildEncounterAuthoringPresentationFromLocationMap.ts` | Populate object items via shared derive (re-export or import types from shared). |
| `CombatGridAuthoringOverlay.tsx` | Render object layer from items + shared center geometry; no duplicate derivation. |
| `SquareMapAuthoringSvgOverlay` / `LocationGridAuthoringSection` | Fix z-order per §6; route object icons through shared items/presenter. |
| Tests | Shared derive tests; presentation build tests; optional snapshot for layer stacking. |
| `docs/reference/*` | See **§12** — update relevant reference docs when behavior/contracts change. |

## 11. Edge pipeline follow-up (unchanged intent)

- Committed edges already share `edgeEntriesToSegmentGeometrySquare`; editor preview strokes may remain feature-local until a single `shared/domain` edge render-model helper is justified.

## 12. Documentation — `docs/reference` (in scope)

**Requirement:** Keep human-facing reference aligned with the implemented pipeline so future work does not regress to one-off combat-only framing.

**Update as needed** (not every file may need edits—apply judgment after implementation):

| Doc | Why |
| --- | --- |
| [`docs/reference/space.md`](docs/reference/space.md) | `EncounterAuthoringPresentation`, authored vs runtime grid objects, spatial narrative—add/refresh **authored object presentation** and **layer order** where `GridCellViewModel` / underlay are discussed. |
| [`docs/reference/combat/client/grid.md`](docs/reference/combat/client/grid.md) | CombatGrid vs EncounterGrid boundary—document **authored base map** stack (paths, edges, objects) **under** tactical cell overlays; pointer to shared derive vs feature render. |
| [`docs/reference/locations/location-workspace.md`](docs/reference/locations/location-workspace.md) | Location map authoring UX—**editor** layer order, building-floor parity, objects as authored layer. |
| [`docs/reference/locations/domain.md`](docs/reference/locations/domain.md) | If it covers map schema or authoring, cross-link **render pipeline** and `LocationMapAuthoredObjectRenderItem`. |
| [`docs/reference/combat/authored-content/location-floor-adapter.md`](docs/reference/combat/authored-content/location-floor-adapter.md) | Building/floor → encounter—ensure **presentation blob** and **objects** are described consistently with code. |

**Content to reflect:**

- **Derive vs render** boundary (`shared/domain` vs `src/features/...`).
- **Canonical type** name and **base-map layer order** (§6).
- **Explicit separation:** authored map object **icons** vs **runtime** `GridObject` / obstacle glyphs.

---

## Appendix — quick reference for implementers

**Suggested canonical names**

- `LocationMapAuthoredObjectRenderItem` — shared row type.
- `deriveLocationMapAuthoredObjectRenderItems` — shared entry point from `LocationMapBase`.

**Intended base-map layer order (repeat)**

1. Cell fills / region underlay  
2. Paths  
3. Edges  
4. Authored objects  
5. (then combat overlays, tokens, runtime obstacle glyphs)

**Risk notes**

- **Editor vs combat parity:** Different DOM trees (CSS grid cells vs pixel `CombatGrid`) — **same** derive output and **same** anchor rule (`combatCellId` → center); verify visually on building floors and encounter.
- **Object anchoring:** Multiple objects per cell may need **in-cell** layout in the feature layer; the **shared** contract still lists **flat** items with stable `id`, not pixel positions.
- **Serialization size:** Flat arrays of small rows are acceptable; avoid duplicating large blobs per consumer.
