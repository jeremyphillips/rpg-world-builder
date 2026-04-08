# Placed objects: end-to-end flow (reference)

This document is the **single narrative** for how **registry-defined** props and markers become **pixels on the map** and in **combat**, without duplicating the domain map ([`domain.md`](./domain.md)) or the workspace UI ([`location-workspace.md`](./location-workspace.md)).

**Operational commands** (manifest regeneration, CI validation): [`assets/system/locations/objects/README.md`](../../assets/system/locations/objects/README.md).

---

## Mental model

- **Family** = top-level key in `AUTHORED_PLACED_OBJECT_DEFINITIONS` (e.g. `table`, `door`). **`kind`** in the place palette / `activePlace` is this id.
- **Variant** = family-scoped row (`variants[variantId]`) with **`assetId`**, optional **`footprint`** (feet), optional **`cellAnchor`** (square placement).
- **Persisted cell object** = `LocationMapCellAuthoringEntry.objects[]` entry: wire **`kind`** (`LocationMapObjectKindId`), optional **`authoredPlaceKindId`**, optional **`variantId`**, plus ids for the editor.
- **Edge** (`placementMode: 'edge'`) uses the **same registry** for palette + preview assets; **map** drawing stays **vector** (`edgeEntries`), not raster sprites on cells.

---

## Flow (high level)

```mermaid
flowchart LR
  subgraph defs [Registry]
    R[AUTHORED_PLACED_OBJECT_DEFINITIONS]
  end
  subgraph assets [Manifest]
    M[location-objects.manifest.json]
    PNG[Source PNGs]
  end
  subgraph urls [URLs]
    Vite[Vite glob ?url]
    Raster[rasterAssets]
  end
  subgraph persist [Wire]
    CE[cellEntries.objects]
  end
  subgraph shared [Shared]
    Derive[deriveAuthoredObjectRenderItems]
    Item[RenderItem]
  end
  subgraph resolve [Resolve]
    Res[resolvePlacedObjectCellVisualFromRenderItem]
  end
  subgraph ui [UI]
    Auth[Authoring overlay]
    Combat[Combat inline]
  end
  R --> M
  PNG --> M
  M --> Raster
  Vite --> Raster
  R --> CE
  CE --> Derive
  Derive --> Item
  Item --> Res
  R --> Res
  Res --> Auth
  Res --> Combat
```

---

## 1. Registry (source of truth)

- **File:** `src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts`
- **`AuthoredPlacedObjectVariantDefinition`:** `assetId` (manifest key), optional **`footprint`**, **`placementMode`** on the family (`cell` | `edge`), **`palette category`**, **`runtime`** (blocking, cover, …).
- **Selectors / persistence:** `locationPlacedObject.selectors.ts` (and `.core`), `locationPlacedObject.persistence.ts` — map **family + host scale** → persisted **`kind`** / **`authoredPlaceKindId`** for new saves.

---

## 2. Assets and manifest

- **Generated manifest:** `assets/system/locations/objects/location-objects.manifest.json` (Option A: `map` + `preview` slices per `assetId`; edge families **preview-only** for `map`).
- **Generator / validation:** `scripts/location-objects-assets/` — `npm run build:location-objects-manifest`, `npm run validate:location-objects`.
- **`variantToAssetId.json`:** optional family→variant→`assetId` map used by the validator; **not** the runtime resolver (registry is authoritative for definitions).

---

## 3. Bundled URLs (client)

- **Module:** `locationPlacedObjectRasterAssets.vite.ts` (eager `import.meta.glob` of `*.png` with `?url`) registers `sourceFile → URL` in `locationPlacedObjectRasterAssets.core.ts`.
- **Preview + map:** `getPlacedObjectPreviewUrlForAssetId`, `getPlacedObjectMapImageUrlForAssetId` read **`location-objects.manifest.json`** and resolve the PNG path through the registered map.

---

## 4. Placement → draft → wire

