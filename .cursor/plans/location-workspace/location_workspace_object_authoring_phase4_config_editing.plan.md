---
name: Object authoring Phase 4 — config and editing
overview: Post-placement config/editing with **explicit inspector ownership** and a **single shared placed-object rail template** for **all** placed authored objects (cell- and edge-anchored): **CellInspector** (empty cell only); **CellObjectInspector** / **EdgeObjectInspector** share the **same structural rhythm** (identity → placement → metadata → **Label** slot: freeform if **unlinked**, linked **title/name** if **linked** → actions → remove). Not “selected cell” vs “object in cell” as one surface. Door/window state, stairs, metadata, wire migrations. Map `gridDraft.mapSelection` to modes (may evolve discriminant). **Post-build cleanup pass** (follow-up): fix run-first door/window copy, restore **variant.presentation** metadata without a heavy manual map, consistent **Label** on edge objects, empty-cell rail boundary, and audit **edge features vs authored edge objects** — see **Post-build cleanup pass (Phase 4 follow-up)**. **Edge-authored object instances — modeling direction** defines long-term **persistence parity** for edge rows (`label`, authored identity overrides coarse `kind`, **discriminated** `state`, **`variantId` edge-first** with cell follow-up), **per-edgeId row** not run-group v1 — **normative**; implementation is staged — see that section. **Implementation risks, prerequisites, guardrails, and verdict** (same section) tightens **coordination risks**, **ready-to-build gates**, and **no partial truth split** guardrails for edge wire work.
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
  - id: edge-authored-instance-modeling-parity
    content: Implement staged edge row persistence + inspector hydration per Edge-authored object instances — modeling direction (label, authoredPlaceKindId, variantId, state); migration/fallback; docs — do not label-only patch in isolation
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

The **standard** author-facing placed-object rail **does not** default to **internal object id**, raw **family key**, raw **variant id**, or **resolver/debug** implementation details. Those belong in **curated** labels when user-meaningful, in **fallback** copy when persistence is lossy (see **Edge-authored** → **Implementation risks, prerequisites, guardrails, and verdict**), or in a **non-default** diagnostic surface — **not** as the primary inspector body.

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
- **Lossy edge identity** until wire lands unchanged — cleanup **does not** require variant on the wire; **resolver/default variant** may still drive **presentation** when persisted identity is lossy (document **fallback** in UI if needed); see **Edge-authored** → **Implementation risks, prerequisites, guardrails, and verdict**.
- Sequenced in **[location_workspace_object_authoring_phase4_build_plan.md](location_workspace_object_authoring_phase4_build_plan.md)** as **M8**.

---

## Edge-authored object instances — modeling direction (long-term parity)

**Purpose:** Stop treating edge-authored objects as an indefinite **hybrid** (object-style rail + coarse `edgeEntries` wire). Define the **intended persisted model** for **edge-authored instances** so they can reach **real parity** with **cell-authored** objects: shared **authored-instance** concepts, a **single home** for rich edge config, and a **safe migration** path from legacy `{ edgeId, kind }` rows.

**Normative intent:** **Not** a label-only quick fix; **not** more disabled shared-rail fields with caveats as the steady state; **not** UI-only parity without persistence parity. **Implementation is staged** (see **Recommended implementation sequence**); this section is the **contract** future work follows.

**Grounded current state (pre-parity):**

- **Cell** `LocationMapCellObjectEntry` already carries per-instance **`label`**, optional **`authoredPlaceKindId`**, and placement identity via **`id` + cell**.
- **Edge** `LocationMapEdgeAuthoringEntry` is still **`{ edgeId, kind }`** only — no instance label, no variant id, no typed instance bag on the row.
- Inspectors may derive **metadata** from **registry default variants** when authored identity does not round-trip — the **rail can be ahead of persistence** until this model lands.

---

### 1) Long-term edge-authored object row shape

**Goal:** An **edge row** represents both **where** on the boundary (`edgeId`) **and** **which authored instance** sits there (identity + optional placard label + optional rich state).

