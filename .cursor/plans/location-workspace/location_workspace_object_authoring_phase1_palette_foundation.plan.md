---
name: Object authoring Phase 1 — palette foundation
overview: First child plan for location workspace object authoring UX modernization. Establishes registry-driven palette foundation — placeable authored object definitions, category/group metadata for toolbar presentation, explicit loaded object state, toolbar-drawer-based selection — while preserving click-to-place for existing cell objects. Does not broaden into variants, edge placement, or deep inspector rewrites.
todos:
  - id: audit-current-object-tool
    content: Audit current object tool behavior, rail picker flows, current persisted object kinds, and click-to-place assumptions so Phase 1 can migrate cleanly without breaking authored data
    status: pending
  - id: define-registry-foundation
    content: Introduce a central registry for placeable authored objects with stable authored ids, placement mode, labels/icons, and category/group metadata
    status: pending
  - id: define-palette-model
    content: Design the toolbar drawer palette model that consumes registry data and replaces rail-first object picking for current placeable cell objects
    status: pending
  - id: introduce-loaded-object-state
    content: Define explicit loaded object state and how it interacts with placement, cursor/tool feedback, repeated placement, and selection clearing
    status: pending
  - id: preserve-cell-placement
    content: Keep click-to-place working for existing cell objects through the new registry/palette/loaded-state path
    status: pending
  - id: document-rail-vs-toolbar-split
    content: Clarify that the toolbar drawer becomes the chooser for what to place while the rail remains primarily inspection/configuration after placement
    status: pending
  - id: tests-and-docs
    content: Add focused tests and docs for registry ownership, palette selection, loaded object semantics, and click-to-place continuity
    status: pending
isProject: true
---

# Object authoring Phase 1 — palette foundation

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)

**Role:** **Child plan (implementation)** — **Phase 1** of the object authoring roadmap. Establishes registry, toolbar drawer palette, and loaded placement state that **Phase 2 (variants)** and later phases extend.

**Next phase:** [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md)

---

## Objective

Move from **rail-first** object picking to a **registry-driven** **toolbar drawer** palette with **explicit loaded object** state, while **preserving** **click-to-place** for all **current cell** placeables and **authored data** integrity.

---

## Why Phase 1 comes first

The parent plan sequences **palette foundation** before **variants**, **edge placement**, and **deep config** so registry identity, placement ownership, and toolbar/rail split are stable before layering grouping, edge targeting, and inspectors.

---

## Parent layer boundaries (this phase)

| Layer | Phase 1 responsibility |
|-------|-------------------------|
| **Registry/domain** | Stable kind ids, labels/icons, category/group metadata, `cell` placement mode, minimal defaults for current objects |
| **Placement model** | Loaded object state, click-to-place, repeat/clear semantics, coordination with selection |
| **Persistence model** | No change to wire meaning — **map** current placeables through registry to existing cell object shapes |
| **UI presentation** | Toolbar drawer sections; loaded feedback; **rail** no longer primary picker (full rail redesign **not** required) |

**Core principle:** **Palette organization is not the persistence model** — categories/groups are **presentation**.

---

## Current-state audit (deliverable)

Before building, trace and summarize:

| Area | Questions |
|------|-----------|
| **Rail** | How `LocationMapEditorPlacePanel` / `getPlacePaletteItemsForScale` drive picking today |
| **Placement** | How `activePlace`, `resolvePlacedKindToAction`, and cell clicks create objects |
| **Persistence** | How table/stairs/treasure (and peers) appear in `gridDraft` / `cellEntries` |
| **Selection** | What depends on rail-first picking vs Selection tab |

**Output:** Short **migration-sensitive** notes: what must stay byte-compatible vs what is UI-only.

---

## Registry foundation

**Minimum shape (modest, extensible):**

- **Stable authored kind id** (matches or maps cleanly to persisted object identity)
- **Display label** and **icon** (or icon key)
- **Category / group** metadata for palette sections
- **Placement mode:** `cell` for this phase
- **Defaults** only where placement requires them today

**Design questions to close:**

1. What is the **stable authored identity** for each current placeable?
2. What **minimal metadata** belongs in the registry **now** (avoid premature generalization)?
3. How do **table / stairs / treasure** (and similar) **map** to registry entries?
4. Where does the registry **live** (single module / small tree) — **avoid** scattered switches?

