---
name: Object authoring Phase 4 — config and editing
overview: Post-placement config/editing with **explicit inspector ownership** and a **single shared placed-object rail template** for **all** placed authored objects (cell- and edge-anchored): **CellInspector** (empty cell only); **CellObjectInspector** / **EdgeObjectInspector** share the **same structural rhythm** (identity → placement → metadata → **Label** slot: freeform if **unlinked**, linked **title/name** if **linked** → actions → remove). Not “selected cell” vs “object in cell” as one surface. Door/window state, stairs, metadata, wire migrations. Map `gridDraft.mapSelection` to modes (may evolve discriminant). **Post-build cleanup pass** (follow-up): fix run-first door/window copy, restore **variant.presentation** metadata without a heavy manual map, consistent **Label** on edge objects, empty-cell rail boundary, and audit **edge features vs authored edge objects** — see **Post-build cleanup pass (Phase 4 follow-up)**.
todos:
  - id: audit-current-post-placement-editing
    content: Audit current rail/inspector behavior for placed objects, current editable metadata/state, and any existing stairs/door/window configuration flows
    status: pending
  - id: define-phase4-editing-scope
    content: Define which post-placement configuration/editing capabilities belong in this phase first and which should remain deferred
    status: pending
  - id: define-object-inspector-model
    content: Normative CellInspector vs placed-object inspectors; shared placed-object rail template for all cell + edge objects; target dispatch; no generic link UI on empty cell; migrate off single cell branch+flags; shell + type-specific rows/actions not bespoke per-type layouts
    status: pending
  - id: plan-door-window-states
    content: Outline door/window instance state (open/closed, locks, …) and how it persists — Phase 3 stores only edgeEntries edgeId+kind; variant does not round-trip; decide additive wire vs adjunct and migration
    status: pending
  - id: plan-stairs-linking
    content: Outline the intended stairs-linking workflow and how it fits selected-object editing, authored state, and related location/floor data
    status: pending
  - id: identify-richer-metadata-direction
    content: Define the high-level path for richer authored object metadata/behavior without overcommitting to every future object type in this phase
    status: pending
  - id: risks-and-guardrails
    content: Call out dependencies, migration risks, and scope boundaries so this phase does not collapse into a full editor redesign
    status: pending
  - id: update-location-workspace-doc
    content: Update docs/reference/location-workspace.md so the canonical reference matches Phase 4 (shared placed-object template, inspector ownership, selection rail, debounced persistable fields, any new persisted workspace rules)
    status: pending
  - id: phase4-post-build-cleanup-pass
    content: Post-build cleanup — object-first door/table/edge inspectors, presentation metadata from variant.presentation (lightweight formatter), Label on all placed objects including edge, empty-cell selection tab without generic link/add-object UI, edge-feature vs wall/draw coupling note or small decoupling — see Post-build cleanup pass section
    status: pending
isProject: true
---

# Object authoring Phase 4 — config and editing

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Depends on:** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md), [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md), [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md).  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) (Selection inspectors, state ownership, debounced persistable fields, `gridDraft`).

**Role:** **Child plan (high-level)** — Phase 4 scope is **defined against Phase 3 as implemented**: shared registry with `placementMode: 'cell' | 'edge'`, `door` / `window` edge families on **floor** maps (square), Draw palette **wall-only** for edges, Place + boundary targeting committing via **`applyEdgeStrokeToDraft`**, resolver seam **`resolvePlacementEdgeFeatureKind`** / **`resolvePlacedKindToAction`** (`type: 'edge'`). **Refine** implementation detail and acceptance criteria in follow-up edits before coding. **Canonical doc** [location-workspace.md](../../../docs/reference/location-workspace.md) is **in scope to update** when Phase 4 behavior and rules land (see **In scope**).

**Naming:** Same initiative prefix: **`location_workspace_object_authoring_*`**.

---

## Phase purpose

Move from **placing** authored objects to **configuring and editing** them after placement: **rail-first** inspection/editing for **selected** cell and edge authored entities, **typed** editable state (doors/windows, stairs), and a **sustainable** direction for **richer metadata** without ad hoc rail special cases everywhere. **All** placed objects share **one** **object-first** selection-rail **template** (see **Shared placed-object rail template**); differences are **metadata** and **actions**, not unrelated per-type layouts.

**Phase 3 baseline (relevant to Phase 4):**

- **`edgeEntries`** on the wire are still **`{ edgeId, kind }` only** — no `authoredPlaceKindId`, no variant id, no per-edge instance bag. **`resolvePlacedKindToAction`** maps registry **`door` / `window`** → **`edgeKind`** `'door'` / `'window'`; **variant is resolver-only** at place time (same bar as Phase 2 cell objects).
- **Selected-edge rail** today: **`LocationMapEdgeInspector`** — kind, id, remove, plus **copy** that variant choice is **not** persisted for door/window in this phase. Phase 4 **cannot** show authoritative “which variant was placed” **without** a persistence or parallel derivation decision.
- **Hex:** edge **Place** authoring is not active on hex grids (data may still exist); any **hex** edge editing in a later phase is **separate** from Phase 4 square-first scope unless explicitly expanded.
- **Runtime guardrail from Phase 3:** richer door/window **behavior** (mechanics) stays out of scope until explicitly scheduled; Phase 4 focuses on **authored config / inspector UX** and **persisted shape** where product requires it — not combat rule changes by stealth.

---

## Problem: mixed rail ownership (structural)

The Selection rail is at risk of **mixing two different jobs**:

