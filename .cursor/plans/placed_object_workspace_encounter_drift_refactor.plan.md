# Placed objects: workspace vs encounter rendering drift (refined plan)

**Status:** Architecture / refactor plan — no implementation commitment.  
**Core direction:** One shared **geometry/math contract** and one **resolved placed-object pipeline**; **separate** outer shells for workspace and encounter. **Reduce silent drift first**; do **not** treat pixel-identical screenshots as the default success metric.

---

## 1. Short overview of the recommended strategy

Treat **rendering drift** as three separable problems, addressed in order:

1. **Authoritative grid policy** — Square-map **gutter** must have a **single source of truth** consumed consistently by workspace CSS grid, encounter `inline-grid`, overlay/center math, paths/edges, and hit-testing. **No** optional “set gap to 0” as a casual first step; any gutter **policy** change is **product-visible** and **fully coordinated** or it will **worse than drift** (partial migration).

2. **Strict geometry contract** — Surfaces build **one** small, **math-only** object (`feetPerCell`, `cellPx`, `gapPx` for resolver/overlay math, geometry kind, anchor application mode) and pass it into the existing resolver chain. **Reject** expanding this type with shell styling, pointer flags, or wrapper layout.

3. **Narrow presentation sharing** — Keep **shared leaf** ([`PlacedObjectCellVisualDisplay`](src/features/content/locations/domain/presentation/map/PlacedObjectCellVisualDisplay.tsx)) and **shared resolver** ([`resolvePlacedObjectCellVisualFromRenderItem`](src/features/content/locations/domain/presentation/map/resolvePlacedObjectCellVisual.ts)); add at most a **thin** shared helper for repeated **math-adjacent** structure if duplication stays harmful. **Do not** merge workspace and encounter into one parent tree.

4. **Large / anchored objects** — Address drift through **stable layout-rect and anchor resolution** ([`placedObjectFootprintLayout`](shared/domain/locations/map/placedObjectFootprintLayout.ts), placement anchor helpers), plus **scoped** unit tests on resolver outputs — not one-off CSS overflow tweaks as the primary fix.

---

## 2. Clear recommendation on the right level of unification

| Layer | Target |
|--------|--------|
| **Derive render items** | Keep shared [`deriveLocationMapAuthoredObjectRenderItems`](shared/domain/locations/map/locationMapAuthoredObjectRender.helpers.ts) (already). |
| **Resolve visual + layout numbers** | **Unify inputs** via strict contract + factory; **single** code path into [`resolvePlacedObjectCellVisualFromRenderItem`](src/features/content/locations/domain/presentation/map/resolvePlacedObjectCellVisual.ts). |
| **Leaf display** | **Fully shared** [`PlacedObjectCellVisualDisplay`](src/features/content/locations/domain/presentation/map/PlacedObjectCellVisualDisplay.tsx) (already). |
| **“Geometry wrapper”** | **Optional and minimal** — only if two shells still duplicate **identical** math-adjacent structure; **never** absorb padding, `maxWidth`, overflow, or tooltips. |
| **Outer shells** | **Deliberately separate** — [`GridEditor`](src/features/content/locations/components/mapGrid/GridEditor.tsx) / authoring overlay vs [`CombatGrid`](src/features/combat/components/grid/CombatGrid.tsx) / inline cell content. |

**Opinion:** The right ceiling is **shared math contract + shared resolver + shared leaf**. A **small** duplicated wrapper (stack, tooltip) is acceptable if it preserves **intentional** surface differences; **forced** wrapper DRY at the cost of shell flags is the wrong trade.

---

## 3. Phased refactor plan

### Phase 1 — Authoritative square gutter (policy alignment, not “zero gap” by default)

**Goal:** Eliminate **silent** divergence (e.g. workspace constant vs combat literal `'1px'`) by establishing **one** exported gutter value for square maps and **wiring every consumer** to it.

**Scope:** [`squareGridOverlayGeometry`](shared/domain/grid/squareGridOverlayGeometry.ts), [`GridEditor`](src/features/content/locations/components/mapGrid/GridEditor.tsx), [`useLocationAuthoringGridLayout`](src/features/content/locations/hooks/useLocationAuthoringGridLayout.ts), [`CombatGrid`](src/features/combat/components/grid/CombatGrid.tsx), edge/path helpers, select-mode geometry — per [grep-driven inventory](docs/reference/locations/placed-objects-flow.md) / codebase audit.

**What changes:** Import/use the **same** constant (name can stay or become `SQUARE_GRID_GUTTER_PX`); **remove** ad hoc duplicate literals for the same semantic gutter.

**What does not change yet:** Numeric value of gutter (still typically 1px today) unless a **separate** coordinated policy decision is made; **no** “zero gap” unless Phase 1 is complete and QA is scheduled.

**Risks / watchouts:** **Partial** updates **increase** drift (overlay vs CSS vs hit-test). This phase is **all-or-nothing** per surface.

**Exit criteria:** Documented single line: “Square map gutter = X px from module M”; combat and authoring both use **M**; no stray duplicate gutter literals for that policy.