**Proposed normative shape** (refine names during implementation; keep concepts):

```ts
/**
 * Rich per-edge instance data — **discriminated union** (not a keyed bag): exactly one family per value.
 * Extend with new variants as more edge families gain typed instance state.
 */
export type LocationMapEdgeAuthoringState =
  | {
      v?: number;
      family: 'door';
      open?: boolean;
      lockState?: LocationDoorLockStateId; // align with facets / registry
      secret?: boolean;
    }
  | {
      v?: number;
      family: 'window';
      openness?: 'closed' | 'ajar' | 'open';
      treatment?: LocationWindowVariantId; // tighten to registry vocabulary when product locks
    };

export type LocationMapEdgeAuthoringEntry = {
  edgeId: string;
  /**
   * Coarse edge kind — **retained** for compatibility, render pipelines, migration, and cases where
   * authored identity is missing (legacy). When **`authoredPlaceKindId` / `variantId` are present**, resolution
   * **prefers authored identity** over inferring from `kind` alone — see **§3** and **§5**.
   */
  kind: LocationMapEdgeKindId;
  /** Placard / author label — parity with cell object `label`. */
  label?: string;
  /** Registry family id — parity with cell `authoredPlaceKindId` (`door`, `window`, …). */
  authoredPlaceKindId?: string;
  /**
   * Family-scoped variant id. **Edge may ship persisted `variantId` first**; adding the same field to
   * **`LocationMapCellObjectEntry`** is an explicit **follow-up** for symmetric wire parity — see **§2**.
   */
  variantId?: string;
  /** Single home for rich door/window (and future) edge instance config — discriminated — see above. */
  state?: LocationMapEdgeAuthoringState;
};
```

**Invariant:** **`state`** is always a **discriminated** value (`family: 'door' | 'window'` in this sketch); never both door and window payloads on the same object.

**First-ship persistence scope:** **Identity and `state` are stored per `edgeEntries[]` row** (per canonical **`edgeId`**). **Not** on an abstract **edge-run group** id in v1 — multi-segment runs are a **selection/UI** concern; each segment row carries its own fields (duplicate placement identity across a run if product applies one action to many segments, or edit per segment). A future **run-level** grouping or shared id is **out of scope** for first ship unless product revisits.

---

### 2) Shared-core parity model (cell vs edge)

**Parity of concepts**, not necessarily **identical row layout**:

| Concept | Cell object (`LocationMapCellObjectEntry`) | Edge object (`LocationMapEdgeAuthoringEntry`) |
|--------|--------------------------------------------|-----------------------------------------------|
| **Placement anchor** | `cellId` + object **`id`** in `objects[]` | **`edgeId`** (canonical segment id) |
| **Placard label** | `label?` | `label?` (same semantics when persisted) |
| **Authored family** | `authoredPlaceKindId?` | `authoredPlaceKindId?` |
| **Variant** | Today: no persisted **`variantId`** on cell wire — resolver-heavy; **follow-up** to add **`variantId?`** on **`LocationMapCellObjectEntry`** for symmetric parity with edge | **`variantId?` on edge row** — **edge may lead** first ship; cell wire catch-up is **explicit** (same field name/semantics when added) |
| **Rich instance config** | Today: `stairEndpoint`, future family-specific bags as needed | **`state?`** — **discriminated** door/window first |
| **Coarse legacy kind** | `kind` (`LocationMapObjectKindId`) | `kind` (`LocationMapEdgeKindId`) — wall vs door vs window |

**Shared domain language:** Reuse **`LocationPlacedObjectKindId`** (or stricter subset for edge) for **`authoredPlaceKindId`** where families align; reuse **normalization** patterns (`normalizeVariantIdForFamily`) for **`variantId`**. **Placement mode** (`cell` vs `edge`) remains the **anchor** difference; **authored-instance** fields align across modes once cell **`variantId`** exists.

**Cell parity note:** **`variantId` persistence on `LocationMapCellObjectEntry`** is a **deliberate follow-up** after edge proves the pattern — not a blocker to shipping edge-authored identity first.

---

