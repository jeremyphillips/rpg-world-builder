---
name: Object authoring Phase 1 — palette foundation
overview: Grounds palette foundation in the audited production pipeline — evolve activePlace as loaded placement identity; consolidate resolvePlacedKindToAction + buildPersistedPlacedObjectPayload into placementRegistryResolver; thin handleAuthoringCellClick to delegate placement resolution to that seam and apply only draft/link side effects — no new mapping logic in toolbar components or route wiring. Toolbar-first palette for map-object + linked-content rows, family-first registry with variants default path, full placeables inventory gate, and docs/reference/location-workspace.md updates. No Phase 2 variant UX.
todos:
  - id: audit-current-object-tool
    content: Complete full placeables inventory (objects + linked-content, per plan columns) before implementation; trace rail, route/model, placement, persistence, selection
    status: pending
  - id: define-registry-foundation
    content: Implement family-first registry with durable identity, explicit category/group (presentation-only), family-level shared fields, variants container (default variant for placement in Phase 1)
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
    content: Tests for registry, resolver consolidation, loaded placement semantics, linked vs object branches
    status: pending
  - id: update-location-workspace-reference
    content: Update docs/reference/location-workspace.md for toolbar-first place palette, evolved activePlace, placementRegistryResolver seam, and any superseded rail/palette wording so the canonical reference matches implementation
    status: pending
isProject: true
---

# Object authoring Phase 1 — palette foundation

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)

**Role:** **Child plan (implementation)** — **Phase 1** of the object authoring roadmap. Establishes the **durable registry** and **consolidated placement seam** on top of **today’s real pipeline** (`activePlace` → `resolvePlacedKindToAction` → payloads / link intent → draft). **Phase 2 (variants UI)** extends the same shapes — **not** a greenfield rewrite.

**Next phase:** [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md)

---

## Objective

Move from **rail-first** picking to a **registry-driven** **toolbar drawer** palette, while **preserving** **click-to-place** and the **current persisted wire contract** for map objects.

Phase 1 is **explicitly grounded** in the audited chain: palette rows → `MapPlacePaletteItem` → **`activePlace`** → **`handleAuthoringCellClick`** → **`resolvePlacedKindToAction`** → **`buildPersistedPlacedObjectPayload`** (map-object branch) **or** link placement → **`gridDraft`** / **`pendingPlacement`**. The plan names how **loaded placement identity**, the **resolver seam**, and **registry** relate to these **existing** symbols — not abstract “future” mechanisms with no mapping to code.

---

## Audited: current placement pipeline (production)

The following is **already implemented** and is the baseline Phase 1 refactors from:

1. **Palette data:** `getPlacePaletteItemsForScale` → `MapPlacePaletteItem[]` (linked-content vs map-object **category** is **UI routing only**).
2. **Selection:** User picks a row → **`activePlace`** = `{ category, kind }` (`LocationMapActivePlaceSelection` in `useLocationMapEditorState`).
3. **Click:** **`handleAuthoringCellClick`** (`useLocationEditWorkspaceModel`) runs when in **place** mode with **`activePlace`** set.
4. **Routing:** **`resolvePlacedKindToAction(activePlace, hostScale)`** → **`link`** | **`object`** | **`unsupported`**.
5. **Map-object payload:** **`buildPersistedPlacedObjectPayload(placedKind, hostScale)`** → `{ kind: LocationMapObjectKindId, authoredPlaceKindId? }`.
6. **Draft / link:** **Object** → append to **`gridDraft.objectsByCellId[cellId]`** (plus **stairs** default **`stairEndpoint`** inline). **Link** → **`setPendingPlacement`** (linked-location flow).
7. **Persisted wire (map objects):** **`LocationMapObjectKindId`** + optional **`authoredPlaceKindId`** — unchanged by Phase 1 (see **Persistence stance**).

---

## Current placement pipeline → Phase 1 mapping