1. **Empty-cell inspector** — “This grid cell has no (or not yet focused) authored object.” Context: coordinates, terrain, region, host map/floor, lightweight cell-level affordances.
2. **Placed-object inspector** — “This **city** / **building** / **site** marker (or **door** / **window** on an edge) is the thing that may link or configure.” For links: the link is a property of the **selected placed object** and **policy** (object family, host scale, linked target type/scale, one-link-per-cell / one-link-per-object rules).

**Anti-pattern:** A **single** “cell selection” branch that **conditionally** mounts generic linked-location UI (`Linked location`, `Link location`, “Choose an existing location…”) teaches “**the cell** links to a location” instead of “**this placed object** links,” blurs **ownership**, and pushes implementation toward **one panel + flags** (`showLinkOnlyWhenObjectSelected`, `isLinkableScale`, `selectedObjectMaybe`) instead of **distinct inspector modes**. Separately: **per-type** placed-object rails that each invent headings, badges, and id rows (**“Placed object”**, raw UUIDs) **drift** from a **shared** object-first model — Phase 4 **unifies** placed objects on one **template**.

## Core direction

The rail must **not** treat “**selected cell**” and “**selected object in a cell**” as the **same editing surface**. They may share **layout chrome** (Selection tab, section spacing), but they are **different inspector modes** with **different ownership** of copy and actions.

**All placed authored objects** should render through a **shared rail inspector template** — one **object-first** backbone for **cell** and **edge** placements and for **future** placed kinds that follow the same model. **Object identity** is primary; **placement details** and **metadata** follow in a **consistent order**. **Edge** objects such as doors/windows use the **same** template as **cell** objects; **edge** placement context occupies the **placement** slot — they do **not** get a separate “edge/run-style” presentation model. Differences between object types come from **metadata rows**, **actions**, and **policy**, not from **unrelated** inspector layouts per type.

---

## Shared placed-object rail template (normative)

### Decision

**Every** placed authored object — **cell** objects, **edge** objects, and **future** placed kinds that adopt this selection-rail model — uses the **same inspector template shape**. **`CellObjectInspector`** and **`EdgeObjectInspector`** are **not** an excuse for two different ad hoc rails; they are **dispatch / data** distinctions on top of a **shared shell**. Tables, buildings, cities, doors, windows, stairs, etc. **all** follow one **structural rhythm**; variance is **content**, not a **different layout system** per family.

### Template backbone (shared structural rhythm)

All placed-object inspectors follow this **order** (labels and density are **curated**, not dump-all):

```text
{Category label}
{Object label}
{Placement details}
{Curated key/value metadata}
{Label — freeform text input when unlinked; see below}
{Object-specific actions when relevant}
Remove from map
```

- **Category label** — e.g. Furniture, Structure, … (registry- or product-driven grouping; user-meaningful).
- **Object label** — primary type identity (**Table**, **Door**, **Building**, …); **not** a generic **“Placed object”** headline.
- **Placement details** — **generalized slot**: where the object lives on the map. **Cell** → e.g. `Cell 6,3`. **Edge** → e.g. `Edge perimeter:11,2|E`. **Later** placement kinds use the **same slot** for their placement context — do **not** hardcode the template around cell-only copy.
- **Curated metadata** — **user-facing** authored fields (e.g. `Material: wood`, `Form: single-leaf`, `Kind: residential`). **Not** the default home for internal ids, raw `familyKey` / `variantId`, or resolver/debug strings — see **Move away from** and **Default rail must not surface implementation details** below.
- **Label (placard label)** — **below** curated metadata, **above** object-specific actions and **Remove from map**. **Unlinked** object → show the **freeform Label** text input (author-facing placard label). **Linked** object → **hide** the freeform Label field; use the **linked entity’s title/name** as the **display identity** for the object (so authors see the real linked name, not a duplicate freeform field). Exact placement of that title (e.g. reinforcing the object line vs a dedicated line) is a **refinement** — the rule is: **no** freeform Label when linked; **linked name** is the identity surface.
- **Object-specific actions** — e.g. **Link building**, **Link city**, stairs pairing, future door/window config — **plug into** this template (same shell), not a **separate** full layout per type.
- **Remove from map** — part of the **shared** placed-object template for **all** placed objects. **`CellInspector`** (empty cell) **does not** include this destructive action; remove belongs to **placed-object** selection only.

### Default rail must not surface implementation details

The **standard** author-facing placed-object rail **does not** default to **internal object id**, raw **family key**, raw **variant id**, or **resolver/debug** implementation details. Those belong in **curated** labels when user-meaningful, in **fallback** copy when persistence is lossy (see **Coarse edge persistence** risk), or in a **non-default** diagnostic surface — **not** as the primary inspector body.

### Move away from (current anti-patterns)

Today, some placed-object rails resemble:

- Generic **`Placed object`** as the headline
- Redundant **type** badges when the title already identifies the object
- **`Label`** paired with raw **`id: &lt;uuid&gt;`** as **default** content, or Label in the **wrong** order relative to identity/metadata

Phase 4 direction: **object identity** via **category + object label**; **metadata** is **curated authored** metadata; **Label** is **preserved** as a **freeform** field **below** metadata when the object is **unlinked**; when **linked**, **hide** freeform Label and show the **linked entity’s title/name** as display identity. **Raw UUIDs** and **debug** identifiers are **not** part of the **default** author-facing rail. If internal ids are ever needed (support, diagnostics), treat that as a **separate** surface — **not** the standard template.

### Architectural preference

**Discourage** a model where **each object type invents its own full rail layout.**

**Preferred:** a **shared placed-object inspector shell / template** with **type-specific** metadata rows and action blocks **composed into** that shell — aligned with **shared + type-specific** composition (not a monolithic switchboard, not **fully bespoke** per-object rails).