### 3) Persisting authored identity on edge rows (`authoredPlaceKindId`, `variantId`)

**Recommendation:** **Yes** — new placements and saves should persist **`authoredPlaceKindId`** and **`variantId`** when the editor knows them, for the reasons given:

- Inspector **metadata** (presentation) should be **truthful** against saved state, not only **default-variant inference**.
- Future **rich editing** must not depend on **re-inferring** identity from coarse `kind`.
- Aligns with **cell** semantics and **registry** as source of vocabulary.

**Precedence (normative):** When **`authoredPlaceKindId`** and/or **`variantId`** are present, **authored identity wins** over inferring display and behavior from coarse **`kind` alone**. Use **`kind`** as fallback **only** when authored fields are absent (legacy), and for **lanes** that still key off coarse category (render, wall vs opening). **Conflicts** (e.g. mismatched `kind` vs `authoredPlaceKindId`) should be resolved by **normalization** favoring **authored** fields, with validation optionally flagging invalid combos.

**Contract:**

| Situation | Behavior |
|-----------|----------|
| **Legacy row** — only `{ edgeId, kind }` | **`authoredPlaceKindId` / `variantId` absent** — hydrate by **mapping `kind` → default family** and **default variant** where unambiguous (`door` → `door` family, etc.); document as **lossy** where `kind` alone is ambiguous (should be rare for door/window). |
| **New placement** (Place tool / resolver) | **Write** `authoredPlaceKindId` + **`variantId`** (and keep **`kind`** in sync for backward compatibility and render). |
| **Inspector / hydration** | **Authoring identity first:** use persisted **`authoredPlaceKindId` + `variantId`** for title + presentation when set; **else** fallback to `kind` + defaults for legacy; optional **non-blocking** caption or dev-only diagnostic when falling back (not a permanent disabled Label). |

**`kind` remains required** on the wire initially for **compatibility** with existing validation, map features, and wall/door/window discrimination — see **§5**.

---

### 4) Typed state / rich edge options — single home

**Recommendation:** **`state?: LocationMapEdgeAuthoringState`** on the **edge row** is the **primary home** for rich, editor-driven options (door open/closed, lock/barred, secret door, window openness, shutters, bars, glass treatment). **`state`** is a **discriminated union** by **`family`** (see **§1**) — not parallel optional keys.

- **Why not scatter:** Avoid parallel top-level fields per option; avoids special-case columns in validation and normalization.
- **Evolution:** Add new **discriminant variants** or fields inside each arm; bump **`v`** on that arm when breaking. Do not add a second door/window bag on the same value.
- **Relationship to registry:** **Presentation** (`variant.presentation`) remains **registry defaults**; **`state`** holds **instance overrides** for gameplay/authoring (open, locked, etc.). Product rules define precedence (e.g. instance `state` wins over variant defaults for locks).

---

### 5) Role of coarse `kind` (avoid ambiguity with authored identity)

**Intended contract:**

- **`kind`** (`LocationMapEdgeKindId`): **Stable coarse category** used by **legacy data**, **render/feature** pipelines, **Draw** (wall), and **quick filtering**. **Remains required** for the foreseeable future so old maps and minimal rows keep working.
- **`authoredPlaceKindId`**: **Registry family** for **authored-object** semantics; should **match** `kind` for door/window when both exist (`kind === 'door'` ↔ `authoredPlaceKindId === 'door'`). **When both are present and in tension, authored identity overrides** for **authoring and inspector** resolution; **normalization** may repair or reject invalid pairs.
- **`variantId`**: **Family-scoped** variant key; must be valid for **`authoredPlaceKindId`** when both set.

**Long-term:** **`kind`** may become **derivable** from **`authoredPlaceKindId`** for object-like edges, but **do not** remove **`kind`** lightly — walls and non-object edges still need it. **Rule of thumb:** **`kind`** = transport/render **lane** and **fallback** when authored fields are absent; **`authoredPlaceKindId` + `variantId`** = **authoring truth** when present and **take precedence** over coarse `kind` for identity and rail hydration.

