---
name: Object authoring Phase 4 — implementation build plan
overview: Execution-oriented breakdown for Phase 4 (config/editing, shared placed-object rail template, inspector dispatch). Normative product/architecture remains in location_workspace_object_authoring_phase4_config_editing.plan.md. **M8** = post-build **cleanup pass** (object-first inspectors, `variant.presentation` metadata rows, empty-cell rail, edge/wall coupling note) — see that plan’s **Post-build cleanup pass** section.
isProject: true
---

# Phase 4 — implementation build plan

**Normative spec:** [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md) (inspector ownership, shared template, Label rules, risks, gaps).

**Canonical doc (update in scope):** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md).

**Depends on:** Phases 1–3 complete in product (`placementMode`, edge place, registry, `edgeEntries` kind-only wire).

This document is a **build order** and **work breakdown**. It does not replace the Phase 4 plan; it sequences implementation so the shared template and dispatch land without a monolithic one-shot rewrite.

### Implementation status (living)

| Milestone | Status |
|-----------|--------|
| M1 Audit | Done (superseded by shipped UI; no separate audit artifact required) |
| M2 Shared shell (`PlacedObjectRailTemplate`) | Done |
| M3 Cell placed objects + Label rules | Done |
| M4 Empty cell vs object dispatch | Done (`LocationCellAuthoringPanel` boundary) |
| M5 Edge inspectors on shared shell | Done |
| M6 Persistence / richer `edgeEntries` | **Deferred** — additive wire + hydration; see normative plan **Edge-authored object instances** |
| M7 Tests + `location-workspace.md` | Done — RTL: [`LocationEditorSelectionPanel.test.tsx`](../../../src/features/content/locations/components/workspace/rightRail/selection/__tests__/LocationEditorSelectionPanel.test.tsx); doc synced |
| M8 Post-build cleanup | Done (presentation metadata, empty-cell rail, object-first edge-run door/window) |

**Definition of done (below)** items 1–6 and M8 items 7–10 are satisfied in product except **M6** scope, which remains a future execution slice.

---

## Build principles (non-negotiable)

1. **One shared placed-object template** for cell- and edge-anchored objects — **shell + composed rows**, not a new bespoke rail per family.
2. **Empty cell** (`CellInspector`) vs **placed object** are **separate** surfaces — **no** generic cell linking as default; **no** **Remove from map** on empty cell.
3. **Label** — below metadata; **unlinked** = freeform input; **linked** = hide freeform, **linked entity title/name** as display identity.
4. **Default rail** — no raw UUIDs, redundant badges, or resolver/debug strings as primary content.
5. **Stairs** — extend or delegate **`useLocationEditBuildingStairHandlers`**, avoid parallel stair editors.
6. **Persistence** — additive edge wire only with explicit migration/normalization; **no** assumption that variant round-trips before wire work.

---

## Milestones

### M1 — Audit & inventory (short)

**Goal:** Map current UI to the target model; list flags/branches to remove.

| Task | Output |
|------|--------|
| Trace **`LocationEditorSelectionPanel`** switch — which component per `LocationMapSelection` type | Table in PR or doc snippet |
| Audit **`LocationMapObjectInspector`** — headings, badges, id rows, Label, linking | Gap list vs shared template |
| Audit **`LocationCellAuthoringPanel`** — when generic link UI shows; overlap with object selection | Confirms **Problem** section |
| Audit **`LocationMapEdgeInspector`** / **`LocationMapEdgeRunInspector`** — copy vs object-first template | Gap list |
| Confirm **linked vs unlinked** data sources for placed objects (building/city/site) | Informs Label visibility |

**Primary files:**  
`rightRail/selection/LocationEditorSelectionPanel.tsx`, `LocationMapSelectionInspectors.tsx`, `rightRail/panels/LocationCellAuthoringPanel.tsx`, `useLocationEditBuildingStairHandlers.ts` (stair flows).

---

### M2 — Shared placed-object shell (foundation)

**Goal:** Introduce a **reusable layout** (stack/sections) used by **both** cell and edge placed-object inspectors.

| Task | Notes |
|------|------|
| Add **`PlacedObjectRailTemplate`** (name TBD) — props for category, object title, placement line, metadata slots, label slot, actions slot, remove handler | Pure layout; MUI `Stack`; no business logic beyond composition |
| Define **metadata row** helper — consistent **Key: value** typography | Matches plan examples |
| Unit or RTL smoke: shell renders children in **fixed order** | Guards template drift |

