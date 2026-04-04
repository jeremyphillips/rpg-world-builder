---
name: Object authoring Phase 4 — config and editing
overview: Placeholder child plan for richer post-placement object configuration and editing in the location workspace. Expected to deepen the rail inspector for selected authored objects, add object-specific editable state (door/window states, stairs linking), and establish direction for richer metadata and behavior on placed entities. High-level only — refine after placement foundations, variants, and edge placement are settled.
todos:
  - id: audit-current-post-placement-editing
    content: Audit current rail/inspector behavior for placed objects, current editable metadata/state, and any existing stairs/door/window configuration flows
    status: pending
  - id: define-phase4-editing-scope
    content: Define which post-placement configuration/editing capabilities belong in this phase first and which should remain deferred
    status: pending
  - id: define-object-inspector-model
    content: Establish the high-level direction for how the rail inspects and edits selected authored cell and edge objects
    status: pending
  - id: plan-door-window-states
    content: Outline the intended editable state model for door/window entities and how those states fit authored object persistence and inspector UX
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
isProject: true
---

# Object authoring Phase 4 — config and editing

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Depends on:** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md), [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md), [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md) (registry, placement, edge-authored entities as refined in prior phases).  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) (Selection inspectors, state ownership, debounced persistable fields, `gridDraft`).

**Role:** **Placeholder child plan** — Phase 4 at **high level** only. **Refine** after Phases **1–3** are sufficiently settled.

**Naming:** Same initiative prefix: **`location_workspace_object_authoring_*`**.

---

## Phase purpose

Move from **placing** authored objects to **configuring and editing** them after placement: **rail-first** inspection/editing for **selected** cell and edge authored entities, **typed** editable state (doors/windows, stairs), and a **sustainable** direction for **richer metadata** without ad hoc rail special cases everywhere.

---

## Roadmap context

| Phase | Focus |
|-------|--------|
| 1–3 | Palette, variants, edge placement |
| **4** | **Config and editing** — this document |

---

## Expected direction (to refine later)

- **Rail** as the primary **post-placement** inspection/editing surface for **selected** authored objects.
- **Object-specific** editable properties where appropriate — via **shared patterns** + **type-specific** sections, not one giant switchboard.
- **Door/window** entities support **meaningful** authored state beyond placement alone.
- **Stairs** support **linking/edit** workflows vs static props-only treatment.
- **Richer metadata** flows through **structured** authored config and **persistable** draft rules (`location-workspace.md`), not UI-only buffers.

---

## In scope (placeholder level)

- Rail edits for **placed** authored objects (cell + edge)
- **Selected-object** inspection model
- **Door/window** state editing direction
- **Stairs linking** workflows and authored shape
- **Richer** authored object metadata / behavior (incremental)

---

## Out of scope (for now; re-validate when refined)

- **Complete** redesign of all workspace rails/panels
- **Broad** narrative or **runtime simulation** for every object type
- **Full** gameplay automation for doors/stairs beyond **authored config** needs
- **Map geometry** or unrelated **dirty/save** architecture reopen
- **Solving every future object family** in one pass

Focus: **post-placement authoring/editing**, not the entire **runtime** model.

---

## Design questions (answer when refining)

### 1. Inspector/editing model for selected authored objects

- What appears when a **placed** object is selected; **shared** vs **type-specific**; how to avoid **brittle** one-off forms.

### 2. Door/window editable state (first pass vs later)

- Open/closed, locked, secret, material/style — **initial** scope vs deferred **deeper** systems.

### 3. Stairs-linking model

- Floors/locations, rail editing, **authored** data shape, incomplete setup UX.

### 4. Richer authored metadata

- Labels, subtype, footprint, flags — **structured** slots vs generic bags.

### 5. Shared vs object-specific editing

- Reusable **patterns**; **type-specific** sections; rail **composition** strategy.

---

## Dependencies on earlier phases

| Phase | Provides for Phase 4 |
|-------|----------------------|
| **1** | Registry, toolbar/rail split, loaded placement, palette flow |
| **2** | Variant/metadata patterns where relevant to inspectors |
| **3** | Edge-authored placement, selected-edge direction, doors/windows as **authored** edge entities |

Do **not** recreate placement or edge foundations here.

---

## Risks (for later refinement)

- Scope creep into **full runtime** or **gameplay** systems
- **Monolithic** rail component with per-type logic
- Unclear **shared vs specific** form ownership
- **Stairs-linking** UX complexity
- **Migration** from thin metadata to richer config
- **Save/draft** for new fields — use **existing** snapshot participation **without** unnecessary contract churn

---

## Guardrails (when refined)

### Do

- Treat selected authored objects as **first-class editable** entities
- **Rail** as primary **post-placement** editor surface
- **Structured** authored config; **preserve** data integrity
- Respect **state ownership** and **debounced persistable** patterns

### Do not

- Reopen **palette/placement** unless unavoidable
- **“Everything editable”** blanket redesign
- **Runtime/gameplay** implementation beyond **authored config** scope
- **Overcommit** every object family in one phase
- **Rebuild** the whole rail without a **shared + specific** strategy

---

## Suggested output shape (future refinement)

- Objective; why Phase 4 is last among the four
- Current-state **audit**
- **Selected-object** inspector model
- **Shared vs type-specific** editing structure
- Door/window **state** direction
- Stairs **linking** direction
- Richer **metadata/config** direction
- Risks / migration
- Guardrails
- **Acceptance criteria**

---

## Acceptance criteria (this placeholder)

This placeholder is **complete** when:

1. Phase 4 is **named** and **scoped** at a high level.
2. **Goals** and **dependencies** on Phases **1–3** are documented.
3. **Door/window states** and **stairs linking** are **explicit** core concerns.
4. **Post-placement editing** is distinct from **placement** phases.
5. The doc stays **high-level** for later refinement without locking implementation.

---

## Related

- [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md) — prior phase.
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) — parent roadmap.
- [.cursor/plans/location-workspace/README.md](README.md) — plan bundle index.