---

## Palette model (toolbar drawer)

**Responsibility:** The **toolbar drawer** is the **primary** surface for choosing **what to place** for cell objects (per parent: palette-first).

Define:

- **Sections** driven by registry **category/group** metadata
- **Item** rendering (single entry per kind in Phase 1 — **no** variant groups)
- **Load** action: user picks an item → **loaded object** updates
- **Visual** indication of **which** object is loaded (chip, highlight, etc.)
- **Tool/mode** interaction: leaving **place** or switching placeable **clears** loaded state per rules below

**Bias (unless audit contradicts):**

- Registry drives sections; **no** parallel hardcoded list in the rail for the same objects.

---

## Loaded object state model

**Explicit** semantics (implementation-ready):

| Question | Phase 1 must answer |
|----------|---------------------|
| **Shape** | What fields identify the loaded placeable (kind id, resolver payload, etc.) |
| **Repeat placement** | Loaded stays active after a place (**bias:** yes until clear/tool change — confirm against product) |
| **Clear** | Mode switch, escape, picking another object, explicit clear |
| **vs selection** | How `mapSelection` / Select mode interact — loaded is **placement**, selection is **inspect** |
| **Cursor / feedback** | Minimal chrome reflecting loaded object |

This model must **extend** later for variants (Phase 2) and edge kinds (Phase 3) without a rewrite.

---

## Placement continuity

- **Click-to-place** on cells must **create** the same authored shapes as today, routed through **loaded state** + registry resolution.
- **No** dependency on Phase 2+ features.
- Use **compatibility adapters** if old and new code paths briefly coexist.

---

## Toolbar vs rail responsibility split

| Surface | Role in Phase 1 |
|---------|-------------------|
| **Toolbar drawer** | **Choose** what to place; show loaded object |
| **Rail (Map / Selection)** | **Not** the primary object picker; **hints**, **linked content** as today where applicable; **inspect/configure** after selection |

Full **inspector** redesign is **out of scope** — only **clarify** ownership and stop **rail-first** object chooser for cell objects.

---

## Out of scope

- Grouped **variants**, count indicators, variant **pickers**
- **Edge** placement, doors/windows off **Draw**, edge hit-testing
- **Deep** rail/inspector rewrites, rich **post-placement** metadata editing
- **Stairs linking** beyond minimal registry coherence for existing behavior

---

## Cross-cutting concerns

| Area | Cover |
|------|--------|
| **Registry ownership** | Location, id policy, how new placeables are added |
| **Placement ownership** | Owner of loaded state; coordination with `useLocationMapEditorState` (or successor) |
| **Persistence compatibility** | Existing maps load/save unchanged; mapping from registry → current payloads |
| **UI migration** | Incremental move off rail picker; avoid destabilizing paint/draw/select |

---

## Risks / migration notes

| Risk | Mitigation |
|------|------------|
| Hidden rail dependencies | **Audit** first todo |
| Duplicate sources of truth | Registry **only** for placeable list in Phase 1 |
| Dirty/save drift | Map-only UI for loaded/tool — **no** new persistable fields without snapshot checklist (`location-workspace.md`) |

---

## Guardrails

### Do

- Tight **foundation** scope; **preserve** cell placement and data
- **Central** registry; **explicit** loaded state; **clear** toolbar/rail split
- Make **Phase 2** easier (registry ids stable; loaded shape extensible)

### Do not

- **Variants**, **edge** placement, **full** inspector redesign
- **Large** plugin-style frameworks
- **Palette** work mixed with unrelated **editor shell** redesign

---

## Acceptance criteria

This child plan is **ready for implementation** when:

1. **Foundation registry** for **current** placeables is **defined** (shape + mapping).
2. **Toolbar drawer** is the **primary chooser** for cell object placement.
3. **Loaded object** semantics are **explicit** (shape, repeat, clear, vs selection).
4. **Click-to-place** is **preserved** conceptually through the new path.
5. **Toolbar vs rail** split is **documented**; rail is **not** primary picker for those objects.
6. Phase 1 stays **separate** from **variants**, **edge placement**, and **deep** editing.

---

## Related

- [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md) — follows Phase 1.
- [.cursor/plans/location-workspace/README.md](README.md) — plan bundle index.