| Today (audited) | Phase 1 target |
| ----------------- | -------------- |
| Rail **`LocationMapEditorPlacePanel`** + `getPlacePaletteItemsForScale` | **Toolbar drawer** palette; **same** registry-driven item list (not a second list) |
| **`activePlace` = `{ category, kind }`** | **Evolved** loaded placement identity (see **`activePlace` vs loaded placement state**): **`category`** remains **UI-only**; **`kind`** gains **family + default variant** (or equivalent) as registry identity |
| **`handleAuthoringCellClick`** (large inline place branch) | **Thin handler**: delegate **`activePlace` + cell + host context** → **`placementRegistryResolver`** (single entry); **only** then **`setPendingPlacement`** / **`setGridDraft`** from returned **structured result** — **no** inlined kind→payload mapping |
| **`resolvePlacedKindToAction`** | **Absorbed into / re-exported from** **`placementRegistryResolver`** — same **placement action** discriminant (`link` \| `object` \| …), **not** a duplicate resolver |
| **`buildPersistedPlacedObjectPayload`** | **Object-payload translation layer** inside the seam (keep or wrap; **do not** fork two competing payload builders) |
| Stairs **`stairEndpoint`** seeded in draft mutation | Remains **special-case authored defaults** at **draft append** (or immediately after resolver returns **object** intent), **not** generic “stairs with no future hooks” — **stairs linking** workflows stay **out of scope** |

---

## Loaded placement state: relationship to `activePlace` (decision)

**Chosen approach: Option A — evolve `activePlace` (single source of truth)**

- Phase 1 **does not** add a **second** parallel state (e.g. `loadedPlaceable` alongside **`activePlace`**) and **does not** retire **`activePlace`** in favor of an unrelated name without migration (Options B/C avoided to **minimize duplicate sources of truth**).
- **`activePlace`** remains the **one** field in **`useLocationMapEditorState`** that means “what the user intends to place.” Its **TypeScript type** **`LocationMapActivePlaceSelection`** **evolves** to carry **durable registry identity**: at minimum **family id** + **variant id** (Phase 1: default variant), while preserving **discrimination** between **linked-content** and **map-object** **routes** via **`category`** (still **not** persisted).
- **Why this sets up Phase 2:** Variant selection updates the **same** **`activePlace`** / loaded identity — no merge logic between two competing stores. Toolbar and rail (during migration) both **set** this one state.

**Implementation note:** During refactors, a **temporary** normalizer from legacy `{ category, kind }` to **family + variant** may live at the registry boundary; the **target** is one evolved shape, not permanent dual models (avoid Option C as an indefinite end state).

---

## Placement resolver seam — `placementRegistryResolver` (concrete)

**This is not a greenfield API.** Production already has a real seam:

- **`resolvePlacedKindToAction`** — registry/palette **`kind`** + **`category`** + host scale → **`link` \| `object` \| `unsupported`**
- **`buildPersistedPlacedObjectPayload`** — authored **`placedKind`** + host scale → **persisted object payload** for **map-object** branch
- **`handleAuthoringCellClick`** — today **mixes** resolution with draft mutation; Phase 1 **splits** that responsibility.

**Phase 1 direction:** **Absorb and consolidate** resolution into a **named module boundary** **`placementRegistryResolver`** (single folder or module as implemented):

1. **Owns:** **Registry identity** (family + variant, once registry exists) **→** same conceptual outputs as today: **placement action** (`link` \| `object` \| unsupported) **→** for **`object`**: **payload** = **`LocationMapObjectKindId` + optional `authoredPlaceKindId`** via **`buildPersistedPlacedObjectPayload`** (or thin wrapper); for **`link`**: **link intent** for **`pendingPlacement`**.
2. **Does not own:** Palette JSX, toolbar layout, or **full** `gridDraft` reducers — but **must** be the **only** place that maps **identity → action → payload/link intent** (no copy-paste branches in the route hook).
3. **`handleAuthoringCellClick` becomes thinner:** For **place** mode, it should **call** **`placementRegistryResolver`** (or one exported **`resolvePlacementForCellClick`**) with **`activePlace`**, **`cellId`**, **`hostScale`**, and any minimal flags — then **only** apply **pure** side effects: **`setPendingPlacement`** from **link** result, **`setGridDraft`** append from **object** result (including **stairs** seeding). It **must not** grow new **kind → payload** branches; those stay **inside** the resolver seam.
4. **Toolbar / route wiring:** **No new parallel mapping.** Toolbar components **set **`activePlace`** / UI only** — they **do not** import **`buildPersistedPlacedObjectPayload`**, **`resolvePlacedKindToAction`**, or registry→wire translation. **`LocationEditRoute`** (and similar assembly) **wires props and handlers** — it **does not** add a **second** placement translation path alongside the resolver.
5. **Special-case authored defaults:** **Stairs** **`stairEndpoint`** initialization stays **after** **object** resolution, at **draft creation** time (same layer as today conceptually), **not** inside generic registry rows as if stairs were indistinguishable from props. This **preserves** room for future **stairs-specific** authoring without pretending stairs are fully generic.

