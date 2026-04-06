---
name: Object authoring Phase 2 — variants
overview: Second child plan for location workspace object authoring UX modernization. Extends Phase 1’s family-first registry and placementRegistryResolver seam with grouped variant UX — compact count/indicator affordances, a variant picker (popover or modal), and richer registry-driven tooltips. Does not replace Phase 1 registry shape or introduce a parallel mapping layer. Scope is pre-placement selection/authoring UX for variants, not deep post-placement editing or edge-placement migration.
todos:
  - id: audit-phase1-foundation
    content: Confirm what Phase 1 established for registry structure, palette sections, loaded object state, and click-to-place so variant support extends that model rather than bypassing it
    status: pending
  - id: define-variant-model
    content: Add a clear variant/grouping model to the authored object registry without collapsing UI grouping into persistence or creating ad hoc per-object branches
    status: pending
  - id: design-variant-selection-ux
    content: Define how palette items expose variant availability, when default selection is enough, and when a popover or modal picker should appear
    status: pending
  - id: wire-registry-driven-tooltips
    content: Add richer tooltip metadata driven from the authored object registry so base items and variants have inspectable metadata before placement
    status: pending
  - id: preserve-placement-contract
    content: Ensure variant selection feeds the existing loaded object state and click-to-place flow cleanly without rewriting Phase 1 placement semantics
    status: pending
  - id: tests-and-docs
    content: Add focused tests and docs for variant grouping, picker behavior, default variant selection, and tooltip metadata expectations
    status: pending
isProject: true
---

# Object authoring Phase 2 — variants

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Depends on:** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md) — family-first registry, **`placementRegistryResolver`** seam, loaded identity + context, toolbar drawer palette, click-to-place for cell objects.  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)

**Role:** **Child plan (implementation)** — scoped to **Phase 2** of the object authoring roadmap.

---

## Objective

Add **variant-aware object authoring** so the palette can represent **families** of placeables without overwhelming first-level UI: one base tile per family when appropriate, clear **variant count** affordances, **intentional** variant selection via a picker, **registry-driven** tooltips (family + variant), and **resolved placement intent** (family + variant identity) that feeds the **same** **`placementRegistryResolver`** + click-to-place pipeline as Phase 1.

---

## Why variants are Phase 2

The parent plan sequences **palette foundation** before **variants** so registry and loaded placement exist before layering grouping semantics. Phase 2 adds **scalability** to the palette (families, defaults, pickers) **without** pulling in edge placement (Phase 3) or deep rail editing (Phase 4).

---

## Parent layer boundaries (unchanged)

This phase preserves the same separation as the parent:


| Layer                 | Phase 2 responsibility                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Registry/domain**   | Kind, family/group, variant ids, defaults, per-variant metadata, tooltip fields                   |
| **Placement model**   | Picker → loaded **family + variant** identity; **`placementRegistryResolver`** at place time to existing payloads |
| **Persistence model** | What kind/variant ids (and defaults) are written on place; no UI-only “family” as source of truth |
| **UI presentation**   | Count indicators, picker chrome, tooltip rendering — **reads** registry                           |


**Core principle:** Variants are a **registry/domain concept with presentation affordances**, not one-off UI branches. **Do not** let palette grouping become the persistence model.

---

## Dependencies on Phase 1

Phase 1 **locks** the following — Phase 2 **must extend** them, **not** replace or bypass:

- **Registry:** **Family-first** top-level keys; explicit **`variants`** container; **category/group** presentation-only vs persisted identity; family-level shared **`runtime`** with optional future variant overrides.
- **`placementRegistryResolver`:** Single seam from **family + variant identity** → **existing** authored cell payload shape.
- **Loaded object state:** **Registry identity** (family + variant) **+** minimal placement context — **not** a second canonical copy of the full persisted cell payload as default.
- **Palette:** Toolbar drawer consumes the **same** registry as any other placeable UI — **no** parallel placeable lists.

Before implementation, **audit** the actual Phase 1 code against the above and the Phase 1 **placeables inventory**.

Phase 2 **extends** these foundations. **Bypassing** them with variant-only parallel registry or resolver paths is out of scope.

---

## Proposed registry model for variants (design direction)