---

### 6) Migration and compatibility strategy

**Incremental and safe:**

1. **Load:** Legacy `{ edgeId, kind }` **always** loads; optional fields default **absent**.
2. **In-memory normalization (optional):** May attach **inferred** `authoredPlaceKindId` / `variantId` **only in memory** for UI (not persisted) — useful for previews; **prefer** persisting on next save when editor mutates the edge.
3. **Persisted migration:** **Deferred** until an explicit **“normalize map”** or **save** path chooses to **backfill** rows; **no forced destructive** migration on load.
4. **Unknown / ambiguous legacy:** Inspector shows **coarse** identity + **fallback** presentation; **no** fake persisted values; copy can note **“Limited data on this edge — re-place or edit when supported”** if product wants transparency.

**Normalization policy:** Follow **`location-workspace.md`** **Adding persisted workspace state** and existing **`LOCATION_WORKSPACE_NORMALIZATION`** patterns when introducing new fields.

---

### 7) Wall / draw / edge-feature modeling — separation note

**Concern:** Doors/windows must not stay permanently **trapped** in a mixed **wall edge-feature + object inspector** model; **wall** geometry may later **not** be a vector line.

**Clarify:**

- **Shared:** **Boundary targeting** (`edgeId`), **sparse `edgeEntries`**, **kind** lane for **wall** vs **door** vs **window**, and **shared map draft** / selection.
- **Separated:** **Authored object instance** persistence (**label**, **authored identity**, **`state`**) applies to **registry edge families** (door/window); **pure wall** segments may stay **geometry-first** with **no** `authoredPlaceKindId` / **`state`** until product defines wall instance semantics.
- **Decouple:** **Edge geometry** (which segment, runs, draw strokes) is **not** the same layer as **authored object instance** data — persist instance fields **on the edge row** keyed by `edgeId`, not inside draw-tool-only structures. **Draw** remains a **tool** that **commits** to `edgeEntries`; **inspector** edits **instance fields** on those rows. **v1:** per-row only — **no** persisted run-group record; see **§1** first-ship scope.

---

### 8) Recommended implementation sequence

**Staged path** (adjust as dependencies land):

| Step | Scope |
|------|--------|
| **1** | **Define** richer **`LocationMapEdgeAuthoringEntry`** + **discriminated** **`LocationMapEdgeAuthoringState`** in **shared types**; **validation** + **docs** (`location-workspace.md`, this plan); **no** forced backfill. |
| **2** | **Persist** shared instance fields: **`label`**, **`authoredPlaceKindId`**, **`variantId`** on place/save paths; **dirty/snapshot** participation; **placement** writes full identity for new edges. |
| **3** | **Inspector hydration:** **prefer** persisted authored identity + variant for metadata and titles; **fallback** to `kind` + **default variant** for legacy; remove **disabled Label** / **misleading** caveats once **`label`** persists. |
| **4** | **First typed `state` fields** for door/window (minimal set — e.g. open + lock); rail editors bind to **`state`**. |
| **5** | **Cleanup:** reduce default-inference **warnings**, optional **backfill** migration tool, align **`LOCATION_EDGE_FEATURE_KIND_META`** usage so **registry** owns product copy for **authored** edges. |

**Why this order:** **Shape + persistence of identity** before **rich state** avoids painting editors into a corner; **hydration** before **heavy state** ensures the rail is **truthful**; **state** last avoids a second migration churn for identity fields.

**Explicit non-goals for an isolated quick fix:** **Do not** ship **label-only** on the wire without **`authoredPlaceKindId` / `variantId`** direction agreed — that would repeat the **hybrid** problem for **metadata** and **variant** truthfulness.

---

### Deliverables summary (this section)