**Wrap vs replace:** Prefer **wrapping / re-exporting** **`resolvePlacedKindToAction`** and **`buildPersistedPlacedObjectPayload`** inside **`placementRegistryResolver`** until family+variant inputs are wired — **avoid** two diverging resolver implementations.

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

**Explicit:** **Included** in the **same** Phase 1 palette migration and **same** **`activePlace`** / resolver model — **not** “objects only, linked-content later.”

- **`getPlacePaletteItemsForScale`** already emits **both** **linked-content** and **map-object** rows; the toolbar replaces the rail as the **primary chooser** for **all** of them.
- **Resolver:** **`resolvePlacedKindToAction`** already implements a **distinct** **`link`** branch from **`object`**. Phase 1 **keeps** that **two-family** model: **loaded placement** can resolve to **link intent** or **object payload**, not only cell objects.
- **Out of scope still:** Deep **stairs linking** workflows, rich **post-placement** link editing — only **existing** link + object **placement** behavior.

---

## Persistence stance (Phase 1)

**Preserve** the **current persisted wire shape** for map objects:

- **`LocationMapObjectKindId`** + optional **`authoredPlaceKindId`**

Phase 1 **does not** intentionally change map save semantics or introduce a new persisted identity encoding in **`cellEntries`** for this phase. **Registry family + variant** lives **above** the wire: the **resolver seam** translates to the **existing** payload shape. If a future phase adds persisted variant ids, that is a **separate** migration with explicit cost — **not** Phase 1.

**Category / group:** Remains **presentation metadata** in the registry for toolbar sections — **never** part of persisted authored identity on the map. **Toolbar grouping** and **placement identity** are separate concerns.

---

## Category and grouping (UI-only, reaffirmed)

- **`category`** on **`MapPlacePaletteItem`** / **`activePlace`** (**`linked-content`** vs **`map-object`**) is **UI routing** to pick resolver branch — **not** stored on the map.
- Registry **category/group** fields drive **toolbar sections** only; they **do not** become part of **persisted authored identity**.

---

## Stairs and special-case authoring defaults

- **Stairs** participate in the **registry** and **loaded placement** like other floor **map-object** placeables.
- **Default **`stairEndpoint`** seeding** on new placement remains **explicit** in the **draft-append** path (as today), **not** hidden inside a generic “all objects equal” helper. This **does not** implement **stairs linking** (still out of scope); it **honors** existing **special authoring defaults** and keeps a hook for future **stairs-specific** behavior.

---

## Authored identity contract (durable, above the wire)

- **Top-level registry key** = **family / base kind**; **`variants`** container with **default** variant for Phase 1 palette row.
- **Persisted** cell payloads remain **as today** until a later migration; **family + variant** map through **`placementRegistryResolver`** to **`LocationMapObjectKindId` + optional `authoredPlaceKindId`**.

**Human-readable examples** (intent, not required literal string storage): `door.single.wood`, `table.rect.wood`, `stairs.stone`, `window.narrow`.

---

## Future-facing registry shape (Phase 1)

- **Family key**, explicit **category/group** (presentation), family-level **`runtime`**, **`variants`** with default path; **no** implicit matrix engine. (Unchanged intent from prior revision; see **Guardrails**.)

---

## Family-level shared fields vs variant overrides

- **Default:** **`runtime`** at family level; variant overrides later with documented merge order.

---