### Examples (illustrative — same template, not one-off layouts)

```text
Furniture
Table
Cell 6,3
Material: wood
Shape: rectangle

[ Label — freeform text input ]

Remove from map
```

```text
Structure
Door
Edge perimeter:11,2|E
Orientation: vertical
Form: single-leaf

[ Label — freeform text input ]

Remove from map
```

```text
Structure
Building
Cell 4,8
Kind: residential

Oakridge Hall

Link building
Remove from map
```

*(Linked building: **no** freeform Label field; **Oakridge Hall** = linked entity **title/name** as **display identity** — illustrative.)*

---

## Inspector ownership (normative)

Three **named** inspector modes. Implementation may use components named below or equivalent; **responsibilities** are fixed.

### A. Empty-cell inspector (`CellInspector`)

**Use when:** selection is the **map cell itself** with no placed cell-object in focus (or product defines “empty cell” precisely for this mode — align with `mapSelection`).

**Owns:**

- Coordinates
- Host map / floor context
- Terrain / region / cell metadata as applicable
- Lightweight cell-level affordances
- Optional **add/insert** affordance if product still wants it at cell scope

**Does not own (by default):**

- Object-specific linking
- Object-specific config
- Generic **`Linked location`** / **`Link location`** blocks

### B. Placed cell-object inspector (`CellObjectInspector`)

**Use when:** a **placed authored object in a cell** is selected (marker, table, stairs, treasure, linked-content families, etc.).

**Owns:** the **shared placed-object rail template** — **category**, **object label**, **placement details** (cell slot), **curated metadata**, **Label** (freeform when **unlinked**; **linked** → hide Label, show **linked entity title/name** as display identity), **object-specific actions**, **Remove from map**. Same **structural rhythm** as **EdgeObjectInspector**; only **placement** and **data** differ.

- Object identity (**Building**, **City**, **Site**, … from registry / persisted kind) via **category + label**, not generic **“Placed object”**
- **Object-scoped linking** when policy allows — copy must be **specific**, e.g. **`Link building`**, **`Link city`**, **`Link site`**, driven by **family + host scale + linkedScale** rules — **plugged into** the shared template

This is the **primary home** for linked-content configuration tied to **cell-anchored** placeables.

### C. Placed edge-object inspector (`EdgeObjectInspector`)

**Use when:** an **authored edge** object is selected (door, window, wall segments as objects if modeled, edge runs).

**Owns:** the **same shared placed-object rail template** as **`CellObjectInspector`**. **Doors/windows** do **not** get a separate edge/run presentation model — they use the **same** backbone; **edge** placement fills the **placement details** slot (e.g. perimeter / anchor), with orientation / segment count as **metadata** or secondary lines, not a different layout.

- Object identity (**Door**, **Window**, …) — **registry-first**, not geometry-first; **not** a second inspector paradigm
- **Label** — **same** slot and **linked/unlinked** rules as **CellObjectInspector** (freeform **below** metadata when **unlinked**; **linked** → hide freeform, show **linked entity title/name** when product attaches a link with display identity)
- Object-specific actions/config (Phase 4+ as persistence allows) — **composed into** the shared template