- **Palette / toolbar:** `getPlacePaletteItemsForScale` → `MapPlacePaletteItem` with **`previewImageUrl`**; `LocationMapEditorPlaceTray` sets **`activePlace`** (`linked-content` | `map-object`, **`kind`**, **`variantId`**).
- **Click resolution:** `placementRegistryResolver.ts` → `resolvePlacementCellClick` / `resolvePlacedKindToAction` → **`buildPersistedPlacedObjectPayload`** (or link intent) → mutations to **`gridDraft`** and `cellEntries`.
- **Mappers:** `domain/authoring/map/cellAuthoringMappers.ts` — `cellDraftToCellEntries` / `cellEntriesToDraft` round-trip **`objects[]`** including **`variantId`** when present.

---

## 5. Shared render item derivation

- **Helpers:** `shared/domain/locations/map/locationMapAuthoredObjectRender.helpers.ts`
- **`deriveLocationMapAuthoredObjectRenderItems`:** builds **`LocationMapAuthoredObjectRenderItem`** (per-cell list: `authorCellId`, `combatCellId`, `kind`, optional `authoredPlaceKindId`, etc.) for **presentation** — used by authoring overlays and combat underlay filtering.

---

## Parity: feet per cell and `cellPx` (workspace vs encounter)

The resolver is deterministic: **same** `PlacedObjectGeometryLayoutContext` → **same** layout/anchor numbers. **Inputs** often differ between surfaces — that is **not** automatic “drift”; compare sources before filing a bug.

| Concern | Workspace (authoring) | Encounter / combat |
|--------|------------------------|---------------------|
| **Feet per cell** | `resolveAuthoringCellUnitFeetPerCell` (`locationCellUnitAuthoring.ts`) — full `grid.cellUnit` table (e.g. `5ft` → 5, `25ft` → 25). | From location map: `cellUnitToCombatCellFeet` (`locationCellUnitCombat.ts`) → **only 5 or 10**, coarse heuristic for `EncounterSpace` / `grid.cellFeet`. |
| **`cellPx`** | Responsive `squareCellPx` / `squareGridGeometry.cellPx` (`useLocationAuthoringGridLayout`). | Fixed tactical size `BASE_CELL_SIZE` in `CombatGrid.tsx`. |

**Examples (same `grid.cellUnit` string):**

| `grid.cellUnit` | Authoring `feetPerCell` | Combat `cellFeet` |
|-----------------|-------------------------|---------------------|
| `5ft` | 5 | 5 |
| `25ft` | 25 | 10 |
| `100ft` | 100 | 5 |

**Caveat:** `cellUnitToCombatCellFeet` uses a substring check (`includes('25')`) for the 10 ft branch (e.g. `25ft`). Other units such as `100ft` fall through to **5** in combat while authoring may use **100** ft/cell. Treat combat feet as **mechanics-scale**, not a guarantee of pixel parity with the editor.

---

## 6. Visual resolution (labels, URLs, layout)

- **Module:** `domain/presentation/map/resolvePlacedObjectCellVisual.ts`
- **`resolvePlacedObjectCellVisualFromRenderItem`:** maps render item + optional **`PlacedObjectGeometryLayoutContext`** (built via `buildPlacedObjectGeometryLayoutContextFromAuthoring` / `buildPlacedObjectGeometryLayoutContextFromEncounter` in `shared/domain/locations/map/placedObjectGeometryLayoutContext.ts`; same shape as legacy **`PlacedObjectCellVisualFootprintLayoutContext`**) → **`PlacedObjectCellVisual`** (raster URL, footprint size in px, **anchor offsets** for square placement).
- **Footprint math:** `shared/domain/locations/map/placedObjectFootprintLayout.ts`, `placedObjectPlacementAnchorLayout.ts`; **authoring `cellUnit`:** `resolveAuthoringCellUnitFeetPerCell` (`locationCellUnitAuthoring`).
- **Display:** `PlacedObjectCellVisualDisplay.tsx` — `<img>` with **`object-fit: contain`** (`placedObjectMapSprite.constants.ts`).
- **Geometry tests:** `domain/presentation/map/__tests__/resolvePlacedObjectCellVisual.geometry.test.ts` locks layout/anchor outputs for representative registry variants (large rect, circle, long rect).

### Multi-cell footprint layout and interaction risks

Registry **footprint** (feet) maps to a pixel layout box via **`computePlacedObjectFootprintMaxExtentPx`** + **`resolvePlacedObjectFootprintLayoutPx`**. The **major axis** (max of width/depth for rects, diameter for circles) in “cells” is `majorFt / feetPerCell`; the allowed **`maxExtentPx`** grows with that span (up to **`PLACED_OBJECT_FOOTPRINT_MAX_EXTENT_CELLS`**, e.g. 6 cells) so wide objects are not forced into a single **`cellPx`** square.