---

### Phase 2 — Strict geometry contract + factories

**Goal:** **One** math-only type and **one** construction path per surface (authoring vs encounter), feeding [`PlacedObjectCellVisualFootprintLayoutContext`](src/features/content/locations/domain/presentation/map/resolvePlacedObjectCellVisual.ts).

**Scope:** New type + `build…FromAuthoring` / `build…FromEncounter` (exact names TBD). Replace inline `{ feetPerCell, cellPx, gapPx, applyPlacementAnchor }` literals at resolver call sites.

**What changes:** Call sites use only the factory output; **document** that `gapPx` here means **gutter used in footprint/anchor overlay math** (aligned with Phase 1).

**What does not change yet:** **Provenance** of `feetPerCell` (authoring `gridCellUnit` vs `grid.cellFeet`) — only **centralize**; optional **parity asserts** in tests or dev builds are a follow-up.

**Risks / watchouts:** **Junk-drawer pressure** — reject new fields unless they are **required for layout math**. `surface: 'workspace' | 'encounter'` is **disallowed** for branching math unless absolutely necessary; prefer logging outside the type.

**Exit criteria:** No duplicate resolver context literals; contract type reviewed against [Shared contract recommendation](#shared-contract-recommendation).

---

### Phase 3 — Large-object / resolver stability (geometry-first)

**Goal:** Lock **layout rect + anchor offsets** for representative registry variants (including **large / elongated** footprints) so shared math regressions are caught **without** relying on screenshot tests early.

**Scope:** Unit tests on outputs of `resolvePlacedObjectCellVisualFromRenderItem` given **fixed** contract inputs; document **map-space vs cell-space** expectations per [`placed-objects-flow.md`](docs/reference/locations/placed-objects-flow.md).

**What changes:** Test file(s) + short doc note on **multi-cell DOM ownership** (anchor cell only) — behavior unchanged unless bugs found.

**What does not change yet:** Hit-testing mesh for multi-cell selection; z-order policy.

**Risks / watchouts:** Goldens tied to **registry asset dimensions** can churn when assets change — scope tests to **stable synthetic inputs** or a **small** frozen fixture set.

**Exit criteria:** Critical footprint/anchor cases covered; CI green; failures point to **math**, not CSS.

---

### Phase 4 — Optional: feet/cell and cellPx **parity policy** (product + data)

**Goal:** When encounter and authoring represent the **same** map, **avoid silent** `feetPerCell` mismatch and make **intentional** `cellPx` differences (responsive vs fixed tactical) **explicit**.

**Scope:** Trace `grid.cellFeet` vs [`resolveAuthoringCellUnitFeetPerCell`](shared/domain/locations/map/locationCellUnitAuthoring.ts); document **when** math **should** match vs **when** different `cellPx` **by design** ([`BASE_CELL_SIZE`](src/features/combat/components/grid/CombatGrid.tsx) vs authoring layout).

**What changes:** Docs + optional dev/test asserts; **possible** follow-up product work if parity is required — **not** assumed in Phases 1–3.

**Risks / watchouts:** Confusing **math bugs** with **acceptable** pixel scale differences.

**Exit criteria:** Written **parity matrix**: same inputs → same resolver output; different inputs → expected visual scale difference, not “drift.”

---

### Phase 5 — Optional: wrapper deduplication (only if justified)

**Goal:** If **duplication** of **non-shell** structure remains painful, extract a **minimal** helper (e.g. “map object icon row”) **without** pulling in padding, `maxWidth`, or overflow.

**Scope:** Strictly **optional**; default is **leave** workspace/combat wrappers separate per [Intentional surface differences](#intentional-surface-differences).

**What does not change:** Shell-specific stack `maxWidth`, editor padding, combat tooltip wiring — unless proven **identical by policy**.

**Risks / watchouts:** This is where **junk-drawer** risk returns; **skip** if Phase 2–4 already cut drift enough.

**Exit criteria:** Helper has **no** styling props beyond what **math** requires; shells remain clearly separate.

---

## 5. Shared contract recommendation

**Purpose:** **Only** inputs that affect **footprint dimensions**, **placement anchor offsets**, and **consistent overlay math** with the grid.

**Include (geometry / math):**

- `feetPerCell: number`
- `cellPx: number`
- `gapPx: number` — **Gutter** used by [`placedObjectFootprintLayout`](shared/domain/locations/map/placedObjectFootprintLayout.ts) / anchor helpers / overlay alignment **in concert** with Phase 1 authoritative gutter (same value as square CSS grid gutter for that map policy).
- `geometryMode: 'square' | 'hex'` (or product’s current enum) — **when** square footprint layout applies.
- `applyPlacementAnchor: boolean` — **math** for anchor offset (e.g. tactical centering vs authoring anchor).

**Exclude (explicitly not in contract):**

- Wrapper `maxWidth`, flex `gap` between multiple icons, padding, `centerChildren`, overflow, z-index
- Selection, pointer-events, `[data-map-object-id]`, tooltips, combat/editor chrome
- “Surface” or “theme” enums **unless** proven required for **math** (default: **exclude**)

**Factories:** `buildPlacedObjectGeometryContextFromAuthoring(...)`, `buildPlacedObjectGeometryContextFromEncounter(...)` — **only** place that combines `gridCellUnit` / `grid.cellFeet` with `cellPx` and Phase 1 gutter.

**Rule:** If a field does not change **numbers** consumed by resolver + footprint/anchor pure functions, it does **not** belong on the contract.

---

## 6. Intentional surface differences

Keep these **outside** the shared contract and **outside** any mandatory shared wrapper:

- **Selection affordances** and hit targets (`[data-map-object-id]`, select-mode priority)
- **Pointer events** (overlay vs tactical cell interaction)
- **Padding and centering** ([`GridEditor`](src/features/content/locations/components/mapGrid/GridEditor.tsx) / [`GridCellVisual`](src/features/content/locations/components/mapGrid/GridCellVisual.tsx) vs combat defaults)
- **Overflow / clipping** — workspace may allow spill for authoring; combat may clip for tokens
- **Multi-object-in-cell** presentation (wrap, spacing) when **product** differs by surface
- **Combat-only** layers: tokens, highlights, popovers
- **Workspace-only** layers: regions, paths, edge SVG, linked-location chrome

---

## 7. Math parity vs shell parity vs pixel parity

| Term | Meaning | Plan target |
|------|---------|-------------|
| **Math parity** | Same `PlacedObjectCellVisual` **numeric** outputs (layout width/height, anchor offsets) for the **same** contract inputs | **Primary** goal of refactor |
| **Shell parity** | Same padding, centering, `maxWidth`, overflow, stacking context | **Not** required; **intentional** differences allowed |
| **Pixel parity** | Identical screenshots across workspace and encounter | **Not** guaranteed: authoring **responsive `cellPx`** vs encounter **fixed `cellPx`** alone prevents it; different shells add more divergence |

**Honest statement:** Stable shared **math** + stable **leaf** does **not** imply identical **pixels** unless **cell-size policy** and **shell** choices also align — which is a **larger** product decision than Phases 1–3.

---

## 8. Grid policy and gutter migration guardrails

1. **Product-visible:** Any change to gutter **value** (not just import path) affects **density**, edges, paths, and **feel** of the map — treat as **feature-level** change with QA.
2. **No partial migration:** Updating only overlay math **without** CSS grid + hit-test + edge geometry **increases** drift — **forbidden** as a “quick fix.”
3. **Prefer single source before value change:** **First** unify **authoritative** gutter (Phase 1); **then** optionally decide **zero** or other value in a **dedicated** step with full regression.
4. **Do not assume zero gap is trivial:** Zero gutter touches layout formulas ([`useLocationAuthoringGridLayout`](src/features/content/locations/hooks/useLocationAuthoringGridLayout.ts)), total grid size, and every `step = cellPx + gap` consumer — **coordinated** rollout only.
5. **Document the policy:** One short **doc line** in reference docs (e.g. [`placed-objects-flow.md`](docs/reference/locations/placed-objects-flow.md) or grid reference) after any change.

---

## 9. Why shared leaf + shared geometry is preferable to one giant shared tree

- **Composition differs radically** — authoring stacks regions, paths, SVG, overlay; combat stacks tokens and encounter UI. One tree ⇒ **prop explosion** or opaque context.
- **Invariants vs chrome** — **Pure** geometry + resolver are **testable**; shells are **product** and change often.
- **Blast radius** — A bug in shared **math** is bad but **localized**; a bug in a **god component** breaks both surfaces in **non-obvious** ways.
- **Intentional differences** — Shells need freedom for pointer-events and overflow without polluting **math**.

---

## 10. Recommended checks and QA strategy

**Principles:** Prefer **narrow, stable** automated checks; **avoid** brittle full-page visual goldens **early**; treat **manual** QA as mandatory for **gutter policy** changes.

**Recommended:**

- **Phase 1:** Manual pass on square map — **place** object, **draw** path/edge, **select** in gutter-adjacent areas; confirm **no** misalignment between grid lines, overlay, and hit targets.
- **Phase 2–3:** **Unit tests** on resolver outputs for **fixed** inputs (footprint variants, anchor on/off); **not** full React trees.
- **Regression:** If adding **integration** tests, prefer **single** cell / **minimal** DOM fixture, not screenshot of entire workspace.
- **Blast radius:** On any change to shared resolver or factory, **smoke** both workspace placed-object overlay and encounter inline icons in **manual** checklist (short).
- **Noise control:** Rotate golden **numbers** only when **registry** or **math** intentionally changes; avoid coupling tests to **theme** or **shell** CSS.

---

## Summary

| Preserve | Avoid |
|----------|--------|
| Strict math-only contract | Junk-drawer context type |
| Single gutter source before optional value change | Partial gutter migration |
| Shared resolver + leaf | One giant shared parent |
| Unit tests on math | Premature brittle visual goldens |
| Phased delivery | “Zero gap” as casual step one |