## Current-state audit — complete inventory (gate before implementation)

The **starter** inventory (e.g. floor **table** / **stairs** / **treasure**) is **not** sufficient. **Implementation must not begin** until the table below is **complete** for **every** row **`getPlacePaletteItemsForScale`** can emit **and** any **edge** special cases called out in code reviews.

**Required columns (one row per placeable):**


| Column | Content |
| ------ | ------- |
| **Current palette / source kind** | `LocationPlacedObjectKindId` (or equivalent source key) |
| **Placement class** | **`map-object`** \| **`linked-content`** |
| **Current persisted payload or link behavior** | For objects: wire shape + notes; for links: **`pendingPlacement`** / modal flow summary |
| **Proposed registry family key** | Durable family id |
| **Proposed default / current variant id** | Phase 1 default |
| **Category / group** (toolbar) | Presentation only |
| **Placement mode** | `cell` (and note if link uses different UX) |
| **Notes / migration risk / special handling** | e.g. **tree** → **marker** mapping, **stairs** endpoint seeding |

**Output:** Migration-sensitive notes **and** **completed** table — **gate** for coding tasks that change placement or registry wiring.

---

## Registry location and ownership

- **Single module / small tree** under **`domain/authoring/`** (or equivalent); **`placementRegistryResolver`** colocated with or adjacent to existing **`resolvePlacedKindToAction`** / persistence helpers as consolidated.
- **Single source of truth** for palette rows: toolbar **and** rail (during migration) **must not** diverge.

---

## Palette model (toolbar drawer)

- **Primary chooser** for **all** place palette content (**map-object** + **linked-content**), registry-driven sections.
- **One row per family**, default variant; **no** Phase 2 variant picker.
- **Load** → sets evolved **`activePlace`** only (identity + **`category`** for branch routing). **No** payload or resolver calls in toolbar JSX — **no** duplicate mapping.
- **Repeat / clear:** unchanged policy (stay loaded after place; clear on explicit clear, mode change, or other placeable).

---

## Loaded object state model (concrete)

| Topic | Phase 1 rule |
| ----- | ------------ |
| **Shape** | Evolved `activePlace`: registry **family + variant** (default in Phase 1) + **`category`** for branch routing — **not** a duplicate persisted **`cellEntries`** document |
| **Repeat placement** | After place, **stay loaded** |
| **Clear** | Explicit clear, **tool/mode** away from place, or **other placeable** |
| **vs selection** | **`mapSelection`**: inspect; **`activePlace`**: placement intent |

---

## Placement continuity

- **Same** wire shapes and behaviors through **evolved** identity + **consolidated** **`placementRegistryResolver`**.

---

## Toolbar vs rail responsibility split


| Surface | Role |
| ------- | ---- |
| **Toolbar drawer** | **Choose** what to place (all place rows); show loaded placement; set `activePlace` only — **zero** placement translation / payload building |
| **Rail** | **Not** primary chooser; hints / inspect after selection; same rule if rail still shows place items during migration |

**Route / workspace assembly (`LocationEditRoute`, rail panel props):** Pass **handlers** and **refs** to **model** code that calls **`placementRegistryResolver`** — **do not** embed mapping from palette kind → persisted shape in the route file.

---

## Future Phase 2 (variants) — forward note

- Phase 2 extends **same** **`activePlace`** identity and **`placementRegistryResolver`** with **variant** selection — **no** parallel registry.

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


| Area | Cover |
| ---- | ----- |
| **Registry** | Family + variants; single list for palette |
| **Resolver** | **`placementRegistryResolver`** consolidates **`resolvePlacedKindToAction`** + **`buildPersistedPlacedObjectPayload`** + **identity** mapping; **no** scattered translation |
| **Click handler** | **`handleAuthoringCellClick`** delegates **resolution** to the seam; **draft/link** mutations only — **not** a second mapping layer |
| **UI boundaries** | Toolbar + route **do not** add **parallel** `kind → payload` logic |
| **Placement state** | **Single** **`activePlace`** evolved, not duplicated |
| **Persistence** | **Preserve** **`LocationMapObjectKindId` + `authoredPlaceKindId`** |
| **Canonical reference doc** | **[docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)** — update in Phase 1 scope when behavior/symbols change (toolbar vs rail place UX, resolver names, loaded placement); keep “until plans land” vs **shipped** language accurate |

