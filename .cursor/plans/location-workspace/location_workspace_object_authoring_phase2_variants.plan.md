---
name: Object authoring Phase 2 — variants
overview: Second child plan for location workspace object authoring UX modernization. Adds grouped variant support on top of the Phase 1 palette foundation — variant-aware registry definitions, compact count/indicator affordances, a variant picker surface (popover or modal), and richer tooltip metadata from the registry. Scope is pre-placement selection/authoring UX for variants, not deep post-placement editing or edge-placement migration.
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
**Depends on:** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md) — Phase 1 registry, toolbar drawer palette, loaded object state, click-to-place for cell objects.  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)

**Role:** **Child plan (implementation)** — scoped to **Phase 2** of the object authoring roadmap.

---

## Objective

Add **variant-aware object authoring** so the palette can represent **families** of placeables without overwhelming first-level UI: one base tile per family when appropriate, clear **variant count** affordances, **intentional** variant selection via a picker, **registry-driven** tooltips (family + variant), and a **resolved** loaded object that feeds the **same** placement pipeline as Phase 1.

---

## Why variants are Phase 2

The parent plan sequences **palette foundation** before **variants** so registry and loaded placement exist before layering grouping semantics. Phase 2 adds **scalability** to the palette (families, defaults, pickers) **without** pulling in edge placement (Phase 3) or deep rail editing (Phase 4).

---

## Parent layer boundaries (unchanged)

This phase preserves the same separation as the parent:

| Layer | Phase 2 responsibility |
|-------|-------------------------|
| **Registry/domain** | Kind, family/group, variant ids, defaults, per-variant metadata, tooltip fields |
| **Placement model** | What the loaded object holds after variant resolution; picker → loaded state |
| **Persistence model** | What kind/variant ids (and defaults) are written on place; no UI-only “family” as source of truth |
| **UI presentation** | Count indicators, picker chrome, tooltip rendering — **reads** registry |

**Core principle:** Variants are a **registry/domain concept with presentation affordances**, not one-off UI branches. **Do not** let palette grouping become the persistence model.

---

## Dependencies on Phase 1

Before implementation, **audit** the actual Phase 1 deliverables:

- **Registry:** How placeable entries are represented; where ids live; category/section metadata.
- **Palette:** Toolbar drawer structure; how items map to registry entries.
- **Loaded object state:** Shape (e.g. resolved kind + payload); owner; clear semantics on mode switch.
- **Click-to-place:** How `gridDraft` / cell objects receive the placed instance from loaded state.

Phase 2 **extends** these foundations. **Bypassing** them with variant-only parallel flows is out of scope.

---

## Proposed registry model for variants (design direction)

**Bias (unless Phase 1 audit proves otherwise):**

- **One logical family** in the palette maps to **one registry family** with a stable **family id** (for UI/palette grouping only).
- **Each variant** has a stable **variant id** scoped to that family (or globally unique if simpler — **pick one** in implementation and document).
- **Persisted identity:** Placed objects store **resolved** identifiers — **authored kind id** (and optionally **variant id** or equivalent) as required by existing `cellEntries` / object payloads — **not** ambiguous “family + label” pairs.
- **Default variant:** Registry declares a **default variant id** when primary-click should place immediately; **or** explicit **no default** when opening a picker first is required.

**Design questions to answer in the plan implementation (one coherent direction):**

1. Is a palette family **one authored kind with many variants**, or **one presentation group over multiple authored kind definitions**? Prefer the simplest model that matches persistence.
2. **Stable persisted identity:** `base kind + variant id` vs **fully distinct** kind ids per variant — choose based on existing `LocationMap` object shapes and normalization.

---

## Palette interaction model

### What happens when the user clicks a grouped palette item?

Define **one** default pattern (document rare exceptions):

| Pattern | When to use |
|---------|-------------|
| **Primary click loads default variant** | Family has a **default variant** and single-click should place quickly. |
| **Primary click opens picker** | No default, or **equal variants** where no single default is safe. |
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

| Surface | Rough threshold |
|---------|-----------------|
| **Popover** (anchored to palette tile) | **Few** variants (e.g. ≤ 4–6), **simple** rows, minimal preview; fast pick. |
| **Modal / small drawer** | **Many** variants, **rich** metadata/previews, or need for scroll + focus trap. |

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

- **Loaded state** holds **resolved** placement intent: **family + variant** *or* **only resolved** kind + variant ids — **choose one** representation; avoid duplicating conflicting sources.
- **On place:** Cell object payload must include **stable** kind/variant (or equivalent) for **hydration** and **render** (`deriveLocationMapAuthoredObjectRenderItems` and friends).
- **Migration:** Existing **single-variant** objects remain **simple** registry entries** without** extra picker overhead.
- **Legacy authored maps:** Hydrated objects without variant ids use **defaults** or **legacy** mapping rules — document in implementation.

**Explicit non-goal for this phase:** Full **metadata editing** after placement; **stairs linking** beyond registry coherence; **edge** kinds.

---

## Cross-cutting concerns (must be explicit)

| Area | Questions to close |
|------|-------------------|
| **Loaded state semantics** | Family + variant vs resolved-only; how UI shows **which** variant is loaded. |
| **Default variant policy** | When required vs when picker-only; what primary-click does. |
| **Registry extensibility** | New families add **data** only; no new palette component per family. |
| **Tooltip consistency** | Family vs variant overrides; single formatting path. |
| **Compatibility** | Single-variant entries; legacy maps; no breaking wire changes without migration plan. |

---

## Risks / migration notes

| Risk | Mitigation |
|------|------------|
| Phase 1 model mismatch | **Audit first** todo; align Phase 2 spec to actual code. |
| Persistence drift | Coordinate with `normalizeLocationMapAuthoringFields` / cell object builders — **small** additive fields only if needed. |
| Picker explosion | **Thresholds** + **one** picker component with two layouts. |
| Scope creep | **Out-of-scope** list in guardrails — review at PR time. |

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

1. **Registry model** for families/variants is **chosen** and documented (including **persisted** shape).
2. **Grouped palette click** behavior is **defined** (default vs picker vs secondary affordance).
3. **Popover vs modal** rules are **explicit** enough to implement.
4. **Tooltips** are **registry-driven** with family/variant resolution rules.
5. **Placement** still flows through **loaded object** + **click-to-place** without replacing Phase 1 contract.
6. **Persistence** implications are **acknowledged**; no deep editing scope creep.
7. Phase 2 stays **separate** from **Edge placement (Phase 3)** and **Config/editing (Phase 4)**.

---

## Implementation todos (tracked)

See YAML frontmatter: audit Phase 1, define variant model, design selection UX, wire tooltips, preserve placement contract, tests and docs.

---

## Related

- [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md) — prerequisite Phase 1.
- [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md) — following Phase 3 (placeholder).
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) — parent roadmap.
- [.cursor/plans/location-workspace/README.md](README.md) — plan bundle index.