**Defer:** Edge-specific copy until M4; first consumer can be **`LocationMapObjectInspector`** only.

---

### M3 — Cell placed objects: migrate to shell + Label rules

**Goal:** **`type: 'object'`** path matches **Shared placed-object rail template**; remove **“Placed object”** / raw id defaults where the plan forbids them.

| Task | Notes |
|------|------|
| Refactor **`LocationMapObjectInspector`** to use shell | Per-kind sections plug in as **composed** blocks |
| Implement **Label** — **below** metadata; **unlinked** → `TextField`; **linked** → hide field, show **linked location/entity name** | Wire to existing link resolution |
| Object-specific actions (**Link building**, stairs, …) **below** Label, **above** remove | Reuse existing handlers |
| **Remove from map** stays last (shared) | Already present — align styling/order |

---

### M4 — Empty cell vs placed cell: dispatch clarity

**Goal:** **`type: 'cell'`** = **`CellInspector`** only — no object-scoped linking surfaced as “cell links.”

| Task | Notes |
|------|------|
| Split or constrain **`LocationCellAuthoringPanel`** so empty-cell rail **does not** duplicate **CellObjectInspector** concerns | May require props split: `mode: 'empty-cell'` vs shared chrome only |
| Remove reliance on **`showLinkOnlyWhenObjectSelected`**-style gates in favor of **routing** (`cell` vs `object`) | Aligns with **Target dispatch architecture** |
| Verify **select mode** still produces **`cell`** vs **`object`** correctly | `useLocationGridSelectMode`, `resolveSelectModeInteractiveTarget` |

---

### M5 — Edge placed objects: same shell as cell

**Goal:** **`LocationMapEdgeInspector`** / **`LocationMapEdgeRunInspector`** use **`PlacedObjectRailTemplate`**; door/window **object-first**; placement slot = edge context.

| Task | Notes |
|------|------|
| Map **registry** identity (**Door**, **Window**) into category/object lines | **`locationPlacedObject.registry`**, kind → family |
| Move orientation / segment / anchor into **metadata** or placement sublines — **not** run-first headline | Per Phase 4 **Desired UX** |
| **`edge-run`:** decide collapse (primary segment, anchor) + **Remove** semantics | **Open design decision** in Phase 4 plan |
| Unify with **M2** shell | Same Remove placement |

---

### M6 — Persistence & edge identity (as needed for shipped UX)

**Goal:** Only when product ships fields that must round-trip — follow **`location-workspace.md`** **Adding persisted workspace state**.

| Task | Notes |
|------|------|
| Design additive **`edgeEntries`** (or adjunct) for variant/instance | **Coarse edge persistence** risk |
| **`LOCATION_WORKSPACE_NORMALIZATION`**, dirty snapshot, bootstrap | **Gaps / deferred** until design locks |
| **Fallback UI** — unknown variant, legacy rows | Plan **Lossy identity** |

**Can trail** M3–M5 if first pass is **display-only** improvements without new persisted edge fields.

---

### M7 — Tests & docs

| Task | Notes |
|------|------|
| Tests: **which inspector mounts** for which `mapSelection` | **Test gap** in Phase 4 plan |
| Update **`docs/reference/location-workspace.md`** | Selection inspectors, shared template, persistable rules |
| Optional: **audit** doc — current branches vs target | **Audit gap** |

---

### M8 — Post-build cleanup pass (inspector alignment)

**Goal:** Close gaps between **first implementation** and the normative **shared placed-object template**; avoid drift between **authored registry edge objects** and **wall/draw/edge-run** language.

**Normative detail:** [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md) — **Post-build cleanup pass (Phase 4 follow-up)**.