**Risks (documented for contributors and future hit-testing work):**

- **DOM / ownership:** Rasters still mount under the **anchor** cell’s overlay. Visual overflow into **neighbors** is expected; there is no separate DOM node per covered cell.
- **Pointer / selection:** Select mode and **`[data-map-object-id]`** targets are **not** a full multi-cell hit mesh. Clicks on the **neighbor** cell may not select the object whose art overlaps that cell; conversely, transparent padding around the image can still affect hit targets depending on wrapper **`pointer-events`**.
- **Stacking:** Z-order follows **cell render order**; large sprites can paint **over** adjacent terrain, paths, or icons in ways that feel arbitrary without a dedicated multi-cell layer policy.
- **Combat:** Same resolver path; large sprites may crowd **tokens** or adjacent underlays.
- **Sprite fit:** **`object-fit: contain`** still letterboxes art inside the layout box if PNG aspect ≠ footprint aspect — a large box does not guarantee a large painted sprite.

**Surface vs resolver:** Workspace and encounter may differ in **overflow**, **clipping**, and **z-index** around the leaf; **layout width/height and anchor offsets** come only from the resolver + geometry context. Drift in painted pixels with the same context is a shell or asset issue, not footprint math.

---

## 7. Where it renders

| Context | Components / notes |
|---------|-------------------|
| **Map editor (cells)** | `LocationMapCellAuthoringOverlay` inside `GridEditor` / `HexGridEditor` (`renderCellContent`); `LocationGridAuthoringSection` passes **`gridCellUnit`**, **`squareCellPx`** for footprint context. |
| **Place preview** | Synthetic render item from `buildPlacePreviewRenderItem` when hovering in place mode. |
| **Combat (tactical)** | `CombatGrid` → `LocationMapAuthoredObjectIconsCellInline`; **`footprintLayout`** with **`applyPlacementAnchor: false`** for cell-centered tactical presentation. |
| **Layer order (editor)** | Cell fill → paths → edges (SVG under grid) → **cell rasters** above grid — see [`location-workspace.md`](./location-workspace.md) (authored base-map layer order). |

**Select mode hit-testing:** `[data-map-object-id]` on object wrappers; resolver priority in `domain/authoring/editor/selectMode/` (see workspace doc).

---

## 8. Combat runtime (not the same as authored overlay)

- **Encounter `GridObject`** rows may carry **`authoredPlaceKindId`** for hydration; **token** visuals vs **placed-object** underlay are **not** the same system — see [`combat/client/grid.md`](../combat/client/grid.md). **Presentation** for a kind can still align via **`resolvePlacedObjectCellVisualFromPlacedKind`** where applicable.

---

## 9. Related code index (quick)

| Area | Path |
|------|------|
| Registry | `domain/model/placedObjects/locationPlacedObject.registry.ts` |
| Selectors / persistence | `domain/model/placedObjects/locationPlacedObject.selectors*.ts`, `locationPlacedObject.persistence.ts` |
| Placement resolver | `domain/authoring/editor/placement/placementRegistryResolver.ts` |
| Render items | `shared/domain/locations/map/locationMapAuthoredObjectRender.helpers.ts` |
| Resolve visual | `domain/presentation/map/resolvePlacedObjectCellVisual.ts`, `PlacedObjectCellVisualDisplay.tsx` |
| Geometry context (factories) | `shared/domain/locations/map/placedObjectGeometryLayoutContext.ts` |
| Combat feet from `grid.cellUnit` | `shared/domain/locations/map/locationCellUnitCombat.ts` |
| Authoring vs combat feet parity tests | `shared/domain/locations/map/__tests__/locationCellUnitCombat.parity.test.ts` |
| Resolver geometry tests | `domain/presentation/map/__tests__/resolvePlacedObjectCellVisual.geometry.test.ts` |
| Editor overlay | `components/mapGrid/LocationMapCellAuthoringOverlay.tsx` |
| Combat inline icons | `components/mapGrid/LocationMapAuthoredObjectIconsLayer.tsx` |
