---
name: Sprite placed objects migration
overview: A phased migration from MUI glyph–based map objects to a generated asset pipeline, with stable authored definitions keyed by `assetId`, explicit separation among manifest generation, registry, resolution, placement, rendering, and tactical runtime, and no `iconName` in the placed-object model—toolbar previews and in-map cell objects use image assets; edge objects keep vector map rendering while using image previews in the tray.
todos:
  - id: phase-1-pipeline
    content: "Phase 1: Asset pipeline + manifest contracts (map + preview, validation)"
    status: pending
  - id: phase-2-renderer
    content: "Phase 2: Tray previews + in-map sprites; remove iconName; edge stays vector"
    status: pending
  - id: phase-3-dimensions
    content: "Phase 3: Registry footprint (feet) + cellUnit→world-span resolver + square-grid layout; minimal anchors"
    status: pending
  - id: phase-4-table-pilot
    content: "Phase 4: Table family end-to-end pilot (assetId + footprint + rendering)"
    status: pending
  - id: phase-5-anchors
    content: "Phase 5: Anchoring / elongated placement refinement"
    status: pending
  - id: phase-6-migrate
    content: "Phase 6: Broader family migration"
    status: pending
  - id: phase-7-polish
    content: "Phase 7: Atlas/perf/CI/docs hardening"
    status: pending
isProject: false
---

# Placed objects: icon to sprite migration (architecture plan)

## Migration strategy (overview)