**Does not:** Lead with Draw-flavored **“Vertical … run”**, redundant **kind** badges when the title already states **Door**/**Window**, or **“1 segment on this straight run”** as the **primary** identity line. See **Shared placed-object rail template** and **Desired UX examples** below.

---

## Target dispatch architecture

**Intent:** Selection rail dispatch maps **discriminated selection** to **one** of three inspectors — **not** one `CellSelectionPanel` with boolean gates.

Conceptual mapping (TypeScript shape is **illustrative**; align names with `LocationMapSelection` / `gridDraft.mapSelection` in code — may require **evolving** the selection union or a **pure adapter** from current shapes):

```ts
// Illustrative — goal: explicit dispatch, not one "cell" branch + flags.
selection.type === 'empty-cell' -> CellInspector
selection.type === 'cell-object' -> CellObjectInspector
selection.type === 'edge-object' -> EdgeObjectInspector
```

**Migration note:** Today’s code may use `type: 'cell' | 'object' | 'edge' | …` with different semantics. Phase 4 **implements** the **ownership** above and the **shared placed-object template** for **`object`**, **`edge`**, and **`edge-run`** presentations as applicable; whether that is a **new discriminant** (`empty-cell` vs `cell` + object id) or **adapter logic** in the dispatcher is an **implementation choice** — but the **outcome** must be: **no** default generic link UI on **empty-cell** mode; **linking** and other object actions on the **placed-object** template when policy allows; **all** placed objects share **one** template shape.

---

## Why unambiguous ownership matters (beyond copy)

If the same generic “link a location” block appears for **both** empty cells and placed objects:

- Users learn the wrong mental model (**cell** vs **object**).
- **Product policy** (which families link, which scales) is harder to enforce in one generic branch.
- **Implementation** drifts to flag soup and **Phase 4’s object-first model** becomes harder to land.

This is **organizational / structural UX debt**, not only string polish.

---

## Desired UX examples (reference)

Examples below follow the **Shared placed-object rail template** — they are **one** pattern, not three different inspector layouts.

### Empty cell (`CellInspector`)

Show: **`Cell`**, coordinates, host map/floor context; optional lightweight insertion affordance. **No** **Remove from map** (nothing placed).

Do **not** show by default: generic **`Linked location`**, **`Link location`**, or “choose an existing location…” for an unfilled cell.

### Selected building (city map)

Same template as other placed objects — e.g. **Structure** / **Building** / **Cell 4,8** / metadata / **linked** display-name (no freeform Label) / **`Link building`** / **Remove from map** — not a one-off “building-only” rail structure.

### Selected city (world map)

Same template — **City** identity, placement, metadata, **`Link city`**, **Remove from map**.

### Selected door (edge object)

**Same** template as a **table** or **building** — **not** a separate edge/run rail. Illustrative (unlinked — **Label** field **below** metadata):

```text
Structure
Door
Edge perimeter:11,2|E
Orientation: vertical
Form: single-leaf

[ Label — freeform text input ]

Remove from map
```

Do **not** lead with: **`Vertical Door run`**, a redundant **`door`** badge when the title is already **Door**, or raw **edge ids** in the default author-facing block.

---

## Selection surfaces summary (quick reference)

| Mode | Inspector | Template / notes |
|------|-----------|------------------|
| Empty cell | `CellInspector` | **No** default generic link UI; **no** **Remove from map** |
| Placed cell-object | `CellObjectInspector` | **Shared placed-object template**; **Link &lt;type&gt;** etc. when policy allows |
| Placed edge-object | `EdgeObjectInspector` | **Same shared template** as cell objects; **placement slot** = edge context; no Draw-**run** headline |

**All placed objects:** **One** template shape — **category → object label → placement details → curated metadata → Label (unlinked only; linked uses target title/name) → actions → Remove from map**. **Edge** objects are **not** a second presentation model.

**Implementation touchpoints:** shared **placed-object shell** + composed rows/actions; `components/workspace/rightRail/selection/` (**`LocationMapSelectionInspectors.tsx`**), **`locationEditorRail.helpers.ts`**, evolution of **`LocationMapObjectInspector`** / **`LocationMapEdgeInspector`** / **`LocationMapEdgeRunInspector`** toward the **same** backbone. Preserve **`gridDraft`** and **state ownership** per `location-workspace.md`.

**Intentionally open:** exact component split (**one** `PlacedObjectInspectorRail` vs shared layout wrapper vs route-specific thin shells); how **`edge-run`** collapses into the template while preserving remove semantics; where **debug** ids live if ever exposed.

---

## Post-build cleanup pass (Phase 4 follow-up)

**Purpose:** After the first Phase 4 implementation landed, a **focused cleanup pass** addresses **inspector behavior**, **reduces hand-maintained metadata mapping** where possible, and **documents** any remaining architecture tension between **authored edge objects** (doors/windows from the registry) and **legacy wall / draw / edge-feature** modeling (`LOCATION_EDGE_FEATURE_KIND_META`, run language, `edge-run` assumptions).

**Scope:** **Not** a redesign of the whole wall/edge system or future vector-wall state — **stop drift** toward a mixed “door/window object vs wall edge-run” presentation and align UI with the normative **shared placed-object template**.

### Problems observed (post-implementation)

1. **Door / edge-run inspector still geometry- or run-first** — Copy such as **“Straight run”**, **“1 segment on this straight run”**, and axis/orientation-as-headline reads like **edge geometry** or **Draw** semantics, not **object-first** (**Structure** / **Door** / placement / **variant** metadata). Duplicates geometry phrasing; **does not** surface **registry variant** presentation metadata (e.g. `material`, `form`) in the same way as cell objects.
2. **Table (and similar cell objects) — template incomplete** — Category / object / cell line may appear without **curated metadata rows**, so the **shared template** is only **partially** realized vs normative examples (**Material**, **Shape**, …).
3. **Metadata not rendered for objects (first pass)** — **Variant `presentation`** (e.g. door: `material: 'wood'`, `form: 'single-leaf'`; table: `material`, `shape`) should appear as a **simple key/value list** after placement details and **before** the **Label** slot — without introducing **another large per-object registry** if avoidable.
4. **Empty-cell selection still shows generic add/link UI** — Selecting an **empty** cell still surfaces **linked locations** UI and **cell-object add/select** affordances on the **Selection** tab by default. **Desired:** empty-cell rail stays **cell context** (coordinates, terrain, region, host map/floor); **does not** default to **object linking** or **generic object editing** surfaces — align with **Inspector ownership** / **`CellInspector`**.
5. **Conceptual coupling: doors/windows vs wall / edge-feature model** — `LOCATION_EDGE_FEATURE_KIND_META` describes **wall**, **window**, **door** as **edge feature kinds** alongside **Draw** / boundary semantics. **Authored** registry objects (`door` / `window` **variants** with `presentation`) are the **product** model for placed edge objects. Risk: **implementation** continues to **conflate** these layers (run-first copy, wall-flavored meta) and **drifts** deeper into a **mixed** model. This pass should **either** apply a **small decoupling** in inspector code paths (registry-first shell for authored edge objects vs lighter geometry copy for pure wall segments) **or** leave an **explicit architectural note** + **smallest follow-up** recommendation — **not** a broad wall future-state implementation.

### Goals (normative for the cleanup pass)

**A. Object inspectors truly shared and object-first**

- **All** placed objects follow: **{Category}** → **{Object label}** → **{Placement details}** → **{Metadata list}** → **{Label / linked identity}** → **{Actions}** → **Remove from map**.
- **Edge-authored** objects use the **same** shell as **cell-authored** objects; **do not** use **run-first** wording as **primary** identity for doors/windows.
- **Geometry** (orientation, segment count, anchor detail) may appear as **secondary** lines or within **placement** metadata — **after** object identity and **variant** presentation rows — **not** duplicated (“1 segment” + “Straight run” + segment blurb).

**B. Metadata: prefer derivation over a new manual map**

- **First-pass:** derive **metadata rows** from the **resolved variant’s** `presentation` object (or equivalent structured bag on the variant), using a **small shared helper** (e.g. iterate known keys, **title-case** key labels, display values with optional **lightweight** string prettifying — see **Nice-to-have**).
- **Questions to answer in implementation:** Can the inspector build rows from **`variant.presentation` directly**? If formatting is needed, keep it in **one shared formatter** (e.g. `formatPresentationMetadataRows`) — **not** a parallel **per-object metadata config map** unless product later requires it.
- **Suggested location:** a **shared helper** under `rightRail/selection/` (or `domain/presentation/` if reused beyond React) imported by **both** cell- and edge- **placed-object** inspector paths.

**C. Label field consistent**

- **All** placed objects that use the shared template support the **Label** slot per existing rules (**unlinked** freeform **below** metadata; **linked** hide freeform, show **linked entity** title/name). **Edge** objects are **not** excluded **only** because they are edge-authored — **wire through `PlacedObjectRailTemplate`** (or equivalent shell).

**D. Empty-cell selection rail boundary**

- **No** generic **Linked location** / **Link location** block by default on **empty** cell.
- **No** **cell-object add/select** block on the **Selection** tab by default for empty cell. If **add-object** affordances remain product-required, **relocate** to another surface (e.g. tools/palette/canvas), **not** the empty-cell **Selection** inspector — **unless** explicitly scoped as a deliberate **optional** line in **`CellInspector`** (product decision).

**E. Edge-feature / wall coupling — audit**

- Inspect whether **door/window** inspectors still **lean too heavily** on **wall** edge-feature meta, **draw/run** language, or **`LocationMapEdgeRunInspector`** assumptions for **authored** registry objects.
- **Acceptable outcomes:** (1) **Small cleanup** — e.g. registry-first data path for door/window **identity + presentation**, geometry copy demoted; or (2) **Short explicit note** in PR/summary: what coupling **remains**, why, and **minimal** next pass — **without** redesigning **wall** topology or **vector** future-state.

### Implementation guidance (cleanup)

1. **Shared object inspector shell** — The **same** **`PlacedObjectRailTemplate`** (or successor) **owns** category, object label, placement, metadata rows, Label, actions, remove; type-specific content **composes** in slots.
2. **Placement details slot** — Generalized: **cell** → `Cell x,y`; **edge** → humanized **edge** line (e.g. **Edge between …** / **Edge perimeter …**) — **not** run-centric naming as **primary** identity for authored doors/windows.
3. **Metadata formatting** — Simple **Key: value**; title-case keys; raw-ish values acceptable; optional prettify (see below).
4. **Remove** — **Remove from map** remains on the **shared** placed-object template for all placed objects.

### Deliverables (cleanup pass)

- Inspector cleanup so **door** and **table** (and other placed objects using the shell) **match** the shared template: **object-first**, **metadata** from **presentation**, **Label** where applicable.
- **Empty-cell** Selection tab: **no** default generic **link** / **add-object** UI (per **D**).
- **Architectural note:** coupling between **authored edge objects** and **edge-feature / wall** model — **small fix** or **documented** residual + follow-up.
- **Tests** adjusted or added for: metadata rows, empty-cell rail, dispatch still correct.

### Nice-to-have (low risk only)

- Slightly nicer **value** display: e.g. `single-leaf` → `single leaf`, `stained_glass` → `stained glass` — **only** if implemented as a **tiny** shared **value prettifier** used by the presentation-row helper (**no** new mapping table per object type).

### Relation to other sections

- Reinforces **Shared placed-object rail template**, **Inspector ownership**, **Guardrails** (identity before geometry; no run-first for placed edge objects with registry identity).
- **Coarse edge persistence** risk unchanged — cleanup **does not** require variant on the wire; **resolver/default variant** may still drive **presentation** when persisted identity is lossy (document **fallback** in UI if needed).
- Sequenced in **[location_workspace_object_authoring_phase4_build_plan.md](location_workspace_object_authoring_phase4_build_plan.md)** as **M8**.

---

## Roadmap context

| Phase | Focus |
|-------|--------|
| 1–2 | Palette, variants, resolver-only wire for cell objects |
| 3 | **`placementMode`**, Place edge + shared `applyEdgeStrokeToDraft`, Draw wall-only edges, minimal selected-edge rail |
| **4** | **Config and editing** — this document |

---

## Expected direction (to refine later)

- **Rail** as the primary **post-placement** inspection/editing surface — **`CellInspector`** vs **placed-object** inspectors; **`CellObjectInspector`** and **`EdgeObjectInspector`** share the **same** **shared placed-object rail template** (see **Shared placed-object rail template**); see **Target dispatch architecture**.
- **All placed authored objects** render through that **one** template; **object identity** primary; **placement details** generalized (cell / edge / future); **curated** metadata; **Label** **below** metadata (**freeform** when **unlinked**; **linked** → **linked entity title/name**, no duplicate freeform field); **geometry** and internal ids **not** in the default author-facing block.
- **Object-specific** actions and config — **composed into** the shared template (**Link building**, stairs, future door/window fields), not a **separate full layout** per type — **shared shell** + **type-specific** rows/actions, not one giant switchboard.
- **Door/window** entities support **meaningful** authored state beyond placement alone — which **implies** deciding how that state **serializes** (extend `edgeEntries` row shape vs adjunct map vs other) because **Phase 3 does not** persist registry variant or instance state on the edge wire.
- **Stairs** support **linking/edit** workflows vs static props-only treatment.
- **Richer metadata** flows through **structured** authored config and **persistable** draft rules (`location-workspace.md`), not UI-only buffers.

---

## In scope (placeholder level)

- **Shared placed-object rail template** — **all** placed cell and edge objects (and future placed kinds) use the **same** backbone: **category → object label → placement details → curated metadata → Label (freeform if **unlinked**; if **linked**, hide Label and surface **linked entity title/name** as display identity) → object-specific actions → Remove from map**; **no** generic **“Placed object”** headline, **no** default raw UUIDs / internal ids, **no** redundant type badges when identity is already clear
- **Explicit inspector ownership** — **`CellInspector`** (empty cell only; **no** **Remove from map**); **`CellObjectInspector`** / **`EdgeObjectInspector`** = **same template**, different placement slot and data; dispatch per **Target dispatch architecture**; **no** single cell branch + generic link flags
- **Edge / edge-run inspector** evolution — fold into **shared placed-object** presentation: **registry** identity (`Door`, `Window`), drop Draw-flavored “run” / axis-in-title **and** redundant kind **badges**; orientation, anchor, segment count as **metadata** / detail within the template — **not** a separate “edge/run” layout paradigm
- Rail edits for **placed** authored objects (cell + edge)
- **Selected-object** inspection model — **unify** patterns for cell objects vs **`edgeId` + kind** edges (family inference from kind where variant is absent)
- **Persistence design fork** for edge instances: additive fields on `edgeEntries` (or agreed alternative) if **variant** or **door/window instance state** must round-trip — **explicit migration + normalization policy** per `location-workspace.md`
- **Door/window** state editing direction (open/closed, locks, etc.) — **authored** scope first; mechanics coupling only where product locks it
- **Stairs linking** workflows and authored shape (unchanged intent)
- **Richer** authored object metadata / behavior (incremental)
- **Documentation** — update **[docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)** so the **canonical** workspace reference stays aligned with Phase 4: Selection rail / inspector ownership (**`CellInspector`** vs placed-object inspectors), **shared placed-object rail template**, `gridDraft` / selection behavior, debounced persistable patterns, and **Adding persisted workspace state** (or equivalent sections) when new persisted fields or normalization rules ship. **Not** a full unrelated docs rewrite — **targeted** updates tied to Phase 4 deliverables.
- **Post-build cleanup pass** — **object-first** door/window rails vs **run** copy; **`variant.presentation`** metadata rows via a **small shared helper**; **Label** on **edge** placed objects; **empty-cell** Selection tab **without** default generic **link** / **add-object** UI; **audit** of **edge-feature / wall** vs **authored registry** edge objects (**note** or **small decoupling**). See **Post-build cleanup pass (Phase 4 follow-up)**; build plan **M8**.

---

## Out of scope (for now; re-validate when refined)

- **Complete** redesign of all workspace rails/panels
- **Broad** narrative or **runtime simulation** for every object type
- **Full** gameplay automation for doors/stairs beyond **authored config** needs
- **Map geometry** or unrelated **dirty/save** architecture reopen
- **Solving every future object family** in one pass
- **Hex edge** authoring/editing parity — unless Phase 4 is explicitly expanded after a hex edge design pass (Phase 3 left this non-assumed)

Focus: **post-placement authoring/editing**, not the entire **runtime** model.

---

## Dependencies on earlier phases

| Phase | Provides for Phase 4 |
|-------|----------------------|
| **1** | Registry, toolbar/rail split, loaded placement, palette flow |
| **2** | **`familyKey` + `variantId`**, resolver-only cell wire, **`defaultVariantId`**, picker UX patterns |
| **3** | **`placementMode`** (`cell` \| `edge`), **`door` / `window`** registry families (`allowedScales: ['floor']`), **`resolvePlacementEdgeFeatureKind`** / **`resolvePlacedKindToAction`** edge branch, **shared** edge draft commit (`applyEdgeStrokeToDraft`), **Draw** edges **wall-only** on floor, **minimal** `LocationMapEdgeInspector`, **square-first** Place edge (hex not in scope) |

Do **not** recreate placement or edge foundations here. Phase 4 **extends** inspectors and, when needed, **wire shape** — with **explicit** migration and **`LOCATION_WORKSPACE_NORMALIZATION`** updates if new persisted fields are introduced.

---

## Risks, open design decisions, and gaps

This section separates **delivery hazards** (risks), **choices to resolve before or during implementation** (open design decisions), and **known constraints / intentionally deferred work** (gaps). Items that were previously mixed under “risks” are reclassified here.

### Risks

These are **true implementation risks** — hazards that can derail delivery or reintroduce structural debt if not handled explicitly.

#### Inspector ownership debt until dispatch changes land

The rail still carries **structural debt** until **selection dispatch** and **mounted panels** align with the three-inspector model (`CellInspector` / `CellObjectInspector` / `EdgeObjectInspector`). The old **single cell panel with flags** anti-pattern remains a **real delivery hazard** until `LocationEditorSelectionPanel`, `LocationCellAuthoringPanel`, and related branches actually dispatch that way in code — **plan text alone does not remove it**.

#### Coarse edge persistence / lossy edge object identity

**`edgeEntries`** remain coarse on the wire (**`kind`-only**; no `familyKey`, `variantId`, or instance fields). Doors and windows **do not round-trip** full registry identity. Phase 4 editing may need to inspect or select objects whose persisted edge wire **cannot reconstruct** the originally authored variant. Any **richer persisted** edge editing implies additive wire, migration, dirty/snapshot participation, and compatibility behavior. **Phase 4 must not accidentally assume** edge variants or full identity already persist.

**Lossy identity:** selected edge-object identity may be **lossy** under current persistence. The inspector may **not** always truthfully reconstruct the originally authored variant from persisted wire alone. Phase 4 must define **fallback UI** for **unknown variant**, **ambiguous family mapping**, and **legacy edge rows** with coarse identity only.

#### Scope creep into runtime or broad rail redesign

Phase 4 can easily collapse into **runtime/gameplay** work or a **broad rail** redesign. Keep guardrails explicit: **authored config and editing only**; **no silent** combat / line-of-sight / runtime semantics changes; **no broad inspector-shell rewrite** unless deliberately scoped.

#### Stairs ownership split

**`useLocationEditBuildingStairHandlers`** and object inspectors can **duplicate or conflict** unless Phase 4 explicitly chooses one ownership model. Phase 4 should decide whether inspectors **extend** the existing stair handler path or **delegate** into it — avoid a **parallel** stair editing path in inspectors without a deliberate split.

---

### Open design decisions

These are **important unresolved choices**, not delivery hazards in the same sense as **Risks** above. Resolve them during Phase 4 design or early implementation.

#### Selection dispatch shape

Decide whether Phase 4 should: **keep** the current `LocationMapSelection` union and add an **adapter** layer to inspector modes; **evolve** the union with new discriminants; or **rename/repurpose** current branches. Consider **`mapSelectionEqual`**, persistable behavior, and **call-site churn**.

#### Cell inspector vs current `type: 'cell'`

Today **`type: 'cell'`** already maps to **`LocationCellAuthoringPanel`**. The immediate question is not necessarily the type shape alone, but **what that panel is allowed to show** (e.g. no default generic link on empty cell). Decide whether Phase 4 can achieve the desired object-first rail model **primarily through panel and dispatch boundaries** before changing the selection union.

#### Edge-object inspector vs `edge` vs `edge-run`

Decide implementation wiring: **one** placed-object rail component with modes vs **thin** wrappers — but **not** a second presentation model. **`edge`**, **`edge-run`**, and **placed edge features** should still render through the **shared placed-object template** (same shell as cell objects); **placement** and **metadata** adapt. Resolve how **`edge-run`** collapses into the template (e.g. primary segment / anchor) while **Remove from map** semantics stay correct. **Tone** remains **object-first**, not run-first.

#### Walls vs door/window edge inspector emphasis

Edge selection UI may need **different emphasis** for **wall-like** boundary/geometry selections vs **authored edge features** (door/window). **Authored features** still use the **shared placed-object template**; **walls** may stay lighter or geometry-forward — decide copy and actions **without** giving doors/windows a **second layout paradigm**. **Placement** slot still generalized (edge context). After first implementation, the **Post-build cleanup pass** revisits **coupling** between **`LOCATION_EDGE_FEATURE_KIND_META`** / **draw/run** copy and **registry** door/window **variants** — see **Post-build cleanup pass (Phase 4 follow-up)** and build plan **M8**.

#### First-pass door/window editable state

Product/design: what Phase 4 **first ships** (open/closed, locked, secret, style/material) vs what stays **deferred**. Any field that must round-trip requires a persistence decision (see **Gaps / deferred** and **Coarse edge persistence** risk).

#### Shared vs type-specific inspector composition

**Shared placed-object shell** (template backbone) vs **plugins** for metadata rows and actions — folder split, component names, and **composition** strategy remain to be chosen. **Discourage** each object family shipping a **fully bespoke** rail; **prefer** shell + composed rows. Keep this visible as design work, not as a standalone “risk” label.

#### Richer authored metadata

Labels, subtype, footprint, flags — **structured** slots vs generic bags (incremental; align with **In scope** richer metadata).

#### Placard **Label** vs linked display identity

**Normative** in **Shared placed-object rail template**: **unlinked** → freeform **Label** **below** metadata; **linked** → hide freeform **Label**, show **linked entity title/name** as display identity. **Open refinement:** exact typography/placement of the linked name (e.g. replaces a line vs subtitle) per object family — **rule** is fixed, **layout nuance** can vary slightly inside the shared shell.

---

### Gaps / deferred

Honest constraints: **not yet designed**, **out of scope**, or **missing deliverables** — distinct from “risk” and “open choice” where helpful.

#### Persistence redesign not yet committed

No committed design yet for **where** richer edge instance data or variants would live (**`edgeEntries` extension** vs **adjunct** structures, etc.). Remains **deferred until execution**; see **Coarse edge persistence** risk when editing requires persistence.

#### Hex parity out of scope

Hex edge authoring/editing remains **out of scope** unless separately designed and Phase 4 is explicitly expanded. Do **not** imply near-term parity without an approved hex edge design.

#### Test gap

Tests that prove **which inspector mounts for which selection** do not exist yet. This is a **real missing deliverable** for Phase 4; it supports closing the **Inspector ownership debt** risk but is listed here as a **gap**, not a core architectural risk by itself.

#### Audit gap

A **current-state audit** of Selection rail branches per `mapSelection` vs target inspectors may be called for in refinement output; that audit is still a **planning artifact**, not necessarily completed in-repo yet.

#### Region / path / `none` remain parallel concerns

The **empty-cell / cell-object / edge-object** framing must **not** accidentally absorb **region**, **path**, or **`none`** selection work. Those remain **parallel concerns** unless explicitly brought into Phase 4 scope later.

---

### Note on classification (after this pass)

- **Monolithic rail / per-type logic** — treated primarily as **composition strategy** under **Open design decisions** (shared vs type-specific). The remaining hazard is **scope creep** if a rewrite balloons beyond scoped work.
- **Save/draft / snapshot participation** for new fields — follow **Guardrails** and **Adding persisted workspace state** in `location-workspace.md`; this is an **operational pattern**, not a strategic risk if existing hooks are used consistently.
- **Stairs-linking UX complexity** — split between **Stairs ownership split** (risk: parallel paths) and **Open design decisions** / **In scope** (authored workflow shape).

---

## Guardrails (when refined)

### Do

- Treat selected authored objects as **first-class editable** entities — **identity before geometry**
- **Rail** as primary **post-placement** editor surface; **shared placed-object template** for **all** placed objects; **`CellInspector`** separate — do not fold **empty cell** and **placed object** into one **cell** panel with flags
- **Category + object label + placement details + curated metadata + Label (unlinked) / linked display name + actions + Remove from map** as the **common rhythm** for every placed object
- **Label** field: **below** curated metadata; **unlinked** → freeform **Label** input; **linked** → **hide** freeform **Label** and surface the **linked entity’s title/name** as display identity (not both)
- Offer **linking** copy and actions **on the placed object** when supported (specific link type: city, building, site, …) — **composed into** the shared template
- **Structured** authored config; **preserve** data integrity
- Respect **state ownership** and **debounced persistable** patterns

### Do not

- Reopen **palette/placement** unless unavoidable
- **“Everything editable”** blanket redesign
- **Runtime/gameplay** implementation beyond **authored config** scope — respect Phase 3 **semantics guardrail** for `blocksMovement` / `blocksLineOfSight` / `combatCoverKind` unless a **dedicated** mechanics change is scheduled
- **Overcommit** every object family in one phase
- **Rebuild** the whole rail without a **shared placed-object shell** + **type-specific** composition strategy
- Lead with generic **“Placed object”**, **redundant** type badges when the **title** already identifies the object, or **raw UUIDs / internal ids** in the **default** author-facing inspector (move debug/diagnostics elsewhere if needed)
- **Assume** **family + variant** are recoverable for **placed** door/window edges without **persistence design** — Phase 3 inspector copy already states variant is not on the wire
- Use **geometry-first** titles or **Draw**-flavored **“run”** language for **placed edge objects** when the object has a clear registry identity (**Door** / **Window**)
- Give **doors/windows** or **tables** a **wholly different** inspector layout instead of the **shared** template — differences belong in **metadata** and **actions**, not a second rail paradigm
- Default **generic** cell linking UI on **empty** cells when product intent is **object-scoped** linking only
- **Single** `CellSelectionPanel` (or equivalent) that toggles **linking** via **`showLinkOnlyWhenObjectSelected`**-style flags instead of **routing** to the **placed-object** inspector
- Show **freeform Label** for **linked** objects — **hide** it; **linked entity title/name** is the display identity (**not** both)

---

## Suggested output shape (future refinement)

- Objective; why Phase 4 is last among the four
- Current-state **audit** (including **Selection** rail branches per `mapSelection` vs **target** `CellInspector` / `CellObjectInspector` / `EdgeObjectInspector`)
- **Inspector ownership** + **dispatch architecture** (this plan)
- **Shared placed-object rail template** + **selected-object** model
- **Shared shell** vs **type-specific** rows/actions (composition)
- Door/window **state** direction
- Stairs **linking** direction
- Richer **metadata/config** direction
- **Risks**; **open design decisions**; **gaps / deferred** (this document)
- Guardrails
- **location-workspace.md** updates (see **In scope**)
- **Acceptance criteria**

---

## Acceptance criteria (this placeholder)

This placeholder is **complete** when:

1. Phase 4 is **named** and **scoped** at a high level.
2. **Goals** and **dependencies** on Phases **1–3** are documented — including **Phase 3 concrete** outcomes (`placementMode`, coarse `edgeEntries`, resolver-only variant for edges, minimal edge inspector).
3. **Door/window states** and **stairs linking** are **explicit** core concerns, and **edge wire / variant persistence** is flagged as a **Phase 4 design** item where needed.
4. **Post-placement editing** is distinct from **placement** phases.
5. **Selection rail model** is explicit: **`CellInspector`** vs placed-object inspectors (**`CellObjectInspector`** / **`EdgeObjectInspector`**); **shared placed-object template** for **all** placed objects (cell + edge + future); **generalized placement details** slot; **Label** **below** metadata (**freeform** when **unlinked**; **linked** → hide freeform, **linked entity title/name** as display identity); **no** default generic link on empty cell; **linking** and object actions on the **placed-object** template when policy allows; **no** default raw ids / **“Placed object”** / redundant badges in the normative doc.
6. **Problem** (mixed ownership / single branch + flags) and **why it matters** are **documented** — not only UX examples.
7. The doc stays **high-level** for later refinement (exact `mapSelection` evolution TBD) — but **does not contradict** Phase 3 **locked** decisions (single registry, resolver ownership, no variant on wire until a migration phase).
8. **[location-workspace.md](../../../docs/reference/location-workspace.md)** is explicitly **in scope** to update alongside Phase 4 implementation so the canonical reference matches the shipped inspector model, shared template, and persistable workspace rules.

---

## Related

- [location_workspace_object_authoring_phase4_build_plan.md](location_workspace_object_authoring_phase4_build_plan.md) — **implementation build plan** (milestones, sequencing, file map).
- [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md) — prior phase.
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) — parent roadmap.
- [.cursor/plans/location-workspace/README.md](README.md) — plan bundle index.
- [location_workspace_cleanup_94269d45.plan.md](../location_workspace_cleanup_94269d45.plan.md) — session vs domain split; [location-workspace.md](../../../docs/reference/location-workspace.md) **State ownership** and **Imports and barrels**.