Phase 1 already commits to **one registry family** (top-level key) with **explicit `variants`**. Phase 2 **does not** re-litigate family-vs-flat registry structure.

**Bias:**

- **One palette row per family** maps to **one registry family** with a stable **family id** (the top-level key).
- **Each variant** has a stable **variant id** scoped to that family (or globally unique if simpler — **pick one** in implementation and document).
- **Persisted wire:** Placed objects continue to use **existing** `cellEntries` / object payload shapes; **`placementRegistryResolver`** maps **family + variant** → that payload. **Category/group** remains **not** part of persisted authored identity.
- **Explicit variants** support future **swatch/image** selection better than an implicit matrix of dimensions — Phase 2 may add presentation; **data** stays explicit per variant.
- **Default variant:** Registry declares a **default variant id** when primary-click should place immediately; **or** explicit **no default** when opening a picker first is required.

**Remaining design questions for Phase 2 implementation** (narrowed):

1. **Primary-click vs picker** thresholds and **default variant** policy per family (product rules).
2. **Persisted payload fields:** Whether existing map objects need **additive** variant id (or equivalent) vs **fully resolved** legacy kind id only — choose based on existing `LocationMap` normalization and migration cost, **without** bypassing the resolver.

---

## Palette interaction model

### What happens when the user clicks a grouped palette item?

Define **one** default pattern (document rare exceptions):


| Pattern                                                 | When to use                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Primary click loads default variant**                 | Family has a **default variant** and single-click should place quickly.                                            |
| **Primary click opens picker**                          | No default, or **equal variants** where no single default is safe.                                                 |
| **Secondary affordance** (“more”, chevron, count badge) | Opens picker **without** changing primary-click semantics if product wants **fast** default + optional drill-down. |


**Clarity rule:** The user must always know whether they are placing **default**, **a family** (invalid as loaded — avoid), or **a specific resolved variant**. Loaded state should reflect **resolved** variant, not an ambiguous “family only”.

### Count / “more” affordances

- **Count indicator** or **“more variants”** when `variantCount > 1` (or equivalent).
- **Active/default variant feedback** in palette or loaded chip (exact chrome is implementation detail; **behavior** must be specified).

### Repeated placement

- If Phase 1 **keeps loaded until cancel/tool switch**, Phase 2 should **preserve** that for the **resolved** variant unless product explicitly changes it.

### Rail

- **Variant selection** stays **palette-first** in this phase; **rail** is not the primary variant picker (inspector work is Phase 4).

---

## Picker behavior (popover vs modal)

**Do not** leave this entirely ad hoc. Use **explicit thresholds**:


| Surface                                | Rough threshold                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| **Popover** (anchored to palette tile) | **Few** variants (e.g. ≤ 4–6), **simple** rows, minimal preview; fast pick.     |
| **Modal / small drawer**               | **Many** variants, **rich** metadata/previews, or need for scroll + focus trap. |


**Picker responsibilities:**

- List variants **from registry**; show registry-driven labels/metadata.
- **Commit** choice = update **loaded object** with resolved variant; **return** to placement (click-to-place).
- **Not** a post-placement editor — no deep config here.

**Re-opening:** If user opens picker again while same family is loaded, **preserve** current variant selection unless they explicitly pick another.

---

## Tooltip metadata model

**Source of truth:** Registry **only** — no duplicated descriptions in palette JSX.

**Resolution order:**

1. **Variant-level** tooltip fields when hovering a variant row or when loaded variant is known.
2. **Family-level** fallback when hovering the base tile **before** variant resolution.
3. **Shared formatter** (optional helper) for consistent labels (e.g. title + subtitle + tags).

**Fields to plan for (examples)** — not all required for every object:

- label, subtype, material, footprint/size, placement mode hint, short helper text.

---

## Placement + persistence implications

- **Loaded state** holds **resolved placement intent** as **registry identity**: **family id + variant id** (plus minimal placement context). It does **not** replace **`placementRegistryResolver`**; **on place**, the resolver produces the **current** cell payload.
- **On place:** Resolver output / cell object payload must remain **stable** for **hydration** and **render** (`deriveLocationMapAuthoredObjectRenderItems` and friends); additive variant fields only with a **migration** story if needed.
- **Migration:** Existing **single-variant** families remain **one default variant** in the registry — **no** extra picker overhead until multiple variants exist.
- **Legacy authored maps:** Hydrated objects without variant ids use **defaults** or **legacy** mapping rules in resolver/registry — document in implementation.