The codebase today treats placed objects as **registry-defined families and variants** with **MUI `iconName` presentation** ([`locationPlacedObject.registry.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts)), while the persisted map model stays sparse: cell objects carry `kind`, optional `authoredPlaceKindId`, etc., and the editor derives flat render items via [`deriveLocationMapAuthoredObjectRenderItems`](shared/domain/locations/map/locationMapAuthoredObjectRender.helpers.ts) ([`location-workspace` reference](docs/reference/locations/location-workspace.md)). The migration should **not** replace that separation with a monolithic “sprite pass.” Instead:

1. **Stand up asset pipeline outputs first** (manifest(s) generated from source PNGs, including trim), so runtime code consumes **stable logical ids**, not hand-edited frame rectangles—covering both **map** and **toolbar preview** roles per contract.
2. **Integrate the editor in one pass:** remove **`iconName`** from the placed-object model; drive **tray previews** from preview assets; render **cell** objects with **map** sprites; keep **edge** objects on **vector** map rendering—**no** MUI icon fallback for placed objects.
3. **Introduce canonical physical dimensions and placement semantics** as **variant-level registry data** in **feet**, with a **`cellUnit` → feet-per-cell** resolver and **square-grid** layout derivation (Phase 3), including **rectangular** (width/depth) and **circular** (diameter) footprints plus a **minimal default anchor model** for pilot use—**not** “percent of cell” as canonical sizing.
4. **Pilot one family end-to-end** (recommended: **table**) to validate dimension → placement → sprite alignment before scaling migration.
5. **Refine placement/anchoring** for elongated footprints (e.g., spanning a shared edge between cells) once a real asset proves the need—**avoid** speculative multi-cell collision expansion early.
6. **Migrate additional families** family-by-family, reusing the same seams.
7. **Harden tooling and performance** (atlas packing, cache behavior, CI checks) after semantics are stable.

This sequencing keeps **authored map documents** stable where possible, minimizes blast radius, and removes **glyph-based placed-object presentation** early in favor of **explicit assets and validation**.

### Current asset inventory ([`assets/system/locations/objects/`](assets/system/locations/objects))

**All required source PNGs for the Phase 1–2 placed-object pipeline are present in-repo** (naming is kebab-case on disk; **`assetId` / manifest mapping** normalizes to the stable ids in the registry). Pipeline and Phase 2 integration are **not blocked** on art delivery—work is **manifest + mapping + wiring**, not sourcing files.

**Files (11):** `door-double-wood.png`, `door-single-wood.png`, `stairs-spiral.png`, `stairs-straight.png`, `table-rect-wood-10x4.png`, `table-rect-wood-5x3.png`, `treasure-chest.png`, `window-bars.png`, `window-glass.png`, `window-shutters.png`, `window-stained-glass.png`.

---

## Recommended separation of responsibilities

| Concern | Owns | Consumes | Must not own |
|--------|------|----------|----------------|
| **Generated sprite manifest / atlas metadata** | Build-time artifacts: logical `assetId` → texture URL or atlas region, **trimmed bounds** relative to asset logical frame, optional per-frame `sourceSize` / padding for NineSlice later. Version/hash for cache busting. | Raw PNG inputs; trim algorithm output | Gameplay rules, cell placement rules, or registry labels |
| **Object registry definitions** ([`AUTHORED_PLACED_OBJECT_DEFINITIONS`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts)) | Family/variant **identity**, palette copy, **optional** `assetId` (or family default + variant override), **physical footprint** in **feet** (Phase 3), **placement mode** (`cell` \| `edge`), **runtime defaults** (`blocksMovement`, LoS, cover, …) | Manifest existence for referenced ids (validated in CI or dev) | Pixel layout math, atlas coordinates, image file paths as canonical source of truth |
| **Render asset resolution** | Given `(familyId, variantId)` (+ optional future wire fields), resolve **map** vs **preview** image descriptors from manifest(s); **no** glyph fallback in the placed-object path. Pure, testable module at the boundary of shared domain ↔ assets. | Manifest, registry | Grid scale, screen DPI beyond “px per world unit” contract |
| **Footprint / dimension resolution** | Map **grid** `cellUnit` (via **authoring** feet-per-cell resolver) + registry footprint (**feet**) → **layout-space** rect on **square** grids (and later multi-cell / tactical projection where explicitly designed). | Shared location map types, dimension types | Sprite pixel dimensions as canonical length (pixels follow from asset + scale) |
| **Placement / anchor logic** | Map authored anchor (cell id, edge id, optional anchor mode) → **where the object’s origin sits in grid space** and how multi-length objects span cells. | Footprint resolution, geometry helpers ([square grid overlay](docs/reference/locations/location-workspace.md)) | Texture packing, presentation glyphs |
| **Rendering logic** | Draw sprites (DOM/CSS or canvas/WebGL later) using **resolved layout rect** from placement + footprint; stack order per [layering rules](docs/reference/locations/location-workspace.md). | ResolvedRenderAsset, layout | Combat adjudication |
| **Runtime behavior** (movement blocking, LoS, cover) | **Hydration** from registry defaults; optional per-instance overrides later. | Registry runtime fields, combat grid | Sprite bounds as collision unless explicitly modeled |

**Authoritative rule:** **Physical dimensions are canonical for sizing**; **pixels are derived** from (asset intrinsic size or manifest intrinsic size) × (world scale from grid) × (optional uniform render scale policy). Reject **cell percentage** as the **canonical** footprint source; it may exist only as a **derived display hint** if ever needed for legacy UI.

---

## Do not couple these concerns

Collapsing the following into one change set is the primary failure mode:

- **Sprite import/pipeline work** with **footprint/anchor redesign** and **full registry migration**: creates unreviewable diffs and blocks rollback.
- **Atlas generation** with **persistence/wire format** changes: wire should reference **logical asset ids**, not texture coordinates.
- **Rendering** with **tactical rules** expansion (multi-cell occupancy): combat and AI cost balloons; keep **runtime defaults** stable until placement semantics require richer blocking.
- **Trim metadata hand-authoring** as a **gating dependency**: prefer **generated** trim rects; manual overrides only for exceptional pipeline bugs.

---

## Pilot family recommendation: `table`

**Why table first**

- **Footprint diversity:** A 5×3 ft rectangle vs 1×1 ft chest is exactly the **dimension/anchor** problem you need to validate; the existing [`table`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts) family already has multiple shape variants (`rect_wood`, `circle_wood`) and **non-blocking** runtime (`blocksMovement: false`), reducing pressure to solve multi-cell combat occupancy in phase 1.
- **Art velocity:** Furniture sprites churn often; the **`assetId` indirection** and manifest regeneration prove their worth here before touching high-stakes props.
- **Source art is in-repo:** See **Current asset inventory** above—e.g. [`table-rect-wood-5x3.png`](assets/system/locations/objects/table-rect-wood-5x3.png) and related variants for end-to-end pipeline and editor integration without waiting on art drops.
- **Scope control:** Edge-placed families (doors/windows) add **boundary geometry** complexity; defer until **cell-anchored** sprite pipeline is proven.

---

## Phase 1 — Asset pipeline and manifest contracts

**Goal:** Establish a **generated asset pipeline** whose outputs are the **single contract** for how the app resolves **stable logical ids** (`assetId`) to **image files** and **generated frame metadata**—for both **in-map** raster assets (cell-placed objects) and **workspace toolbar preview** assets—without dictating **how** the map or tray render them in React.

**Scope:** Build-time tooling (script, bundler plugin, or `packages/*` pipeline) that ingests source PNGs from [`assets/system/locations/objects/`](assets/system/locations/objects) (full set **present**; see **Current asset inventory**), emits **one or more versioned JSON manifests**, and prefers **algorithmic** metadata (e.g. transparent-boundary trim, intrinsic size) over hand-maintained per-asset trim tables. If Option A/B later splits **preview** vs **map** files, those can still be generated from the same sources or symlinks—**no** separate art wait for Phase 1. **Map rendering behavior, layout, and footprint math are out of scope** for this phase.

**What changes in this phase**

- **Contract:** Define **`assetId`** naming and stability rules (stable across art swaps; not raw atlas x/y in authored definitions).
- **Phase 1 deliverable — choose and document one manifest strategy** (this decision is **binding** for Phase 2 integration and validation):
  - **Option A — Single manifest:** One generated JSON where each logical asset entry supports **optional** `map` / `preview` payloads (e.g. one row per `assetId` with optional fields `mapAsset` and `previewAsset`, each pointing at file + generated trim; or equivalent single-file shape). Edge-only variants may omit `mapAsset` and supply `previewAsset` only.
  - **Option B — Two related manifests:** Two generated files (e.g. `*-map.manifest.json`, `*-preview.manifest.json`) with a **single shared `assetId` namespace** across both—entries keyed by the same ids; validation cross-checks that registry references resolve in the correct file(s).
  - **Output of Phase 1:** A short **ADR or pipeline README** stating **A or B**, the **exact JSON shape**, and how **validation** applies (what must exist for cell vs edge variants). Phase 2 implements **one** resolver module aligned to that choice—**no** “support both shapes” in application code.
- **Generated metadata:** Trim rects, intrinsic dimensions, content hash or build id—**generated by the pipeline**; manual `trimPx` only as **exception** for pipeline bugs, not the default workflow.
- **Coverage for all variants:** Pipeline and contract must account for **every** registry variant that will reference assets—including **`placementMode: 'edge'`** (doors, windows): they need **preview** manifest entries even though **in-map** representation remains vector for now (phase 1 may still emit a **preview-only** asset id or omit **map** entries for edge families if the manifest schema distinguishes roles).
- **Early validation:** Rules for **fail vs warn**: e.g. CI or `prebuild` **fails** when a registry row references an `assetId` missing from manifest; **dev-time** clear message listing missing ids. Optional: **placeholder asset** (neutral “missing” PNG) **generated or committed once** and referenced only when validation mode allows—**not** MUI icons.

**What explicitly does NOT change yet**

- **No** removal of `iconName` from TypeScript yet (that is Phase 2)—Phase 1 delivers **artifacts and contracts** the app will switch to.
- **No** map rendering implementation, **no** toolbar UI swap, **no** world-unit footprint or placement semantics (later phases).
- **No** redesign of edge **map** geometry (walls/doors/windows as strokes on boundaries).

**Key decisions to lock in**

- **Manifest is generated truth** for “what file and what trim belongs to this `assetId`”; registry holds **`assetId` references**, not coordinates.
- **Single manifest strategy (A vs B)** is **decided and documented** before Phase 2 starts—drives resolver APIs, CI checks (“every preview id in manifest,” “every map id,” cross-manifest consistency if split), and whether registry rows carry one compound id or separate `mapAssetId` / `previewAssetId` fields.
- **Missing assets:** Validation policy is **explicit** (fail build vs placeholder)—**not** silent fallback to glyphs.

**Risks / watchouts**

- **Scope creep:** Implementing tray or map components “just to test” belongs in Phase 2; Phase 1 proves **deterministic outputs + validation** only.
- **Edge variants:** Ensure preview contract does not assume **map** sprite exists for edge families—schema must allow **preview-only** rows without implying raster map rendering exists.

**Exit criteria**

- **Committed choice:** **Option A** (one manifest, optional `map` / `preview` per entry or per variant slot) **or** **Option B** (two manifests, shared `assetId` namespace)—documented with example JSON and validation rules.
- Build produces **deterministic** output matching that choice: **stable `assetId` → file URL/path + generated trim/intrinsic fields** where applicable.
- **Validation** exists for **missing** referenced ids, **scoped to the chosen strategy** (e.g. Option B: fail if preview manifest lacks a tray-required id; Option A: fail if `previewAsset` missing where required).
- **All object variants** (including edge) have a **defined preview asset** in contract; **cell** objects have **map** asset entries where rollout requires them.
- Documentation of **assetId** rules and **manifest shape** sufficient for Phase 2 consumers—**no** requirement for authors to hand-edit trim metadata for normal assets.

---

## Phase 2 — Application and editor integration (tray + map; remove `iconName`)

**Goal:** **Remove `iconName` from the placed-object registry/model and from editor integration**; drive **workspace place-palette / toolbar tray** previews exclusively from **preview image assets**; begin **sprite-backed in-map rendering** for **`placementMode: 'cell'`** objects while leaving **`placementMode: 'edge'`** objects on **existing vector line / edge geometry** for map display. **No MUI icon fallback** for missing raster or preview assets.

**Scope:** Registry type and row updates (`AuthoredPlacedObjectVariantDefinition` and consumers), **place tray** (`LocationMapEditorPlaceTray` and related palette helpers), any selectors that expose **icon** for UI, and **authored object overlay** rendering for **cell** objects. Shared resolution helpers that read Phase 1 manifest(s) to obtain image URLs (and layout hints from trim metadata where needed). **Explicit** missing-asset behavior everywhere icons were used before.

**What changes in this phase**

- **`iconName` removed from TypeScript in this phase** (Phase 1 intentionally leaves it in place). Removal must be **complete** in the placed-object surface area—**no** dead `iconName?` fields kept “for compatibility.” Concretely:
  - **Registry definitions:** Delete **`iconName`** from `AuthoredPlacedObjectVariantDefinition` (and family rows); replace with ids aligned to Phase 1 (**`assetId`**, or **`mapAssetId` / `previewAssetId`** per Option A/B).
  - **Derived editor / render props:** Remove **`iconName`** from any **derived** shapes passed into grid overlays, selection rail, or object render helpers (e.g. anything that extended render items with `iconName` for UI). Props should carry **resolved preview/map asset descriptors** or **stable ids** for resolution—not optional legacy icon strings.
  - **Toolbar / place-tray preview consumers:** **`LocationMapEditorPlaceTray`** and palette helpers read **preview assets** only; **no** glyph props threading through the tray.
  - **Edge map rendering stays independent:** Removing **`iconName`** does **not** change how **edge** features are drawn on the map (still vector/segment geometry). Edge code paths must **not** depend on `iconName` for strokes; they already use edge geometry—this phase only ensures **no remaining icon fields** on edge variant definitions used for **map** drawing.

- **Toolbar / workspace tray:** Preview thumbnails use **`<img>` (or equivalent) from resolved preview asset**. All variants with a tray row—including **door** and **window**—use **image-based previews** per Phase 1 coverage.
- **In-map rendering (cell objects):** **`placementMode: 'cell'`** objects render using **map** sprite assets resolved per Phase 1 manifest + registry. Interim layout may remain **cell-centered / scale-to-fit** until Phase 3+ footprint work—**without** introducing footprint types in this phase.
- **In-map rendering (edge objects):** **Unchanged** vector/stroke presentation on boundaries; **no** raster sprite layer for doors/windows on the map in this phase.
- **Removal sweep:** Eliminate any remaining **`iconName`** references in palette builders, inspectors, and `getDefaultVariantPresentationForKind`-style paths. **No** “if sprite missing, show icon” branch.

**What explicitly does NOT change yet**

- **World-unit dimensions / canonical footprint** (Phase 3+).
- **Edge map rendering redesign** (still stroke/geometry-only); no new edge sprite overlay.
- **Persisted map wire format**—unless a minimal additive field is strictly required for asset resolution (prefer avoiding; resolve from registry + variant mapping as today).

**Key decisions to lock in**

- **Preview imagery vs in-map rendering are separate concerns:** tray resolves **preview** manifest entries; map resolves **map** entries; edge objects participate only in **preview** for Phase 2 map display (map drawing unchanged).
- **Missing preview or map asset:** Prefer **build/dev validation** so the issue is caught before ship; at runtime, use a **single explicit placeholder** (neutral image, broken-image styling, or labeled “Missing asset” chip)—**not** legacy icons. Product decision: **fail fast in dev** vs **soft placeholder in prod**.
- **`iconName` is fully removed** from registry types, derived render props, and tray consumers in one phase—**no** optional `iconName?` left as dead baggage; edge **map** behavior does not depend on icons.

**Risks / watchouts**

- **Tray layout:** Preview images vary aspect ratio; tray CSS may need **consistent box + object-fit** (presentation concern, not asset pipeline).
- **Select mode / hit targets:** Cell object overlay swap to `img` or background-image must preserve **`[data-map-object-id]`** and hit-testing behavior ([location-workspace](docs/reference/locations/location-workspace.md)).
- **Combat underlay:** If it shares render items with the editor, align whether combat map shows sprites in the same phase or follows immediately—scope explicitly so one path does not silently keep icons.

**Exit criteria**

- **`iconName` absent** from: **registry variant definitions**, **derived editor/render item props**, and **toolbar preview code paths** (grep-clean for placed-object `iconName` in these surfaces).
- **No** `iconName` on **`AuthoredPlacedObjectVariantDefinition`** (or equivalent); **no** remaining placed-object code paths that render MUI glyphs for **palette or cell-object map** display.
- **Place tray** shows **preview images** for all families/variants in the palette, **including edge** objects.
- **Cell** objects render **sprites in-map** when manifest + registry resolve; **edge** objects still render as **vector** on the map, **without** using `iconName` for that geometry.
- **Missing asset** behavior is **explicit** (validation + agreed placeholder)—**zero** icon fallback.

---

### Note: why Phase 2 bundles tray migration with early map sprites

**Toolbar preview migration belongs in Phase 2** because removing **`iconName`** from the registry **breaks** the current tray implementation that derives previews from glyph names. Rebuilding the tray on **preview images** is **the same integration pass** as stripping `iconName`; deferring tray work would force an intermediate state (keeping icons for tray only) that contradicts the goal of **eliminating `iconName` from the model early**. Phase 2 therefore applies **one** editor integration sweep: **preview assets + map sprites for cell objects + registry cleanup**.

**Edge-object preview assets should not wait on edge map rendering redesign.** Edge families need **tray previews** as soon as `iconName` is removed; those previews are **orthogonal** to whether doors/windows are drawn as **vectors or sprites on the map**. Shipping **image-based previews** for doors/windows in Phase 2 does not commit to **raster edge overlays** later—only to **consistent palette UX** while map geometry stays stroke-based.

---

## Phase 3 — Canonical object dimensions and placement semantics (feet + square grid)

**Goal:** **Variant-level physical footprint** becomes **canonical** on the registry, expressed in a **single named world length unit** (**feet**) and decoupled from **cell percentage**, **raw pixels**, and ad hoc “scale to fit cell” layout. **Layout rects** derive from **canonical footprint + grid configuration** through **one conversion path**, so sizing stays coherent when **viewport zoom** or **cell pixel size** changes. Phase 3 establishes the **footprint and layout contract**; it does **not** finalize **sprite/art fit policy** (Phase 4) or **rich anchoring** (Phase 5).

**Scope:** Extend **registry types** (not necessarily every family) with **variant-level footprint** and a **minimal typed anchor model** sufficient for the **table** pilot on **square** grids only.

- **Rectangular** footprints: **width** and **depth** in **feet** (semantic axes; map to layout consistently—e.g. width along one grid axis for the pilot).
- **Circular** footprints: **diameter** in **feet**.
- **Minimal anchors:** Only what the pilot needs—e.g. default **cell-centered** placement for cell-anchored objects—expressed as **types + defaults**, not a full placement UX overhaul. **Between-cell**, **edge-offset**, and **elongated** alignment semantics stay **out of scope** (Phase 5).

**Authoring cell span (new contract):** Introduce **one authoritative resolver** used by footprint → layout math: **`grid.cellUnit` → numeric world span per cell** (in **feet**) for **authoring/layout**. Today `cellUnit` is a flexible label (`5ft`, `25ft`, `100ft`, `mile`, …) and the editor sizes the **grid from viewport** (`cellPx`); combat uses a **narrow** mapping for encounter grids only and is **not** assumed to be the general authoring rule. Phase 3 **defines** the layout-time rule: a **single module** (or equivalent) that answers “how many **feet** does one **cell edge** represent for **this** map’s `cellUnit`?” so footprint (feet) can be converted to **fractions of a cell** and then to **pixels** via existing **cellPx**. Maps or scales where **meaningful** object footprints are **not** supported yet should be handled with an **explicit** policy (e.g. **degraded** sizing, **warn**, or **out-of-scope** for the pilot)—not silent misuse of combat-only helpers.

**Persisted map shape stays as-is** unless a **later** phase requires **instance-level** orientation or anchor overrides on the wire; Phase 3 does not require those persistence changes.

**What changes in this phase**

- Registry schema: **footprint** (rect vs circle + **feet** numbers) and **minimal anchor** fields/defaults for the pilot.
- **Single funnel:** **Footprint (feet)** + **`cellUnit` → feet per cell** + **square grid geometry** + **`cellPx`** → **derived layout rect** in pixel space (names may vary; **one** pipeline, not scattered formulas).
- **Consumers** (e.g. cell-object overlay) use **derived rect** for **layout sizing** instead of **fill-cell** or **% of cell** as the source of truth.
- **Documentation follow-up:** Update [`location-workspace.md`](docs/reference/locations/location-workspace.md) (and pointers from it) so contributors do **not** assume **scale-to-fit cell** remains the long-term rule once Phase 3 lands.

**What explicitly does NOT change yet**

- **Wire format / persistence:** No required new fields on placed-object instances for footprint or anchors beyond what already exists.
- **Multi-cell tactical occupancy**, **collision grids**, or **LoS** derived from sprite or layout extent.
- **Tactical** blocking/LoS/cover: still **registry defaults** and existing combat/adjacency models; Phase 3 does **not** redefine them from visuals.
- **Selection / hit-testing product semantics:** Phase 3 may keep **minimal** compatibility (e.g. existing DOM hooks) but does **not** establish **final** hit regions from sprite bounds—avoid treating **layout rect** as the **ultimate** interactive or tactical footprint.
- **Hex grids:** No commitment to **hex footprint** or **hex layout** parity; authored object footprint math is **square-first** until a later phase explicitly designs hex.
- **Edge families:** No advanced **edge** footprint or anchor behavior beyond whatever **pilot** table work requires for shared types; **stroke/vector** edge map rendering remains as in prior phases.
- **Cell percentage** as **canonical** footprint (forbidden); **optional derived** UI hints only, if ever.

**Key decisions to lock in**

- **Canonical authored unit:** Registry footprints use **feet** only for Phase 3; do **not** mix meters or unnamed “world units” in authored data.
- **`cellUnit` → feet per cell (authoring):** **One** resolver for layout authoring; **document** its behavior for each supported `cellUnit` (and explicit gaps for unsupported combinations). **Do not** generalize combat’s **5/10 ft** encounter shortcut as the **default** authoring rule without stating so.
- **Square grid only** for Phase 3 footprint → layout resolution: **square** cell geometry and existing **square** overlay helpers; **hex** remains explicitly **out of scope** for this contract.
- **Authoring stability:** Footprint dimensions live on **registry variants**, not duplicated per instance on the map.
- **Shapes:** Rect = **width/depth**; circle = **diameter**—**semantic** registry fields, not **inferred from art pixels** as the source of truth.
- **Phase boundary — Phase 4:** Phase 3 owns **data model + `cellUnit` resolution + derived layout math**. Phase 4 owns **asset/render policy**, **sprite fit** (letterbox vs stretch, uniform scale rules), **manifest-aligned** table rollout, and **polished** end-to-end **table** presentation. Phase 3 may use **simple** scaling into the derived rect so **size differentiation** is visible; **final** art policy lives in Phase 4.
- **Phase boundary — Phase 5:** Phase 3 allows only **minimal** **default** anchors (e.g. cell-centered). Phase 5 owns **richer** anchor modes, **elongated** placement, **between-cell** alignment, and related **preview/ghost** behavior—without expanding Phase 3.

**Risks / watchouts**

- **Semantic footprint vs derived AABB:** Keep the **authoritative** registry shape (rect vs circle + **feet**) separate from any **derived** axis-aligned box used for **layout**—especially **circles**, where a square **layout** box is a **consequence**, not the canonical definition.
- **No cell percentage as canonical:** Do not reintroduce **“% of cell”** as the **source of truth** for footprint.
- **Visual vs tactical vs interaction:** Do **not** imply that **layout** or **sprite** extent defines **tactical occupancy**, **LoS**, or **final** **selection** hit areas; Phase 3 is **layout contract + pilot sizing**, not combat or input **finalization**.
- **Large `cellUnit` vs small objects:** **Mile**-scale cells vs **5 ft** furniture may need an **explicit** product/engineering stance (e.g. pilot **encounter/floor** maps only, or defined **degradation**) so the resolver is not **misapplied**.
- **Documentation drift:** Without updating **location-workspace** (and related references), implementers may revert to **scale-to-fit cell** mentally; track doc updates as part of exit.

**Exit criteria**

- **Table** variants declare **distinct** footprints in **feet** (e.g. different rect sizes vs round **diameter**) and show **size-differentiated** **layout** on the **same** square grid **without** changing **authoring** `cellUnit` semantics—using the **single** **footprint → layout** pipeline.
- **`cellUnit` → feet per cell** for authoring is implemented in **one** place and **documented** (including what is **unsupported** or **degraded** for the pilot).
- Conversion from footprint to **layout rect** does **not** duplicate ad hoc **cellUnit** math across components.
- **Hex** is not claimed to be supported for this footprint pipeline; **square** behavior is **explicit** in docs for Phase 3.
- **`location-workspace.md`** (or a clearly linked subsection) reflects that **footprint in feet + resolver** replaces **scale-to-fit cell** as the **directional** contract for placed-object **layout** (exact wording can be brief).

---

### Phase 3 clarification (boundary summary)

- **Canonical authored footprint unit:** **Feet** on registry variants (width/depth/diameter as applicable)—not vague “world units” and not mixed units.
- **Single `cellUnit` → numeric world span per cell resolver:** **Required** for authoring/layout: maps **`LocationMap.grid.cellUnit`** to **feet per cell** (or explicit **unsupported** behavior), separate from combat-only shortcuts unless deliberately aligned and documented.
- **Square grid only** for Phase 3 footprint/layout resolution; **hex** expansion is a **later** explicit phase, not an implied deliverable here.
- **Contracts:** Phase 3 establishes **footprint + layout derivation**; **Phase 4** owns **sprite/art fit**, **manifest integration**, and **polished table** rollout; **Phase 5** owns **richer anchors** and **advanced** placement semantics.

---

## Phase 4 — First real pilot family: size-aware sprite rendering

**Goal:** **`table`** uses **`assetId`** + **footprint (feet, Phase 3)** + **manifest** end-to-end; art swaps **do not** require registry edits except when **semantic** identity changes. Builds on Phase 3’s layout contract with **sprite fit** and **polished** presentation.

**Scope:** Wire registry variants to `assetId`s produced in phase 1; align **sprite aspect** with footprint policy (fit vs crop rules); **no** glyph fallback—missing art follows the same **validation / placeholder** policy as Phase 2.

**What changes:** `table` family registry rows; asset files; renderer branch for **table** using combined resolver (phase 2 + 3). Add **content** test: manifest + registry cross-reference.

**What does not change yet:** Other families beyond minimal shared infrastructure; combat **blocking** semantics remain **registry defaults** (tables stay non-blocking unless design changes).

**Key decisions to lock in**

- **Naming:** `assetId` is the **only** coupling between art and code—**not** filenames in React.
- **Variant granularity:** new **10×3 ft** table is a **new variant** with its own `assetId` + footprint, not a stretched 5×3 asset.

**Risks / watchouts:** **Stretch vs letterbox** policy must be explicit to avoid “rubber tables.” Document for artists.

**Exit criteria:** **Table** variants render correctly sized sprites on floor maps, survive **cell size** / zoom changes gracefully, and pass **selection/hit-testing** with stable DOM ids.

---

## Phase 5 — Placement model refinement for larger / anchored objects

**Goal:** **Placement semantics** catch up to **visual truth** for elongated objects—e.g., **centering across a shared cell boundary** or **offset along an edge**—without prematurely implementing full **multi-tile** combat occupancy.

**Scope:** Introduce **placement anchor modes** at **authoring** level (may remain **editor-only** computed fields at first, or minimal wire extension if required). Geometry uses existing **square** helpers ([`squareGridOverlayGeometry`](docs/reference/locations/location-workspace.md)); hex stays **explicitly constrained** (reuse [open issues](docs/reference/locations/location-workspace.md) discipline—no accidental hex promises).

**What changes:** Placement resolver for **cell** mode clicks, preview ghosts, and **render translation** from anchor + footprint. Optional **persistence** only if editor cannot reconstruct intent from footprint + rules.

**What does not change yet:** **Combat movement map** multi-cell blocking for large objects; **LoS grid** refinement—unless a clear product blocker appears, treat as **follow-on**.

**Key decisions to lock in**

- **Anchor semantics are part of the placement domain**, not the sprite manifest.
- **Separation:** **visual overhang** may extend into neighboring cells **without** claiming tactical occupancy.

**Risks / watchouts:** Confusing **visual overlap** with **interactive hit area**; document and test Select-mode priority ([`resolveSelectModeInteractiveTarget`](docs/reference/locations/location-workspace.md)).

**Exit criteria:** Large table can be **authored** and **rendered** aligned to intended edge/between-cell anchor; **combat** behavior unchanged unless explicitly updated later.

---

## Phase 6 — Broader migration of additional object families

**Goal:** Repeat the **proven pattern** across **furniture**, **props**, **vegetation**, **structures**, prioritizing **high-visibility floor** content; **linked** markers (`city`, `site`) may stay icon-first longer.

**Scope:** Family-by-family registry `assetId` + footprint rollout; manifest expansion; renderer defaults per category (uniform **render scale** policy if needed).

**What changes:** Registry batches; asset drops; potential **palette** preview thumbnails updated to sprites where UX benefits.

**What does not change yet:** **Edge** door/window full migration until **edge anchoring** and **stroke** visuals are spec’d (may trail cell-anchored families).

**Key decisions to lock in**

- **Migration order** is **risk-ranked**, not alphabetical—ship **user-visible** props before rare markers.
- **Fallback policy** remains until **100%** asset coverage for a family.

**Risks / watchouts:** **Inconsistent art aspect ratios** across families; keep **category-level render policy** to limit one-off JSX.

**Exit criteria:** Agreed **family set** complete with sprites + footprints; icons only where **explicitly** allowed as permanent design (if any).

---

## Phase 7 — Polish, optimization, and workflow hardening

**Goal:** Production-grade **performance**, **developer ergonomics**, and **quality gates** for ongoing art iteration.

**Scope:** Optional **texture atlas** to reduce HTTP/WebGL texture binds; **caching** and **content-hash** URLs; **lint/CI** for broken `assetId`s; **visual regression** snapshots for a few canonical maps; documentation updates ([`location-workspace.md`](docs/reference/locations/location-workspace.md)) **only as needed** for contributor clarity.

**What changes:** Build perf, runtime perf, CI rules; possibly **combat underlay** parity if not already unified.

**What does not change:** **Core seams** from phases 1–3—avoid architectural churn here.

**Key decisions to lock in**

- **Atlas is an optimization**, not a semantic requirement; single-file workflow must remain viable for small teams.

**Risks / watchouts:** Premature **GPU** migration; only if profiling demands.

**Exit criteria:** Stable **CI green** on asset pipeline; acceptable **LCP** for map editor on reference content; **onboarding path** for artists documented (naming, export settings, transparency).

---

## Open questions (intentionally deferred)

- **Wire format:** whether **variant id** should eventually persist on the map (today [phase 2 object authoring](docs/reference/locations/location-workspace.md) maps intent through `authoredPlaceKindId` / kind)—sprite work should **not force** this decision early.
- **Rotation:** per-instance **facing** or degrees—needs **persistence** and **placement** design together; defer until anchor model stabilizes.
- **Hex parity:** authored object **footprints** on hex—likely different anchoring; keep **square-first** until product prioritizes.
- **Combat occupancy vs visual footprint:** when/if **multi-cell blocking** must match **sprite extent**—separate policy decision from rendering.
- **Atlas format:** TexturePacker JSON vs custom—defer until optimization phase proves need.
- **Nine-slice / animated sprites:** keep manifest **extensible** but do **not** block phase 1–4.