- **Proposed row shape:** `LocationMapEdgeAuthoringEntry` with **`label?`**, **`authoredPlaceKindId?`**, **`variantId?`**, **`state?`** (discriminated), plus required **`kind`** for compatibility.
- **Shared-core parity:** Same **authored-instance** concepts as cell objects; **different anchors** (`edgeId` vs cell + object id). **`variantId` on cell** = explicit **follow-up**; **edge leads** first ship.
- **Contract:** **Authored identity overrides** coarse **`kind`** for hydration when present; **`kind`** = lane + legacy fallback; **`state`** = discriminated rich instance options; **per-edge row** persistence first — **not** run-group v1.
- **Migration:** Load legacy as-is; infer in memory optionally; persist on edit; no forced destructive migration.
- **Sequence:** Types/docs → persist identity → inspector hydration → typed state → cleanup.
- **Wall/draw:** **Targeting** and **`edgeEntries`** shared; **authored instance** data **separate** from pure wall/draw tool internals.

---

### Implementation risks, prerequisites, guardrails, and verdict

This subsection makes the **implementation contract** explicit: the long-term **model** is defined above; **remaining hazard** is **partial or uncoordinated delivery** (split-brain across writers, normalizers, inspector, render, and downstream readers). It complements the global **Risks** section — **edge-specific** coordination detail lives **here**; cross-cutting rail/scope/stairs risks stay **there**.

#### Risks

##### 1. Lossy edge identity until richer fields round-trip (top risk)

Until **`label`**, **`authoredPlaceKindId`**, **`variantId`**, and **`state`** are **actually persisted** and threaded through **save**, **dirty/snapshot**, and **reload**, edge-authored identity remains **lossy**. The normative row shape above is the **target**, not proof that the running app persists it.

**Inspector truth:** The Selection rail **must not** present authored identity, metadata, or labels **truer** than what **persisted rows** can round-trip. If the wire is still coarse, the UI must stay **honest** (fallback copy, lossy states) — **not** a richer editor façade over **`kind`-only** storage.

##### 2. Split-brain implementation / contract drift across writers and readers

**Not** generic “churn” — **concrete** failure modes to avoid in the same release train:

- **Placement** writes **`authoredPlaceKindId` / `variantId`** while **serialization, validation, or readers** still **ignore** those fields → saved data **silently** reverts to coarse behavior elsewhere.
- **Inspector** reads authored fields while **normalization** strips or **drops** them on save → author edits **do not stick**.
- **One subsystem** resolves identity from **`kind`** only while **another** uses **`authoredPlaceKindId` / `variantId`** **without** a **shared precedence pipeline** → inconsistent titles, metadata, or removal semantics.

**Requirement:** Enough of the **write path, read path, and persistence** move together that the app does not ship **partial truth** across subsystems.

##### 3. `kind` vs authored identity conflicts (cross-consumer contract risk)

If **`kind`** and **`authoredPlaceKindId` / `variantId`** **diverge** and there is **no** shared **validation / repair / precedence** contract, the product can enter **split-brain**:

- **Map render** or feature styling uses **`kind`**.
- **Inspector** uses **authored** fields.
- **Encounter / export / combat** uses **another** fallback.

This is **not** only “data hygiene” — it is **cross-consumer contract** risk. **Mitigation:** explicit **validation**, **normalization** rules, and **one** shared hydration path (see **Ready-to-build prerequisites**).

##### 4. Per-edge row vs edge-run UX drift

**Persistence** is per **`edgeId`** (per `edgeEntries[]` row). **UX** may still select **runs** or **batch** operations. **First-ship risk:** users believe they edited a **grouped** edge feature while **one segment** changed, or segments **silently diverge** (identity/state mismatch across a run).

**First-ship rule (mandatory):** Product/engineering must pick **one** explicit behavior, document it, and align tools + copy — e.g. **bulk-apply** authored identity/state to **all** `edgeId`s in the current run when an action applies to a run, **or** strictly **per-segment** edits with **clear** UI that each segment is independent. **Not** “TBD” at ship.

##### 5. Accepted temporary asymmetry: edge `variantId` before cell `variantId`

**Edge** may **lead** persisted **`variantId`** while **`LocationMapCellObjectEntry`** still has **no** `variantId` on the wire — **intentional** route, not an accident. **Risk:** forgetting the **explicit cell follow-up** or allowing **behavior** to **drift** between edge and cell code paths (different inference, different tests). **Mitigation:** track cell **`variantId`** as **scheduled parity work**; document asymmetry in **`location-workspace.md`** when edge ships.

