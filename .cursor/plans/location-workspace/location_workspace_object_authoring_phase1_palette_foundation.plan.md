---
name: Object authoring Phase 1 — palette foundation
overview: Palette foundation plus a durable family-oriented placed object registry in locationPlacedObject.registry.ts — registry category is UI palette grouping only (structure, furniture, vegetation, …); interaction/behavior is a separate family-level prop; linking/reference is future rail-authored config, not a category. Selectors, placementRegistryResolver, toolbar palette, activePlace, inventory gate, docs. No Phase 2 variant picker UX; no full right-rail linking implementation.
todos:
  - id: audit-current-object-tool
    content: Complete full placeables inventory (objects + linked-content, per plan columns) before implementation; trace rail, route/model, placement, persistence, selection
    status: pending
  - id: define-registry-foundation
    content: Replace flat placed object registry with family-oriented shape in locationPlacedObject.registry.ts — top-level family keys, explicit palette category metadata, family-level runtime, variants map (current rows as single-variant families); wire selectors to preserve placement + palette behavior
    status: pending
  - id: family-registry-selectors
    content: Add/adjust selectors and resolvers (e.g. getPlacedObjectPaletteOptionsForScale, meta/runtime by family+variant) so palette, activePlace family+variant ids, and placementRegistryResolver consume one registry contract — no duplicate flat list
    status: pending
  - id: define-placement-resolver-seam
    content: Consolidate resolvePlacedKindToAction + buildPersistedPlacedObjectPayload into placementRegistryResolver; thin handleAuthoringCellClick to delegate resolution to the seam — only apply gridDraft/pendingPlacement mutations from resolver output; no parallel mapping in toolbar or LocationEditRoute
    status: pending
  - id: define-palette-model
    content: Toolbar drawer palette from registry; primary chooser for all place palette rows (map-object + linked-content); rail not duplicate list
    status: pending
  - id: introduce-loaded-object-state
    content: Evolve LocationMapActivePlaceSelection / activePlace to family+variant identity; repeat/clear; coordination with selection — single state field, no duplicate loaded vs activePlace
    status: pending
  - id: preserve-cell-placement
    content: Preserve wire payload shape and click-to-place through evolved resolver path
    status: pending
  - id: document-rail-vs-toolbar-split
    content: Toolbar chooser; rail inspection/configuration; single registry source of truth
    status: pending
  - id: tests-and-docs
    content: Tests for family registry + selectors, resolver, loaded placement, linked vs object branches
    status: pending
  - id: update-location-workspace-reference
    content: Update docs/reference/locations/location-workspace.md for toolbar-first place palette, evolved activePlace, placementRegistryResolver seam, and any superseded rail/palette wording so the canonical reference matches implementation
    status: pending
isProject: true
---

# Object authoring Phase 1 — palette foundation

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Canonical reference:** [docs/reference/locations/location-workspace.md](../../../docs/reference/locations/location-workspace.md)

**Role:** **Child plan (implementation)** — **Phase 1** of the object authoring roadmap. Establishes a **family-oriented placed object registry** (refactor `locationPlacedObject.registry.ts` + selectors), **consolidated placement seam**, and **toolbar-first** palette on top of **today’s real pipeline** (`activePlace` → resolver → payloads / link intent → draft). **Phase 2 (variants UI)** extends the **same registry contract** — **not** a second registry redesign.

**Next phase:** [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md)

---

## Objective

Move from **rail-first** picking to a **registry-driven** **toolbar drawer** palette, while **preserving** **click-to-place** and the **current persisted wire contract** for map objects.

Phase 1 is **explicitly grounded** in the audited chain: palette rows → `MapPlacePaletteItem` → `**activePlace`** → `**handleAuthoringCellClick`** → `**resolvePlacedKindToAction**` → `**buildPersistedPlacedObjectPayload**` (map-object branch) **or** link placement → `**gridDraft`** / `**pendingPlacement`**. The plan names how **loaded placement identity**, the **resolver seam**, and **registry** relate to these **existing** symbols — not abstract “future” mechanisms with no mapping to code.

**Registry source of truth:** implementation work extends the canonical placed-object definitions in `[locationPlacedObject.registry.ts](../../../src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts)` (and `[locationPlacedObject.selectors.ts](../../../src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts)`) — not a parallel ad hoc list.

---

## Problem: flat registry vs family/variant direction

Today’s **flat** registry keys (`city`, `building`, `site`, `tree`, `table`, `stairs`, `treasure`, …) match current placement but **do not** encode the durable shape needed for the documented direction:

- Human-readable **long-term identity** examples: `door.single.wood`, `table.rect.wood`, `stairs.stone`, `window.narrow` — **family-scoped**, not unrelated flat ids.
- **Top-level registry key** should imply **family / base kind**.
- **Category** (e.g. furniture vs fixtures) should stay **explicit metadata** for palette **grouping** — **not** persisted map identity.
- **Shared `runtime`** (blocking, cover, etc.) should live at **family** level by default; variant-level overrides are a later escape hatch.
- **Variants** must stay **explicit and readable**; future **swatch/image** selection favors **explicit variant entries**, not a fully **dynamic matrix** of orthogonal axes at runtime.

If Phase 2 builds **grouped variant UX** on top of a still-flat registry, the codebase risks a **second registry redesign** while palette UX is also moving — **avoid**.

---

## Family-oriented placed object registry (Phase 1 — before Phase 2 UI)

**Objective:** Introduce a **family-oriented placed object registry** and a **small set of selectors / resolver-facing helpers** so that:

- **Current Phase 1 placement behavior** is **preserved** (wire payload, link vs object branches, stairs seeding policy).
- **Category** remains **UI / palette metadata only** (never persisted authored identity on the map).
- **Family + explicit `variants`** is the **durable contract** now; Phase 2 **adds** grouped variant **UI**, not a new registry shape.
- **Today’s single-entry placeables** are represented as **single-variant families** (e.g. one `default` variant) until real multi-variant families are added.
- **Linked-content** vs **map-object** placement stays **explicit** in resolver routing (unchanged semantics).

**Replace** the flat `AUTHORED_PLACED_OBJECT_DEFINITIONS` shape with a **future-facing** structure along these lines (exact field names are implementation details; **shape** is the contract):

- **Top-level key** = **family id** (base kind for resolution and palette row identity).
- `**category`** (or equivalent) = **explicit palette grouping** (toolbar sections) — presentation only with respect to persistence.
- `**placementMode`** (e.g. `cell` for current placeables), `**allowedScales**`, and **family-level `runtime`** on the **family** record.
- `**variants`**: a **map** (or ordered list) of **explicit** variant ids → per-variant fields (labels, icons, descriptions, and any variant-only data). Phase 1 may only expose `**default`** (or one canonical id) in the toolbar per family.
- **No** generalized **materials × shapes × sizes** engine; optional **helper composition** later if repetition hurts — **not** Phase 1.

**Illustrative example** (bias, not prescription):

```ts
table: {
  label: 'Table',
  category: 'furniture',
  placementMode: 'cell',
  allowedScales: ['floor'],
  runtime: { /* shared defaults */ },
  variants: {
    default: {
      label: 'Table',
      iconName: 'table',
      description: 'Furniture or surface.',
    },
  },
},
```

**Selectors / resolvers (minimal Phase 1 set):**

- Refactor or extend `**getPlacedObjectPaletteOptionsForScale`**, `**getPlacedObjectDefinition**`, `**LOCATION_PLACED_OBJECT_KIND_META**`, and related exports so **palette rows** resolve from **family + default variant** (or explicit variant when only one exists).
- `**LocationPlacedObjectKindId`** (or a successor type) should align with **family id** at the top level; **variant id** is carried alongside for `**activePlace`** and `**MapPlacePaletteItem**` (already biased in Phase 1 types).
- `**placementRegistryResolver**` / `**buildPersistedPlacedObjectPayload**` consume **stable mapping** from **family + variant** → existing **wire** `LocationMapObjectKindId` + optional `**authoredPlaceKindId`** — **no** second parallel “flat kind” registry long-term.

**Phase 2 guard:** [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md) should **extend** this registry (more variants per family, picker UX, tooltips) — **not** replace the family/variant contract again.

---

## Category vs `interaction` vs linking (registry semantics)

**Principle:** `**category`** in the family registry is **only** a **UI palette grouping bucket** — it does **not** encode persistence meaning, link behavior, or “what resolver branch runs” by itself. **Behavior semantics** (transitions, future capabilities) use a **separate** family-level `**interaction`** (or equivalent) prop. **Linking / reference configuration** belongs to **authored configuration** (future **right rail** / inspector), **not** to toolbar category.

### Palette category buckets (guiding set)

Use **stable, UI-oriented** bucket ids for toolbar sectioning and ordering — **not** behavioral catch-alls:


| Bucket           | Role                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| `**structure`**  | Buildings, shells, major structural markers the user thinks of as “built form”       |
| `**furniture**`  | Tables, seating, surfaces                                                            |
| `**fixture**`    | Doors, windows, fixed installs (future)                                              |
| `**hazard**`     | Traps, dangerous terrain (future)                                                    |
| `**treasure**`   | Loot / objectives (can align with registry family `treasure` or stay as bucket name) |
| `**decor**`      | Non-structural dressing                                                              |
| `**vegetation**` | Trees, plants                                                                        |


Do **not** use `**linked-locations`** (or similar) as a **registry palette category** if it implies **behavior** (“this row always opens a link modal”). Prefer **structure** / **vegetation** / etc., and model **linkability** separately (below).

### `interaction` is separate from `category`

`**interaction`** (and future `**capabilities**` / `**linking**` hints at the **data** layer, not in `category`) carries **play/system semantics** — e.g. transition roles — **orthogonal** to which palette bucket the family appears under.

**Guiding pattern** (bias for documentation and registry shape):

```ts
stairs: {
  category: 'structure',       // palette bucket only
  placementMode: 'cell',
  runtime: { /* … */ },
  interaction: {
    role: 'transition',
    transitionKind: 'stairs',
  },
  variants: {
    stone: { label: 'Stairs', iconName: 'stairs', /* … */ },
  },
},
```

- `**category**` → where the family appears in the **toolbar palette** (grouping / filters).
- `**interaction`** → **behavior** hints for combat/world systems (existing pattern for stairs).
- **Variants** → explicit visual/token rows (`stone`, …); Phase 2 can expose multiple without changing this split.

### Building: **structure**, not “linked-locations”

**Refined recommendation:**

- `**building`** (and similar **structure** families) should use `**category: 'structure'`** in the registry — **same** bucket whether the placed instance is an **empty shell**, a **visual token**, or later a **linked** child location.
- **Toolbar selection** determines **family + variant** (building appearance / token), **not** whether a link exists.
- `**linkedScale`** / **pending-placement link flow** remain **resolver- and product-driven** for **current** behavior where the code still branches to **link** vs **object**; those mechanics are **not** renamed “category.” Long term, **whether** a cell’s building is linked is **authored state** (inspector / rail), **not** a palette category.

This supports:

- A **city** map with an **unlinked** building shell **and** a **linked** building reference **without** forcing **two palette categories** for “same” building family.

### Future linking and right-rail configuration

**Explicit direction (plan-level, not full implementation in Phase 1):**

- **Toolbar / palette** chooses **what family and variant to place** (identity for placement).
- **Right rail** (or inspector) is the proper **future home** for **optional** **link/reference** configuration: bind to child location, portal target, stair endpoint pairing, trap behavior, etc.
- **Linkability** is a **capability / configuration / interaction** concern — **or** persisted fields on the map object — **not** a `**category`** concern.

Applies not only to **building**, but also to future **site**, **city**, **portal**, **trap door**, **stairs endpoint** pairing, etc.: **palette bucket** stays **UI**; **link/reference** is **authored later** in context, not selected by a “linked” vs “unlinked” **registry category**.

**Constraints:** Phase 1 **does not** implement full right-rail linking workflows; **does** document this split so **registry** and **resolver** evolution do not reintroduce `**linked-locations`** as a behavioral catch-all.

### City, building, site — registry treatment (questions resolved in plan)


| Family       | **Preferred palette `category` (UI)**                                                                               | **Notes**                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **city**     | `**structure`** (or `**decor**` if product prefers “settlement marker” away from buildings — pick one and document) | World-scale **settlement** marker; **not** a “linked-locations” bucket. Link/reference to child city location → **future rail/config**, not category. |
| **building** | `**structure`**                                                                                                     | Same bucket for shell vs linked; **variant** may carry visual token; **link** = authored config.                                                      |
| **site**     | `**structure`** or `**decor**`                                                                                      | Minor POI; same rule — **no** separate “link category.”                                                                                               |


**What carries link behavior instead of `category`:** today `**linkedScale`** + resolver `**link**` branch + `**pendingPlacement**`; tomorrow **optional** persisted **link ids** / **inspector fields** — still **not** `PlacedObjectPaletteCategoryId`.

**Placement vs link-capable:** resolver continues to distinguish **link** vs **object** **actions** from **family definition** (`linkedScale`, host scale) — that is **routing**, not **palette bucket**. Registry `**category`** must stay **orthogonal** so contributors do not confuse **“where it sits in the toolbar”** with **“whether it opens a link modal.”**

---

## Audited: current placement pipeline (production)

The following is **already implemented** and is the baseline Phase 1 refactors from:

1. **Palette data:** `getPlacePaletteItemsForScale` → `MapPlacePaletteItem[]` (linked-content vs map-object **category** is **UI routing only**).
2. **Selection:** User picks a row → `**activePlace`** = `{ category, kind }` (`LocationMapActivePlaceSelection` in `useLocationMapEditorState`).
3. **Click:** `**handleAuthoringCellClick`** (`useLocationEditWorkspaceModel`) runs when in **place** mode with `**activePlace`** set.
4. **Routing:** `**resolvePlacedKindToAction(activePlace, hostScale)`** → `**link`** | `**object**` | `**unsupported**`.
5. **Map-object payload:** `**buildPersistedPlacedObjectPayload(placedKind, hostScale)`** → `{ kind: LocationMapObjectKindId, authoredPlaceKindId? }`.
6. **Draft / link:** **Object** → append to `**gridDraft.objectsByCellId[cellId]`** (plus **stairs** default `**stairEndpoint`** inline). **Link** → `**setPendingPlacement`** (linked-location flow).
7. **Persisted wire (map objects):** `**LocationMapObjectKindId`** + optional `**authoredPlaceKindId`** — unchanged by Phase 1 (see **Persistence stance**).

---

## Current placement pipeline → Phase 1 mapping


| Today (audited)                                                         | Phase 1 target                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rail `**LocationMapEditorPlacePanel`** + `getPlacePaletteItemsForScale` | **Toolbar drawer** palette; **same** registry-driven item list (not a second list)                                                                                                                                                                          |
| `**activePlace` = `{ category, kind }`**                                | **Evolved** loaded placement identity (see `**activePlace` vs loaded placement state**): `**category`** remains **UI-only**; `**kind`** gains **family + default variant** (or equivalent) as registry identity                                             |
| `**handleAuthoringCellClick`** (large inline place branch)              | **Thin handler**: delegate `**activePlace` + cell + host context** → `**placementRegistryResolver`** (single entry); **only** then `**setPendingPlacement`** / `**setGridDraft`** from returned **structured result** — **no** inlined kind→payload mapping |
| `**resolvePlacedKindToAction`**                                         | **Absorbed into / re-exported from** `**placementRegistryResolver`** — same **placement action** discriminant (`link`                                                                                                                                       |
| `**buildPersistedPlacedObjectPayload`**                                 | **Object-payload translation layer** inside the seam (keep or wrap; **do not** fork two competing payload builders)                                                                                                                                         |
| Stairs `**stairEndpoint`** seeded in draft mutation                     | Remains **special-case authored defaults** at **draft append** (or immediately after resolver returns **object** intent), **not** generic “stairs with no future hooks” — **stairs linking** workflows stay **out of scope**                                |


---

## Loaded placement state: relationship to `activePlace` (decision)

**Chosen approach: Option A — evolve `activePlace` (single source of truth)**

- Phase 1 **does not** add a **second** parallel state (e.g. `loadedPlaceable` alongside `**activePlace`**) and does not retire `**activePlace`** in favor of an unrelated name without migration (Options B/C avoided to **minimize duplicate sources of truth**).
- `**activePlace`** remains the **one** field in `**useLocationMapEditorState`** that means “what the user intends to place.” Its **TypeScript type** `**LocationMapActivePlaceSelection`** **evolves** to carry **durable registry identity**: at minimum **family id** + **variant id** (Phase 1: default variant), while preserving **discrimination** between **linked-content** and **map-object** **routes** via `**category`** (still **not** persisted).
- **Why this sets up Phase 2:** Variant selection updates the **same** `**activePlace`** / loaded identity — no merge logic between two competing stores. Toolbar and rail (during migration) both **set** this one state.

**Implementation note:** During refactors, a **temporary** normalizer from legacy `{ category, kind }` to **family + variant** may live at the registry boundary; the **target** is one evolved shape, not permanent dual models (avoid Option C as an indefinite end state).

---

## Placement resolver seam — `placementRegistryResolver` (concrete)

**This is not a greenfield API.** Production already has a real seam:

- `**resolvePlacedKindToAction`** — registry/palette `**kind`** + `**category**` + host scale → `**link`  `object`  `unsupported**`
- `**buildPersistedPlacedObjectPayload**` — authored `**placedKind**` + host scale → **persisted object payload** for **map-object** branch
- `**handleAuthoringCellClick`** — today **mixes** resolution with draft mutation; Phase 1 **splits** that responsibility.

**Phase 1 direction:** **Absorb and consolidate** resolution into a **named module boundary** `**placementRegistryResolver`** (single folder or module as implemented):

1. **Owns:** **Registry identity** (family + variant, once registry exists) **→** same conceptual outputs as today: **placement action** (`link`  `object`  unsupported) **→** for `**object`**: payload = `**LocationMapObjectKindId` + optional `authoredPlaceKindId`** via `**buildPersistedPlacedObjectPayload**` (or thin wrapper); for `**link**`: **link intent** for `**pendingPlacement`**.
2. **Does not own:** Palette JSX, toolbar layout, or **full** `gridDraft` reducers — but **must** be the **only** place that maps **identity → action → payload/link intent** (no copy-paste branches in the route hook).
3. `**handleAuthoringCellClick` becomes thinner:** For **place** mode, it should **call** `**placementRegistryResolver`** (or one exported `**resolvePlacementForCellClick`**) with `**activePlace**`, `**cellId**`, `**hostScale**`, and any minimal flags — then **only** apply **pure** side effects: `**setPendingPlacement`** from **link** result, `**setGridDraft`** append from **object** result (including **stairs** seeding). It **must not** grow new **kind → payload** branches; those stay **inside** the resolver seam.
4. **Toolbar / route wiring:** **No new parallel mapping.** Toolbar components **set `activePlace` / UI only** — they **do not** import `**buildPersistedPlacedObjectPayload`**, `**resolvePlacedKindToAction`**, or registry→wire translation. `**LocationEditRoute**` (and similar assembly) **wires props and handlers** — it **does not** add a **second** placement translation path alongside the resolver.
5. **Special-case authored defaults:** **Stairs** `**stairEndpoint`** initialization stays **after** **object** resolution, at **draft creation** time (same layer as today conceptually), **not** inside generic registry rows as if stairs were indistinguishable from props. This **preserves** room for future **stairs-specific** authoring without pretending stairs are fully generic.

**Wrap vs replace:** Prefer **wrapping / re-exporting** `**resolvePlacedKindToAction`** and `**buildPersistedPlacedObjectPayload`** inside `**placementRegistryResolver**` until family+variant inputs are wired — **avoid** two diverging resolver implementations.

```mermaid
flowchart LR
  toolbar[ToolbarPalette] --> activePlace[activePlace_evolved]
  activePlace --> resolver[placementRegistryResolver]
  resolver --> linkIntent[link_pendingPlacement]
  resolver --> payload[buildPersistedPlacedObjectPayload]
  payload --> draft[gridDraft_objectsByCellId]
  linkIntent --> pending[pendingPlacement]
```



---

## Linked-content scope (Phase 1)

**Explicit:** **Included** in the **same** Phase 1 palette migration and **same** `**activePlace`** / resolver model — **not** “objects only, linked-content later.”

- `**getPlacePaletteItemsForScale`** already emits **both** **linked-content** and **map-object** **routing** rows; the toolbar replaces the rail as the **primary chooser** for **all** of them.
- **Resolver:** `**resolvePlacedKindToAction`** implements `**link`** vs `**object**` from **family definition + host scale** (e.g. `linkedScale`), **not** from registry **palette `category`**. Registry `**category**` must **not** be used as a stand-in for “this is a linked row” — see **Category vs `interaction` vs linking**.
- **Future:** Optional **link/reference** editing moves toward **right-rail configuration**; **not** a new palette bucket called “linked.”
- **Out of scope still:** Full **right-rail linking** implementation, deep **stairs** pairing workflows, rich **post-placement** link editing — **existing** placement + modal behavior only unless a child plan expands scope.

---

## Persistence stance (Phase 1)

**Preserve** the **current persisted wire shape** for map objects:

- `**LocationMapObjectKindId`** + optional `**authoredPlaceKindId`**

Phase 1 **does not** intentionally change map save semantics or introduce a new persisted identity encoding in `**cellEntries`** for this phase. **Registry family + variant** lives **above** the wire: the **resolver seam** translates to the **existing** payload shape. If a future phase adds persisted variant ids, that is a **separate** migration with explicit cost — **not** Phase 1.

**Registry palette `category`:** **UI grouping only** (`structure`, `furniture`, …) — **never** persisted authored identity. **Link/reference** state is **not** encoded by category; see **Category vs `interaction` vs linking**.

---

## Category and grouping (two meanings — do not conflate)

1. **Registry `category` (`PlacedObjectPaletteCategoryId`):** **Palette bucket only** — `structure`, `furniture`, `vegetation`, … See **Category vs `interaction` vs linking**.
2. `**MapPlacePaletteItem` / `activePlace` `category` (`linked-content`  `map-object`):** **Resolver routing** for the **current** placement pipeline (which branch: link intent vs cell object). **Not** the same field as registry palette buckets; **not** persisted on the map.

**Persisted identity** never includes either category type as authored “kind” on the cell — wire shape remains `**LocationMapObjectKindId` + optional `authoredPlaceKindId`** (see **Persistence stance**).

---

## Stairs and special-case authoring defaults

- **Stairs** participate in the **registry** and **loaded placement** like other floor **map-object** placeables.
- **Default `stairEndpoint` seeding** on new placement remains **explicit** in the **draft-append** path (as today), **not** hidden inside a generic “all objects equal” helper. This **does not** implement **stairs linking** (still out of scope); it **honors** existing **special authoring defaults** and keeps a hook for future **stairs-specific** behavior.

---

## Authored identity contract (durable, above the wire)

- **Top-level registry key** = **family id**; `**variants`** holds explicit entries; Phase 1 toolbar uses **one row per family** with **default** (or single) variant.
- **Persisted** cell payloads remain **as today**; **family + variant** resolve through `**placementRegistryResolver`** to `**LocationMapObjectKindId` + optional `authoredPlaceKindId**`.

**Human-readable examples** (intent — may be structured ids in code, not one concatenated string): `door.single.wood`, `table.rect.wood`, `stairs.stone`, `window.narrow`.

**Concrete registry shape:** See **Family-oriented placed object registry** above; implementation lives under `[locationPlacedObject.registry.ts](../../../src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts)`.

---

## Family-level shared fields vs variant overrides

- **Default:** `**runtime`** and cross-variant defaults at **family** level (see family-oriented registry section).
- **Phase 2+:** Variant-level metadata and **optional partial overrides**; merge order **family → variant** at resolution time — **not** in palette JSX.

---

## Current-state audit — complete inventory (gate before implementation)

The **starter** inventory (e.g. floor **table** / **stairs** / **treasure**) is **not** sufficient. **Implementation must not begin** until the table below is **complete** for **every** row `**getPlacePaletteItemsForScale`** can emit **and** any **edge** special cases called out in code reviews.

**Required columns (one row per placeable):**


| Column                                         | Content                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Current palette / source kind**              | `LocationPlacedObjectKindId` (or equivalent source key)                                 |
| **Placement class**                            | `**map-object`**                                                                        |
| **Current persisted payload or link behavior** | For objects: wire shape + notes; for links: `**pendingPlacement`** / modal flow summary |
| **Proposed registry family key**               | Durable family id                                                                       |
| **Proposed default / current variant id**      | Phase 1 default                                                                         |
| **Category / group** (toolbar)                 | Presentation only                                                                       |
| **Placement mode**                             | `cell` (and note if link uses different UX)                                             |
| **Notes / migration risk / special handling**  | e.g. **tree** → **marker** mapping, **stairs** endpoint seeding                         |


**Output:** Migration-sensitive notes **and** **completed** table — **gate** for coding tasks that change placement or registry wiring.

---

## Registry location and ownership

- **Authoring vocabulary + runtime defaults:** `[locationPlacedObject.registry.ts](../../../src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts)` — **family-oriented** definitions; **not** a second duplicate registry elsewhere.
- **Derived palette / meta / ids:** `[locationPlacedObject.selectors.ts](../../../src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts)` (and siblings) — **selectors** stay the thin layer over the family registry.
- `**placementRegistryResolver`:** `[domain/authoring/editor/placement/](../../../src/features/content/locations/domain/authoring/editor/placement/)` — **identity → wire payload / link**; colocated with `**resolvePlacedKindToAction`** / persistence mapping.
- **Single source of truth** for palette rows: toolbar **and** any remaining rail hints **must not** diverge from **selectors + registry**.

---

## Palette model (toolbar drawer)

- **Primary chooser** for **all** place palette content (**map-object** + **linked-content**), registry-driven sections.
- **One row per family**, default variant; **no** Phase 2 variant picker.
- **Load** → sets evolved `**activePlace`** only (identity + `**category`** for branch routing). **No** payload or resolver calls in toolbar JSX — **no** duplicate mapping.
- **Repeat / clear:** unchanged policy (stay loaded after place; clear on explicit clear, mode change, or other placeable).

---

## Loaded object state model (concrete)


| Topic                | Phase 1 rule                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Shape**            | Evolved `activePlace`: registry **family + variant** (default in Phase 1) + `**category`** for branch routing — **not** a duplicate persisted `**cellEntries`** document |
| **Repeat placement** | After place, **stay loaded**                                                                                                                                             |
| **Clear**            | Explicit clear, **tool/mode** away from place, or **other placeable**                                                                                                    |
| **vs selection**     | `**mapSelection`**: inspect; `**activePlace`**: placement intent                                                                                                         |


---

## Placement continuity

- **Same** wire shapes and behaviors through **evolved** identity + **consolidated** `**placementRegistryResolver`**.

---

## Toolbar vs rail responsibility split


| Surface            | Role                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Toolbar drawer** | **Choose** what to place (all place rows); show loaded placement; set `activePlace` only — **zero** placement translation / payload building |
| **Rail**           | **Not** primary chooser; hints / inspect after selection; same rule if rail still shows place items during migration                         |


**Route / workspace assembly (`LocationEditRoute`, rail panel props):** Pass **handlers** and **refs** to **model** code that calls `**placementRegistryResolver`** — **do not** embed mapping from palette kind → persisted shape in the route file.

---

## Future Phase 2 (variants) — forward note

- Phase 2 extends **same** `**activePlace`** identity and `**placementRegistryResolver**` with **grouped variant UX** (picker, counts, tooltips).
- Phase 2 **does not** replace the **family + `variants`** registry contract introduced in Phase 1 — it **adds UI and optional variant-level metadata** on the **existing** shape.

---

## Out of scope

- Grouped **variant** UX, pickers, swatches
- **Edge** placement from Draw
- **Deep** inspector rewrite
- **Stairs linking** beyond defaults + registry coherence
- **Implicit matrix** construction
- **Changing** persisted map **wire** identity encoding in Phase 1

---

## Cross-cutting concerns


| Area                        | Cover                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Registry**                | **Family-oriented** definitions in `locationPlacedObject.registry.ts`; `**category`** = palette bucket only (`structure`, `furniture`, …); `**interaction**` separate; **no** `linked-locations` **palette** category as behavioral catch-all; **selectors** in `locationPlacedObject.selectors.ts`; **explicit `variants`**; **no** second flat registry for Phase 2 to undo |
| **Resolver**                | `**placementRegistryResolver`** consolidates `**resolvePlacedKindToAction`** + `**buildPersistedPlacedObjectPayload**` + **identity** mapping; **no** scattered translation                                                                                                                                                                                                   |
| **Click handler**           | `**handleAuthoringCellClick`** delegates **resolution** to the seam; **draft/link** mutations only — **not** a second mapping layer                                                                                                                                                                                                                                           |
| **UI boundaries**           | Toolbar + route **do not** add **parallel** `kind → payload` logic                                                                                                                                                                                                                                                                                                            |
| **Placement state**         | **Single** `**activePlace`** evolved, not duplicated                                                                                                                                                                                                                                                                                                                          |
| **Persistence**             | **Preserve** `**LocationMapObjectKindId` + `authoredPlaceKindId`**                                                                                                                                                                                                                                                                                                            |
| **Canonical reference doc** | **[docs/reference/locations/location-workspace.md](../../../docs/reference/locations/location-workspace.md)** — update in Phase 1 scope when behavior/symbols change (toolbar vs rail place UX, resolver names, loaded placement); keep “until plans land” vs **shipped** language accurate                                                                                                       |


---

## Documentation — `location-workspace.md` (in scope)

Phase 1 **includes** updating **[docs/reference/locations/location-workspace.md](../../../docs/reference/locations/location-workspace.md)** so it stays the **accurate** canonical description of the location workspace:

- **Place / palette:** Document **toolbar-first** chooser and **registry-driven** sections; **family-oriented** registry (`locationPlacedObject.registry.ts` / selectors) when shipped.
- **Pipeline:** Align **object authoring** / **Map editor toolbar** sections with `**activePlace`** evolution, `**placementRegistryResolver`**, **linked-content vs map-object** branches, and **family + variant** identity.
- **Cross-links:** Keep links to Phase 1 plan and parent roadmap accurate; avoid contradicting **Imports and barrels** / route boundaries elsewhere in the doc.

**Not** in scope: rewriting unrelated workspace sections (dirty/save, normalization) unless Phase 1 work **touches** them.

---

## Risks / migration notes


| Risk                            | Mitigation                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Dual loaded vs activePlace      | **Option A only** — one field                                                                               |
| Resolver fork                   | **Wrap existing** functions inside `**placementRegistryResolver`**                                          |
| Mapping sprawl in toolbar/route | **Explicit** rule: resolver + thin `**handleAuthoringCellClick`** only                                      |
| Incomplete inventory            | **Gate** implementation on full table                                                                       |
| Flat registry left in place     | **Complete** family registry + selector refactor **before** Phase 2 UX; avoid two registry models in flight |


---

## Guardrails

### Do

- Ground changes in **audited** pipeline symbols
- **Refactor flat → family registry** in `**locationPlacedObject.registry.ts`** with **selectors** updated in lockstep — **stable contract** for Phase 2
- **One** `**activePlace`**, **one** resolver **facade**
- **Thin `handleAuthoringCellClick`:** delegate to `**placementRegistryResolver`**, then apply **draft** / **pending** updates only
- **Preserve** wire payload shape in Phase 1

### Do not

- **Abstract** “future resolver” with **no** tie to `**resolvePlacedKindToAction`**
- **Exclude** linked-content from toolbar palette scope
- **Persist** registry palette `**category`** or conflate it with **link behavior** — **category** is **UI-only**; linking is **config/capability**, not a bucket
- **New parallel mapping** in **toolbar components** (including palette cards, drawers, chips) or **route wiring** (`LocationEditRoute`, rail assembly) — **all** **identity → action → payload** stays in **domain** `**placementRegistryResolver`** (or helpers it owns)

---

## Acceptance criteria

1. `**activePlace`** evolution (Option A) is **explicit**; no ambiguous parallel loaded state.
2. `**placementRegistryResolver`** is **defined** as **consolidation** of `**resolvePlacedKindToAction`** + `**buildPersistedPlacedObjectPayload`** + **identity** mapping — **not** a vague future API.
3. `**handleAuthoringCellClick`** is **thin**: delegates placement **resolution** to the consolidated seam; **does not** reintroduce inlined kind→payload mapping.
4. **No new parallel mapping** in **toolbar** UI or **route** assembly — only `**activePlace`** updates from palette, **resolver** in **model/domain** path on cell click.
5. **Linked-content** is **in scope** for toolbar palette + **same** resolver **branching** model.
6. **Persistence:** **Preserve** `**LocationMapObjectKindId` + optional `authoredPlaceKindId`**; registry sits **above** wire.
7. **Inventory** complete per **expanded** columns **before** implementation (**gate**).
8. **Pipeline mapping** section documents **today → Phase 1** (rail → toolbar, resolver consolidation, orchestration).
9. **Stairs:** defaults stay **explicit** in draft path; linking **out of scope**.
10. **Category** remains **UI-only**; toolbar grouping ≠ persisted identity.
11. Phase 1 **scoped**: palette foundation + **grounded** refactor — **no** Phase 2 variant UX.
12. **[docs/reference/locations/location-workspace.md](../../../docs/reference/locations/location-workspace.md)** updated so **canonical** workspace reference matches **shipped** Phase 1 placement/palette/resolver behavior and symbols.
13. **Family-oriented registry** is **implemented** in `**locationPlacedObject.registry.ts`** (top-level **family** keys, explicit **palette category**, family-level `**runtime`**, `**variants**` with at least **default** per current placeable); **selectors** resolve palette and meta from that shape; **no** remaining **flat-only** authoring registry that Phase 2 must replace.
14. **Placement + palette behavior** unchanged from a **product** perspective (same wire, same link vs object semantics); identity paths go through **family + variant** → existing resolvers.
15. **Registry `category`** is documented and implemented as **palette grouping buckets only** (`structure`, `furniture`, `fixture`, `hazard`, `treasure`, `decor`, `vegetation` — exact enum as implemented); `**interaction`** (and related) holds **behavior semantics**, **not** `category`.
16. `**building`** (and **city** / **site** per plan table) use **UI** categories such as `**structure`** (or documented alternates) — **not** `**linked-locations`** as a registry palette category; **link/reference** is **not** encoded by palette bucket.
17. Plan explicitly states **future linking / reference configuration** belongs in **right-rail (or inspector) authored config**, not toolbar category; Phase 1 does **not** implement full rail linking.
18. Contributors can distinguish **palette bucket** vs **resolver routing** (`linked-content`  `map-object`) vs **future** **link configuration** without treating `**linked-locations`** as a behavioral registry category.

---

## Related

- [docs/reference/locations/location-workspace.md](../../../docs/reference/locations/location-workspace.md) — canonical reference (Phase 1 deliverable: keep in sync)
- [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md)
- [.cursor/plans/location-workspace/README.md](README.md)
- [location_workspace_cleanup_94269d45.plan.md](../location_workspace_cleanup_94269d45.plan.md)