**Explicit non-goal for this phase:** Full **metadata editing** after placement; **stairs linking** beyond registry coherence; **edge** kinds.

---

## Cross-cutting concerns (must be explicit)


| Area                       | Questions to close                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------- |
| **Loaded state semantics** | **Family + variant** identity in loaded state; how UI shows **which** variant is loaded; resolver still owns payload shape. |
| **Default variant policy** | When required vs when picker-only; what primary-click does.                           |
| **Registry extensibility** | New families add **data** only; no new palette component per family.                  |
| **Tooltip consistency**    | Family vs variant overrides; single formatting path.                                  |
| **Compatibility**          | Single-variant entries; legacy maps; no breaking wire changes without migration plan. |


---

## Risks / migration notes


| Risk                   | Mitigation                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Phase 1 model mismatch | **Audit first** todo; align Phase 2 spec to actual code.                                                                 |
| Persistence drift      | Coordinate with `normalizeLocationMapAuthoringFields` / cell object builders — **small** additive fields only if needed. |
| Picker explosion       | **Thresholds** + **one** picker component with two layouts.                                                              |
| Scope creep            | **Out-of-scope** list in guardrails — review at PR time.                                                                 |


---

## Guardrails

### Do

- Focus on **pre-placement** variant selection and **registry-driven** metadata.
- **Extend** Phase 1 loaded object and placement flow; **do not** rewrite unless necessary.
- Keep **cell** click-to-place semantics.
- **Single** coherent picker model with popover vs modal rules.

### Do not

- **Edge placement**, door/window migration out of Draw, or edge hit-testing (Phase 3).
- **Full rail inspector** redesign or deep post-placement editing (Phase 4).
- **Asset browser** / heavy preview pipelines — **prove** variant model first.
- Collapse **category/group** UI into **persisted** shape.
- **Plugin framework** — registry **types** + data, not a giant plugin system.
- **Parallel registry** or **duplicate resolver** paths that bypass Phase 1 **`placementRegistryResolver`**.

---

## Out of scope (this phase)

- Edge placement mode; door/window migration from Draw; edge snapping/hit-testing.
- Deep inspector or rail **editing** redesign.
- Rich **post-placement** behavior/state editing.
- Stairs linking workflows beyond **minimal** registry coherence.
- Full **metadata** editing after placement.
- Broad **palette visual** redesign beyond variant affordances.

---

## Acceptance criteria

This child plan is **ready for implementation** when:

1. **Variant UX and persistence** are documented on top of Phase 1’s **family + `variants` + resolver** — **no** replacement of Phase 1 registry shape.
2. **Grouped palette click** behavior is **defined** (default vs picker vs secondary affordance).
3. **Popover vs modal** rules are **explicit** enough to implement.
4. **Tooltips** are **registry-driven** with family/variant resolution rules.
5. **Placement** flows through **loaded identity** → **`placementRegistryResolver`** → **click-to-place** without a second mapping layer.
6. **Persistence** implications are **acknowledged**; resolver remains authoritative for payload shape; no deep editing scope creep.
7. Phase 2 stays **separate** from **Edge placement (Phase 3)** and **Config/editing (Phase 4)**.

---

## Implementation todos (tracked)

See YAML frontmatter: audit Phase 1, define variant model, design selection UX, wire tooltips, preserve placement contract, tests and docs.

---

## Relationship to Phase 1 (anti-drift)

- Phase 1 provides **family-first registry**, **`variants`** (at least default path), **`placementRegistryResolver`**, and **loaded identity** semantics.
- Phase 2 **adds** grouped variant selection, counts, picker, and tooltip richness — **extending** the same registry and seam **rather than redesigning** them.

---

## Related

- [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md) — prerequisite Phase 1.
- [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md) — following Phase 3 (placeholder).
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) — parent roadmap.
- [.cursor/plans/location-workspace/README.md](README.md) — plan bundle index.