##### 6. Downstream consumers still reading coarse `kind`

**Encounter**, **combat**, **export**, **runtime** readers may **continue** to rely on **`kind`** only. Even after authoring persists **richer** identity and **`state`**, **downstream** behavior can remain **stale** or **lossy** unless updated. **Mitigation:** **non-optional** checklist of consumers to review and align; **do not** assume “map saved it” implies “session uses it.”

##### 7. Discriminated `state` versioning (secondary)

As **`LocationMapEdgeAuthoringState` grows**, **version** bumps and **union** extensions carry **migration** and **validation** risk. Real, but **lower priority** than **identity/hydration split-brain** for first implementation — keep evolution disciplined (`v`, discriminant arms).

##### 8. Scope creep and inspector / stairs ownership (cross-cutting)

**Scope creep** (runtime mechanics beyond authored config) and **stairs ownership** (`useLocationEditBuildingStairHandlers` vs inspectors) remain **real** but **secondary** to **edge identity persistence coordination** — see global **Risks** for full wording.

---

#### Ready-to-build prerequisites (implementation gates)

These are **normative gates** for a coherent first ship of richer edge rows — not a suggestion list.

**A — Normative shared types + validation**  
The **`LocationMapEdgeAuthoringEntry`** and discriminated **`LocationMapEdgeAuthoringState`** shapes above are the **contract**, not illustrative pseudo-code. **Validation rules** (optional fields, union arms, **conflicts** between `kind` and authored identity) are **part of that contract**.

**B — Single shared hydration / precedence path (critical prerequisite)**  
There must be **one** shared resolver or pipeline (implementation name TBD, e.g. domain helper resolving an “edge authored view” from a row) that defines **in one place**, in order:

1. **Authored identity** when present (`authoredPlaceKindId`, `variantId`).
2. **Fallback** to coarse **`kind`** when authored fields are absent (legacy).
3. **Registry presentation** from the resolved family + variant (defaults where needed).
4. **Persisted instance `state`** overlay on top of presentation defaults where applicable.

**Inspector**, **map renderers**, and **downstream readers** must **not** each **re-implement** precedence. **Duplicating** precedence logic across call sites is a **structural risk** — treat it like duplicating save logic.

**C — Placement / draft writes emit coherent rows**  
Placement and edge-commit paths must **not** write **partially enriched** rows (e.g. fields that **normalization** then **discards**). **`authoredPlaceKindId`**, **`variantId`**, and initial **`state`** (when applicable) must be written **consistently** with validation; **`kind`** stays **aligned** for legacy/coarse consumers.

**D — Dirty / snapshot / normalization**  
New fields participate in **workspace** persistence and **draft/snapshot** semantics per **`location-workspace.md`**. **In-memory inference** of identity must **not** silently imply **persisted** authoring unless product explicitly defines **when** inference becomes save (e.g. only on explicit edit, or on save boundary). Avoid surprising **dirty** state from **preview-only** inference.

**E — Run / multi-segment behavior**  
Covered under **Risk 4** — **one explicit first-ship rule** is **required** (bulk vs per-segment + honest UX).

**F — Downstream consumer checklist**  
Explicit review of **encounter**, **combat**, **export**, **map render/hydration**, and **any** serializer of `edgeEntries` — **not** optional cleanup deferred “later.”

**G — Cell `variantId` follow-up**  
**Full** symmetric wire parity with cell objects requires **`variantId?` on `LocationMapCellObjectEntry`** — **explicit follow-up**; **not** a blocker to **starting** edge persistence.

---

#### Guardrail: no partial truth split

Do **not** ship a state where:

- The **inspector** shows **richer** authored identity or metadata than **persistence** can round-trip.
- **Placement** writes **richer** rows than **normalization** or **save** preserve.
- **Render** or **runtime** reads **stale** **`kind`** while the **editor** reads **authored** identity **without** a documented, shared resolution story.