---

## Documentation — `location-workspace.md` (in scope)

Phase 1 **includes** updating **[docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)** so it stays the **accurate** canonical description of the location workspace:

- **Place / palette:** Document **toolbar-first** chooser and **registry-driven** sections once implemented; adjust or remove wording that implies **rail-only** place picking (`LocationMapEditorPlacePanel`, `getPlacePaletteItemsForScale` as *sole* UX) where superseded.
- **Pipeline:** Align **object authoring** / **Map editor toolbar** sections with **`activePlace`** evolution, **`placementRegistryResolver`**, and **linked-content vs map-object** branches as implemented.
- **Cross-links:** Keep links to Phase 1 plan and parent roadmap accurate; avoid contradicting **Imports and barrels** / route boundaries elsewhere in the doc.

**Not** in scope: rewriting unrelated workspace sections (dirty/save, normalization) unless Phase 1 work **touches** them.

---

## Risks / migration notes


| Risk | Mitigation |
| ---- | ---------- |
| Dual loaded vs activePlace | **Option A only** — one field |
| Resolver fork | **Wrap existing** functions inside **`placementRegistryResolver`** |
| Mapping sprawl in toolbar/route | **Explicit** rule: resolver + thin **`handleAuthoringCellClick`** only |
| Incomplete inventory | **Gate** implementation on full table |

---

## Guardrails

### Do

- Ground changes in **audited** pipeline symbols
- **One** **`activePlace`**, **one** resolver **facade**
- **Thin `handleAuthoringCellClick`:** delegate to **`placementRegistryResolver`**, then apply **draft** / **pending** updates only
- **Preserve** wire payload shape in Phase 1

### Do not

- **Abstract** “future resolver” with **no** tie to **`resolvePlacedKindToAction`**
- **Exclude** linked-content from toolbar palette scope
- **Persist** category/group as map identity
- **New parallel mapping** in **toolbar components** (including palette cards, drawers, chips) or **route wiring** (`LocationEditRoute`, rail assembly) — **all** **identity → action → payload** stays in **domain** **`placementRegistryResolver`** (or helpers it owns)

---

## Acceptance criteria

1. **`activePlace`** evolution (Option A) is **explicit**; no ambiguous parallel loaded state.
2. **`placementRegistryResolver`** is **defined** as **consolidation** of **`resolvePlacedKindToAction`** + **`buildPersistedPlacedObjectPayload`** + **identity** mapping — **not** a vague future API.
3. **`handleAuthoringCellClick`** is **thin**: delegates placement **resolution** to the consolidated seam; **does not** reintroduce inlined kind→payload mapping.
4. **No new parallel mapping** in **toolbar** UI or **route** assembly — only **`activePlace`** updates from palette, **resolver** in **model/domain** path on cell click.
5. **Linked-content** is **in scope** for toolbar palette + **same** resolver **branching** model.
6. **Persistence:** **Preserve** **`LocationMapObjectKindId` + optional `authoredPlaceKindId`**; registry sits **above** wire.
7. **Inventory** complete per **expanded** columns **before** implementation (**gate**).
8. **Pipeline mapping** section documents **today → Phase 1** (rail → toolbar, resolver consolidation, orchestration).
9. **Stairs:** defaults stay **explicit** in draft path; linking **out of scope**.
10. **Category** remains **UI-only**; toolbar grouping ≠ persisted identity.
11. Phase 1 **scoped**: palette foundation + **grounded** refactor — **no** Phase 2 variant UX.
12. **[docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)** updated so **canonical** workspace reference matches **shipped** Phase 1 placement/palette/resolver behavior and symbols.

---

## Related

- [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) — canonical reference (Phase 1 deliverable: keep in sync)
- [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md)
- [.cursor/plans/location-workspace/README.md](README.md)
- [location_workspace_cleanup_94269d45.plan.md](../location_workspace_cleanup_94269d45.plan.md)
