---
name: Object authoring Phase 3 — edge placement
overview: Placeholder child plan for edge-authored object placement in the location workspace. Expected to introduce edge placement mode, move doors/windows out of Draw-oriented semantics, add edge hit-testing and snapping, and establish a selected-edge inspection path in the rail. High-level only — refine after Phase 1 and Phase 2 foundations are settled.
todos:
  - id: audit-current-edge-related-flows
    content: Audit current door/window/draw-tool behavior, existing edge data model usage, edge rendering assumptions, and any current inspector/edit path for edges
    status: pending
  - id: define-edge-placement-scope
    content: Define the product/architecture scope for edge placement in this phase, including which authored edge object types are included first
    status: pending
  - id: define-edge-placement-model
    content: Establish the high-level model for edge placement mode, snapping, selection, and loaded edge object behavior
    status: pending
  - id: plan-door-window-migration
    content: Outline how doors/windows move from Draw-oriented semantics into edge-authored placement without breaking authored data or editor workflows
    status: pending
  - id: define-edge-inspector-direction
    content: Set the high-level direction for selected-edge inspection/editing in the rail, without expanding into full config/editing depth yet
    status: pending
  - id: identify-risks-and-dependencies
    content: Call out dependencies on prior phases, geometry assumptions, pointer/hit-testing concerns, and migration risks for later refinement
    status: pending
isProject: true
---

# Object authoring Phase 3 — edge placement

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Depends on:** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md), [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md) (as applicable to registry and placement patterns).  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) (edge authoring, Draw tool, `edgeEntries`, hex constraints).

**Role:** **Placeholder child plan** — Phase 3 scope at a **high level** only. **Refine** into a full implementation plan after Phase 1 and Phase 2 land.

**Naming:** Plans for this initiative use the shared prefix **`location_workspace_object_authoring_`** (roadmap + phase plans).

---

## Phase purpose

Introduce **edge-authored placement** so objects that belong on **cell boundaries** are first-class in the object authoring system — not special cases buried in **Draw** or boundary-paint alone.

This phase is expected to establish the first coherent version of:

- **Edge placement mode** (how the user arms and places edge-bound authored objects)
- **Edge hit-testing and snapping** (intentional targeting on square grids first)
- **Migration** of **doors/windows** off **Draw-oriented** semantics toward **edge-authored** placement aligned with registry + loaded state
- **Selected-edge** inspection path in the **rail** (minimal — deeper editing stays Phase 4)

---

## Roadmap context

| Phase | Focus |
|-------|--------|
| 1 | Palette foundation — registry, toolbar drawer, loaded state, cell click-to-place |
| 2 | Variants — families, pickers, registry tooltips |
| **3** | **Edge placement** — this document |
| 4 | Config / editing — richer rail editing, door/window state, stairs linking |

---

## Expected direction (to refine later)

- **Doors/windows** move **away** from **Draw** as the primary semantic home toward **authored edge placement** integrated with the shared **loaded-object / placement** model.
- **Edge objects** are **explicit** in authored state (`edgeEntries` and related), not inferred only from draw/paint behavior.
- **Hit-testing and snapping** are **geometry-aware** and reliable enough that placement feels **intentional**.
- **Rail** supports **inspection** of a **selected edge** after placement/selection; **full** configuration depth remains **Phase 4**.

---

## In scope (placeholder level)

- Introduction of **edge placement mode** (exact shape TBD in refinement)
- **Snapping** and **hit-testing** for edge targets (square-first; **hex** per reference doc constraints)
- Authored placement of **doors/windows** and possibly other edge-bound types — **first pass** vs **deferred** list TBD
- **Migration** plan: Draw → edge placement without breaking **authored data**
- **Selected-edge** inspection / minimal edit path in the rail

---

## Out of scope (for now; re-validate when refined)

Even when expanded, avoid ballooning into:

- **Full** object metadata / state editing systems (**Phase 4**)
- **Comprehensive** door/window behavior beyond what **initial placement + minimal inspection** requires
- Unrelated **map geometry** or **workspace shell** redesign
- **Broad** pointer/hover redesign except what **edge placement** strictly needs
- **Full** rail redesign beyond **selected-edge** affordances
- **Feature-complete** coverage for every future edge-authored family

**Hex:** Do **not** assume parity with square without an **explicit** design — see `location-workspace.md` **Open issues** (edge tools square-first; stored hex edges).

---

## Design questions (answer when refining)

### 1. What qualifies as an edge-authored object?

- Doors, windows — **first pass** vs later (gates, arches, etc.)

### 2. How does edge placement fit the broader placement model?

- Loaded state for **edge** kinds vs **cell** kinds
- Submode vs **placement-mode property** on the same toolbar flow
- Switching between **cell** and **edge** placement without losing clarity

### 3. Geometry / hit-testing contract

- Edge identity (`edgeId`), hover/selection resolution order, snapping rules
- **Square vs hex** support boundaries

### 4. Doors/windows migration off Draw

- Current **authored data** and **editor** flows
- User expectations and **compatibility shims**

### 5. Rail scope for this phase

- What **selected-edge** inspector shows
- **Minimal** editing vs **defer** to Phase 4

---

## Dependencies on earlier phases

### Phase 1

- Central **authored object registry**
- **Toolbar palette** and **loaded object** state
- **Toolbar vs rail** responsibility split

### Phase 2

- Richer **registry** definitions / grouping where relevant to edge families
- **Tooltip / metadata** patterns that may apply to edge-authored entries

Build on these foundations — **avoid** a parallel edge-only system that bypasses them.

---

## Risks (for later refinement)

- Current **Draw** coupling for doors/windows
- **Edge geometry** and **snapping** accuracy / UX clarity
- **Square vs hex** behavior and documented constraints
- **Selected-edge** inspector **scope creep**
- Mixing **initial edge placement** with **deep config** too early
- **Authored data** and workflow preservation during migration

---

## Guardrails (when refined)

### Do

- Make **edge objects** explicit **authored** entities tied to the **shared** object authoring model
- Treat **hit-testing / snapping** as first-class
- Keep **migration** from Draw **explicit and safe**
- **Preserve authored data integrity**

### Do not

- **Ad hoc** edge-only special cases that ignore registry/placement patterns
- Reopen **dirty/save** or unrelated **editor architecture** without scoped child plan
- **Over-expand** into Phase 4 **configuration** systems
- Assume **hex** === **square** for edge tools without design

---

## Suggested output shape (future refinement)

When expanded, include sections such as:

- Objective; why Phase 3 is third
- Current-state **audit**
- Edge-authored **object model**
- Placement mode + **loaded-state** implications
- **Hit-testing and snapping** model
- **Doors/windows migration** plan
- **Selected-edge rail** direction
- Risks / support boundaries
- Guardrails
- **Acceptance criteria**

---

## Acceptance criteria (this placeholder)

This placeholder is **complete** when:

1. Phase 3 is **named** and **scoped** at a high level.
2. **Goals** and **dependencies** on Phases **1–2** are documented.
3. **Doors/windows** moving **off Draw** semantics is **explicit**.
4. **Edge placement** is framed as a distinct **authored placement** concern.
5. The document stays **high-level** enough to **refine later** without locking implementation.

---

## Related

- [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md) — prior phase.
- [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md) — following Phase 4 (placeholder).
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) — parent roadmap.
- [.cursor/plans/location-workspace/README.md](README.md) — plan bundle index.