**Partial truth splits** across persisted rows, normalizers, inspector, placement, and downstream readers are the **primary implementation hazard** once the **model** is defined — **not** disagreement on the long-term direction.

---

#### Verdict

The **long-term edge-authored instance model** is now **defined enough to build against**. The **dominant risk** is **no longer** undefined architecture — it is **coordinated execution**: **persistence**, **normalization**, **hydration**, and **downstream alignment** must land **together enough** to avoid **split-brain** behavior. Success means **one** precedence story, **honest** UI relative to saved data, and **no** subsystem silently ignoring fields the others rely on.

---

#### Still under-specified (explicit)

- **Exact first-ship run rule** until product picks **bulk-apply vs per-segment** (see Risk 4).
- **Module / API name** for the **single hydration** helper and its **call-site** list (to be fixed at implementation).
- **Timeline** for **downstream** (encounter/combat) to **consume** new fields vs **authoring-only** ship.
- **Cell `variantId`** scheduling relative to edge **M6**-style milestones.

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
- **Edge-authored object instances — modeling direction** — normative long-term **persistence parity** for `edgeEntries` (**`label`**, **`authoredPlaceKindId`**, **`variantId`**, typed **`state`**), shared-core alignment with **cell** objects, **`kind` vs authored identity** contract, **migration/fallback**, **wall/draw separation**, **staged implementation sequence**, and **Implementation risks, prerequisites, guardrails, and verdict** (coordination gates, single hydration path, no partial truth split) — see dedicated section; **not** a label-only patch in isolation.

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

#### Coarse edge persistence / lossy edge object identity (see Edge-authored subsection)

**Current codebase:** `edgeEntries` are still **`{ edgeId, kind }`** until wire work lands — identity remains **lossy** until **`label`**, **`authoredPlaceKindId`**, **`variantId`**, and **`state`** round-trip.

**Do not duplicate** the full risk matrix here. **Normative model**, **split-brain hazards**, **single hydration prerequisite**, **guardrails**, and **verdict** — **Edge-authored object instances — modeling direction** → **Implementation risks, prerequisites, guardrails, and verdict**.

**Phase 4 must not assume** richer fields exist in the running app until implemented end-to-end.

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

Product/design: what Phase 4 **first ships** (open/closed, locked, secret, style/material) vs what stays **deferred**. Any field that must round-trip requires a persistence decision (see **Gaps / deferred** and **Edge-authored** → **Implementation risks, prerequisites, guardrails, and verdict**).

#### Shared vs type-specific inspector composition

**Shared placed-object shell** (template backbone) vs **plugins** for metadata rows and actions — folder split, component names, and **composition** strategy remain to be chosen. **Discourage** each object family shipping a **fully bespoke** rail; **prefer** shell + composed rows. Keep this visible as design work, not as a standalone “risk” label.

#### Richer authored metadata

Labels, subtype, footprint, flags — **structured** slots vs generic bags (incremental; align with **In scope** richer metadata).

#### Placard **Label** vs linked display identity

**Normative** in **Shared placed-object rail template**: **unlinked** → freeform **Label** **below** metadata; **linked** → hide freeform **Label**, show **linked entity title/name** as display identity. **Open refinement:** exact typography/placement of the linked name (e.g. replaces a line vs subtitle) per object family — **rule** is fixed, **layout nuance** can vary slightly inside the shared shell.

---

### Gaps / deferred

Honest constraints: **not yet designed**, **out of scope**, or **missing deliverables** — distinct from “risk” and “open choice” where helpful.

#### Persistence redesign: shape vs implementation

The **shape** of richer edge instance data is **specified** in **Edge-authored object instances — modeling direction** (additive **`LocationMapEdgeAuthoringEntry`** fields, discriminated **`state`**, precedence rules). **Implementation in the repo** (shared types, validation, save/dirty paths, shared hydration helper) remains **deferred until execution**; see **Implementation risks, prerequisites, guardrails, and verdict** in that section for **gates** and coordination risks.

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