| Task | Notes |
|------|-------|
| **Door / window / edge-run** — **object-first** copy | Remove **run-first** headlines and redundant **segment** duplication as **primary** identity; **registry** category + object label + humanized **placement** + **`variant.presentation`** rows + **Label** + **Remove** |
| **Cell objects (e.g. table)** | Ensure **metadata rows** from **presentation** so the shell matches **Furniture / Table / Cell … / Material / Shape** |
| **Shared metadata helper** | Derive first-pass rows from **`presentation`** with **title-case keys** + optional **lightweight** value prettify — **avoid** a large new per-object metadata map |
| **Label** | **Consistent** for **edge** placed objects — same **`PlacedObjectRailTemplate`** rules as cell |
| **Empty-cell Selection tab** | **No** default **linked location** UI; **no** default **cell-object add/select** block — **`CellInspector`** boundary |
| **Coupling audit** | Small code **decoupling** (registry-first path for authored door/window) **or** explicit **note** + minimal follow-up for **`LOCATION_EDGE_FEATURE_KIND_META`** / **run** inspector assumptions vs **registry variants** |
| **Tests + doc touch-up** | RTL/unit for metadata rows and empty-cell rail; **`location-workspace.md`** if behavior changes |

**Does not include:** Redesigning **wall** as non-vector geometry, **hex** parity, or **M6** persistence scope unless explicitly pulled in.

---

### Edge-authored instance parity (normative design — implementation staged)

**Spec:** [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md) — **Edge-authored object instances — modeling direction (long-term parity)** and **Implementation risks, prerequisites, guardrails, and verdict** (single hydration path, ready-to-build gates, no partial truth split).

**Intent:** Richer **`LocationMapEdgeAuthoringEntry`** (`label`, `authoredPlaceKindId`, `variantId`, `state`), shared-core parity with cell objects, migration from coarse rows, staged sequence (types → persist identity → inspector hydration → `state` → cleanup). **Avoid** shipping **label-only** without the agreed identity fields — see plan **§8**. **Avoid** split-brain across writers, normalizers, inspector, and downstream readers — see **Implementation risks, prerequisites, guardrails, and verdict**.

---

## Suggested sequencing

```text
M1 (audit) → M2 (shell) → M3 (cell object) → M4 (empty cell dispatch) → M5 (edge) → M6 (persistence, if needed) → M7 (tests + doc) → M8 (post-build cleanup)
```

**Parallelizable after M2:** M4 can overlap M3 if two contributors coordinate on **`LocationCellAuthoringPanel`** contracts.

**M8** typically runs **after** M3–M5 have shipped a first cut (may start in parallel with M7 for coordination).

---

## File map (living)

| Area | Paths |
|------|--------|
| Dispatch | `rightRail/selection/LocationEditorSelectionPanel.tsx` |
| Inspectors | `rightRail/selection/LocationMapSelectionInspectors.tsx` |
| Cell panel | `rightRail/panels/LocationCellAuthoringPanel.tsx` |
| Selection types | `rightRail/types/locationEditorRail.types.ts` |
| Select mode | `domain/authoring/editor/selectMode/`, `useLocationGridSelectMode.ts` |
| Stairs | `routes/locationEdit/useLocationEditBuildingStairHandlers.ts` |
| Registry | `domain/model/placedObjects/locationPlacedObject.registry.ts` |
| Presentation metadata rows (M8) | Shared helper (e.g. `rightRail/selection/`) deriving rows from **`variant.presentation`** |
| Doc | `docs/reference/location-workspace.md` |

---

## Definition of done (implementation)

Phase 4 **implementation** is **done** for a slice when:

1. **Placed** cell and edge selections use the **shared template** backbone (category → title → placement → metadata → Label rules → actions → remove).
2. **Empty cell** selection does **not** show **Remove from map** or default generic object linking that contradicts **`CellInspector`** ownership.
3. **Linked** placed objects **hide** freeform **Label** and show **linked entity name** where applicable.
4. **No** default raw UUID / debug ids in the primary rail for placed objects (unless explicitly scoped diagnostics).
5. Tests cover **dispatch → mounted inspector** for main `mapSelection` cases.
6. **`location-workspace.md`** updated to match shipped behavior and any new persistable rules.

**Post-build cleanup (M8) — definition of done** adds:

7. **Door/window** (and **`edge-run`** where it represents those objects) do **not** present **run-first** or duplicated geometry copy as the **primary** inspector story; **variant `presentation`** metadata appears when resolvable.
8. **Table** (and analogous cell objects) show **presentation** metadata rows, not only category + placement + Label.
9. **Empty-cell** Selection tab matches **M8** boundary (no default generic link/add-object surfaces).
10. **Architectural note** or **small decoupling** recorded for **authored edge objects** vs **edge-feature / wall** modeling.

---

## Related

- [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md) — normative Phase 4 plan
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) — parent roadmap
- [README.md](README.md) — plan bundle index
