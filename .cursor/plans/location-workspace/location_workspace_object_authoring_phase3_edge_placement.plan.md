---
name: Object authoring Phase 3 — edge placement
overview: Edge placement as a new placementMode within the shared authored-object system — square-first hit-testing/snapping, registry + armed state + resolver extensions, edgeEntries wire unchanged, Draw→Place migration for doors/windows with explicit Draw cleanup once stable, shared edge targeting/draft commit core during any overlap, minimal selected-edge rail. Runtime guardrail — no combat/mechanics drift from authoring move alone. No persisted variant field; no hex edge authoring commitment unless canonical docs already require it. Builds on Phases 1–2.
todos:
  - id: target-registry-examples-door-window
    content: Adopt plan target shapes for door/window (allowedScales floor only — no building/room); placementMode edge; table stays cell; resolver/wire notes in plan; no open-state/config
    status: pending
  - id: audit-current-edge-related-flows
    content: Audit door/window/draw flows, edgeEntries model, rendering, rail — map to shared registry, placementMode, placementRegistryResolver seam, armed state (familyKey+variantId+placementMode+target)
    status: pending
  - id: implement-placement-mode-model
    content: Extend registry with placementMode cell|edge; align armed placement state (conceptual shape in plan); palette filters by mode without duplicate registries
    status: pending
  - id: implement-resolver-edge-path
    content: Central resolver module — resolveCellPlacement / resolveEdgePlacement under same ownership; map family+variant to existing cell/edge wire via resolver only
    status: pending
  - id: edge-hit-testing-square-first
    content: Square grid edge hit-testing, snapping, selection order; document hex as non-assumption (no parity commitment)
    status: pending
  - id: draw-to-edge-migration-editor
    content: Editor migration — doors/windows from Draw toward Place edge placement; any temporary Draw+Place overlap must share one edge targeting + draft commit core (no forked edge write paths); preserve existing saves; no save migration unless unavoidable
    status: pending
  - id: remove-draw-door-window-after-place-stable
    content: Explicit cleanup — remove Draw-based door/window authoring once Place-based edge placement is stable; keep Draw boundary-paint for walls (and other non-migrated edge kinds) unless a later plan explicitly removes them
    status: pending
  - id: selected-edge-rail-minimal
    content: Rail — identity, family+variant display, remove/clear, minimal metadata only; defer rich config to Phase 4
    status: pending
isProject: true
---

# Object authoring Phase 3 — edge placement

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Depends on:** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md), [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md).  
**Canonical reference:** [docs/reference/locations/location-workspace.md](../../../docs/reference/locations/location-workspace.md) (Draw tool, `edgeEntries`, workspace constraints). **Do not** treat this plan as superseding canonical docs; if hex edge behavior is not specified there, Phase 3 does **not** commit to implementing it.

**Role:** **Child plan (normative for Phase 3 work)** — architectural decisions below are **locked** unless the roadmap is formally revised.

**Naming:** Plans for this initiative use the shared prefix **`location_workspace_object_authoring_`** (roadmap + phase plans).

---

## Architectural direction (locked)

**Edges are a new `placementMode` within the same authored-object system — not a separate authored-object system.**

- **One** shared authored object registry (extend in place; **no** edge-only registry).
- **One** shared loaded / armed placement philosophy (`familyKey` + `variantId` remain object identity).
- **One** shared resolver **ownership seam** (central module; explicit cell vs edge entry points allowed — see **Decision record**).
- **One** shared **edge targeting + draft commit** core for anything that writes **`edgeEntries`** (Place edge placement and Draw boundary-paint must not diverge on how an `edgeId` resolves and how drafts are updated — see **Draw → Place migration and cleanup**).
- **No** parallel edge-only palette or **ad hoc** toolbar → wire mapping that bypasses the resolver.

---

## Phase 3 decision record (authoritative)

| Topic | Decision |
|-------|----------|
| **Placement model** | Edges are a new **`placementMode`** (`'cell' \| 'edge'`) inside the shared system — **not** a separate object-authoring system. |
| **Armed identity** | **`familyKey` + `variantId`** remain the armed **object** identity (Phase 2 clarity invariant). **Cell vs edge** is **targeting geometry**, carried as **`placementMode`** + **`target`** — **do not** fold `edgeId` into family/variant identity; **do not** introduce an “edge-loaded-object” model that bypasses that invariant. |
| **Registry** | **Single** registry: each family has **`placementMode: 'cell' \| 'edge'`** (e.g. table/tree/building → `'cell'`; door/window → `'edge'`). **No** duplicate families across parallel registries. **`allowedScales`** uses **content-scale** policy (`ContentLocationScaleId` / `CONTENT_LOCATION_SCALE_IDS` semantics — not legacy compatibility unions for **new** authoring defaults). |
| **Resolver** | **One** shared resolver **ownership** seam. **Acceptable:** `resolveCellPlacement(...)` and `resolveEdgePlacement(...)` (or equivalent) **under the same module/owner** — **not** separate ad-hoc resolvers in UI. Edge intents **must not** be built as raw palette payloads in JSX. |
| **Persistence** | Keep **existing `edgeEntries` wire shape** in Phase 3 unless a **later** roadmap revision explicitly changes persistence. **`familyKey` + `variantId`** map to current wire **through the resolver** (resolver-only mapping). **No** new **persisted variant field** for edge objects in Phase 3. **No** save migration **unless** a clearly unavoidable compatibility need is documented. |
| **UX (toolbar)** | **Same** rule as Phase 2: **primary** = arm **default** variant; **secondary** = **picker** when `variantCount > 1`. **Only** difference after arming: **cell** families target **cells**, **edge** families target **edges**. **No** special edge-only palette model in this phase. |
| **Rail scope** | **Minimal** selected-edge inspection only (identity, type, **family + variant** display, remove/clear, light metadata). **Defer** rich door/window state, deep linking/config, generalized edge property editing to **Phase 4**. |
| **Hex** | **Square-first** for edge hit-testing / snapping in Phase 3. **Do not assume** square behavior **generalizes** to hex. **Hex edge authoring is not in scope** for Phase 3 **unless** canonical `location-workspace.md` (or other agreed reference) **already** mandates it — otherwise treat hex edge work as **out of scope / separately designed**, not implied by this roadmap. |
| **Draw → Place migration (doors/windows)** | **Temporary overlap** between Draw and Place for door/window is **acceptable only when needed** for migration. While both exist, they **must** share the **same** edge **targeting** and **`gridDraft` / `edgeEntries` commit** core — **no** parallel implementations that write edges differently. Phase 3 includes an **explicit cleanup** step: **remove Draw-based door/window authoring** once Place-based edge placement is **stable**. |
| **Draw boundary-paint (walls, etc.)** | Migrating doors/windows off Draw **does not** imply removing **Draw-based edge** support for **boundary-paint** workflows such as **walls** (and any other kinds that stay Draw-only in Phase 3). **Wall** (and similar) authoring remains on Draw unless a **later** roadmap plan explicitly moves or removes it. |
| **Runtime / combat semantics** | Moving doors/windows from Draw-oriented authoring to object-oriented **Place** edge placement **must not**, by itself, change **combat or runtime** semantics for those edges. Preserve existing meanings driven from registry **`runtime`** for affected kinds: **`blocksMovement`**, **`blocksLineOfSight`**, **`combatCoverKind`** (and **`isMovable`** where applicable) — aligned with what the same `edgeEntries` **kind** already implied for gameplay. **Richer** door/window **state**, mechanics changes, or new tactical behaviors are **out of scope** for Phase 3 and belong to **Phase 4+** (config / editing / mechanics plans). |

---

## Armed placement state (intended shape — conceptual)

Exact TypeScript names may differ in code; the **semantic** contract is:

- **Object identity** = **`familyKey` + `variantId`** (unchanged from Phase 2).
- **Targeting** = **`placementMode`** (`'cell' | 'edge'`) + **`target`** (nullable while arming).

**Do not** encode `edgeId` as part of family/variant identity.

```ts
// Conceptual — implementation may use equivalent fields / naming (e.g. LocationPlacedObjectKindId for familyKey)
type ArmedPlacementState =
  | {
      kind: 'map-object';
      familyKey: AuthoredPlacedObjectFamilyKey;
      variantId: string;
      placementMode: 'cell';
      target: { cellId: string } | null;
    }
  | {
      kind: 'map-object';
      familyKey: AuthoredPlacedObjectFamilyKey;
      variantId: string;
      placementMode: 'edge';
      target: { edgeId: string } | null;
    }
  | {
      kind: 'linked-content';
      // existing linked-content shape remains separate — unchanged by edge work
    };
```

**Linked-content** remains a **separate** branch from **map-object**; edge placement applies to **map-object** families with `placementMode: 'edge'`.

---

## Registry direction (locked)

Extend the **existing** placed-object registry — **one** definition shape per family, e.g.:

```ts
type PlacementMode = 'cell' | 'edge';

// Conceptual alignment with registry — names may match locationPlacedObject.registry.ts evolution
type AuthoredPlacedObjectFamilyDefinition = {
  category: PlacedObjectPaletteCategoryId;
  placementMode: PlacementMode;
  allowedScales: ContentLocationScaleId[];
  defaultVariantId: string;
  runtime: AuthoredPlacedObjectRuntimeFields;
  variants: Record<string, AuthoredPlacedObjectVariantDefinition>;
  // … existing optional fields (linkedScale, interaction, …)
};
```

**Examples:** `table`, `tree`, `building` → `placementMode: 'cell'`; **door**, **window** (and similar) → `placementMode: 'edge'`.

**Forbidden:** a second registry file for edges; duplicate family keys for the “same” object as cell vs edge.

---

## Target registry examples — `door` / `window` (modeling direction, pre-implementation)

**Purpose:** Remove ambiguity before Phase 3 implementation by locking **concrete** example shapes for new **edge** families. These are **targets** for registry evolution — exact field names must match `locationPlacedObject.registry.ts` / `AuthoredPlacedObjectFamilyDefinition` in code when implemented.

**Conventions (aligned with Phase 2 / Phase 3):**

- **Single** shared authored-object registry — **no** edge-only registry.
- **`placementMode: 'cell' | 'edge'`** — `door` / `window` use **`'edge'`**.
- **Family-level `runtime`** — same `AuthoredPlacedObjectRuntimeFields` as today (`blocksMovement`, `blocksLineOfSight`, `combatCoverKind`, `isMovable`).
- **`defaultVariantId`** — required; points at a **concrete** key in `variants` (no magic `default` key unless that key is the default id).
- **Variants** — **concrete keys only** (`single_wood`, …); presentation-only hints under `presentation`.
- **Not in scope for these examples:** open/closed state, locks, hinges, linking, or other **config** — **Phase 4** or later.

**Implementation notes:**

- **`iconName`** values must exist on **`LocationMapGlyphIconName`** (or add glyphs when implementing). Placeholder names below are **intent**, not a guarantee the icon exists today.
- **`allowedScales` for these examples:** **`building` and `room` are intentionally omitted** — use **`['floor']` only** below so edge door/window placement is modeled as **floor-map** interior edge work first. Other content scales (e.g. `city`, `site`, `world`) may apply to **other** edge families later; do **not** reintroduce `building` or `room` into these two examples without revisiting product intent.

### Example `door` (target)

```ts
door: {
  category: 'structure',
  placementMode: 'edge',
  allowedScales: ['floor'],
  defaultVariantId: 'single_wood',
  runtime: {
    blocksMovement: true,
    blocksLineOfSight: true,
    combatCoverKind: 'none',
    isMovable: false,
  },
  variants: {
    single_wood: {
      label: 'Door',
      description: 'Single-leaf wood door.',
      iconName: 'door',
      presentation: {
        material: 'wood',
        form: 'single-leaf',
      },
    },
    double_wood: {
      label: 'Double Door',
      description: 'Double-leaf wood door.',
      iconName: 'door',
      presentation: {
        material: 'wood',
        form: 'double-leaf',
      },
    },
  },
},
```

### Example `window` (target)

```ts
window: {
  category: 'structure',
  placementMode: 'edge',
  allowedScales: ['floor'],
  defaultVariantId: 'glass',
  runtime: {
    blocksMovement: true,
    blocksLineOfSight: false,
    combatCoverKind: 'none',
    isMovable: false,
  },
  variants: {
    bars: {
      label: 'Barred Window',
      description: 'Window opening secured with bars.',
      iconName: 'window',
      presentation: {
        type: 'bars',
      },
    },
    glass: {
      label: 'Window',
      description: 'Standard glass window.',
      iconName: 'window',
      presentation: {
        material: 'glass',
        type: 'plain',
      },
    },
    stained_glass: {
      label: 'Stained Glass Window',
      description: 'Decorative stained glass window.',
      iconName: 'window',
      presentation: {
        material: 'glass',
        type: 'stained-glass',
      },
    },
    shutters: {
      label: 'Shuttered Window',
      description: 'Window with wooden shutters.',
      iconName: 'window',
      presentation: {
        material: 'wood',
        type: 'shutters',
      },
    },
  },
},
```

### Intent of these examples (modeling guidance)

Use these as **planning / registry-shape review** targets for the edge-placement pass — **not** a commitment that every field lands verbatim in the first PR.

- **`door`** and **`window`** are **edge** families (`placementMode: 'edge'`); **`table`** remains a **cell** family (`placementMode: 'cell'`) in the same registry.
- **Family-level `runtime`** stays **separate** from **variant-level `presentation`** (authoring/render hints only).
- **No** persisted variant field is introduced by these examples (resolver-only mapping, same Phase 2 bar).
- **No** deep door/window **config/state** editing in Phase 3 — open/close, locks, etc. stay **Phase 4+**.

### Type-shape / implementation callouts (from these examples)

| Concern | Guidance |
|---------|----------|
| **`placementMode`** | Registry type must allow **`'cell' \| 'edge'`** on every family; existing entries default to **`'cell'`** when the field is added. |
| **`allowedScales`** | Stays **`ContentLocationScaleId[]`** — examples deliberately use **`['floor']` only** (no `building`, no `room`). |
| **`AuthoredPlacedObjectVariantPresentation`** | Keep **flexible** optional keys (`material`, `shape`, `form`, `type`, `size`, …) — `window` uses **`type`**-heavy shapes (`bars`, `stained-glass`, `shutters`) and omits `material` where irrelevant; **no** new strict per-family presentation union is required for Phase 3 **unless** product wants stricter typing later. |
| **Resolver / wire — edge families** | **Same** `familyKey` + `variantId` → resolver → **existing** wire; **edge** adds **target `edgeId`**. Mapping **`door` / `window` variants** → `edgeEntries` **kind** (and any edge payload fields) may need **per-family or per-variant** rows in resolver helper tables — **centralize** in `resolveEdgePlacement` (or equivalent), **not** in palette. If today’s `edgeEntries` only store coarse kinds (`door` \| `window`), resolver picks kind from **family** and may **ignore** variant for wire until a later phase — **document** that behavior when implementing. |
| **Runtime vs presentation** | Do **not** derive `blocksMovement` / `blocksLineOfSight` / `combatCoverKind` from `presentation` in Phase 3 — family **`runtime`** remains authoritative; variant presentation is **display/tooltip/render** only. **Authoring migration** (Draw → Place) must **not** change the effective runtime interpretation of existing edge kinds unless a **later** mechanics phase explicitly changes it. |

---

## Resolver ownership (locked)

- **Single** place of ownership (the existing **`placementRegistryResolver`** seam / module — exact file layout may evolve).
- **Allowed:** two **explicit** entry points, e.g. **`resolveCellPlacement`** and **`resolveEdgePlacement`**, plus shared helpers — all under that **same** owner.
- **Forbidden:** mapping edge placement only from toolbar-local objects; **forbidden:** divergent wire-mapping rules outside the resolver.

---

## Wire + migration (locked)

- **Continue writing** the **current** `edgeEntries` (and related) wire shapes for new edge placement.
- **`familyKey` + `variantId`** → payload via **resolver**, same **resolver-only** spirit as Phase 2 cell objects (no variant column on wire in Phase 3).
- **Migration focus:** **editor** behavior and **placement flow** (doors/windows **off Draw** toward **Place** edge placement), **not** a persistence redesign.
- **Existing saves** must **keep working** without a migration pass **unless** an unavoidable compatibility need is proven and documented.

---

## Draw → Place migration and cleanup (locked)

**Goal:** Doors and windows (and agreed edge kinds) are authored primarily via **Place** (`placementMode: 'edge'`), not as separate ad hoc Draw tools, while **walls** and other **boundary-paint** Draw edge workflows remain valid **unless** a future plan says otherwise.

1. **Shared core (non-negotiable):** Any code path that adds or replaces **`edgeEntries`** — including **Draw** boundary-paint strokes and **Place** edge clicks — must go through **one** shared **edge targeting + draft commit** layer (same `edgeId` resolution, same replace/no-op rules against existing entries, same write into **`gridDraft`**). **Forbidden:** maintaining two independent “how we write an edge” implementations during overlap.
2. **Temporary overlap:** If both Draw and Place expose door/window for a transition window, overlap is **only** for migration safety; keep it **short** and **document** the removal milestone.
3. **Explicit cleanup:** Phase 3 is **not complete** until **Draw-based door/window authoring** is **removed** from the Draw palette / draw flow, once Place-based edge placement for those kinds is **stable** (behavior reviewed, no critical regressions). Track as a **deliverable**, not an optional follow-up.
4. **Walls unchanged by default:** Removing door/window from Draw **does not** remove **wall** (or other) **Draw → edge** boundary-paint. **Do not** treat Phase 3 as “delete Draw edges”; treat it as **narrowing Draw** to the edge kinds that still belong there per product.

---

## Variant + palette UX (locked)

- **Toolbar parity** with Phase 2: primary arms default variant; secondary opens picker when multiple variants.
- **After** arming, **interaction differs by geometry**: pick **cells** vs pick **edges** — not a different **family/variant** model.
- **No** edge-specific palette taxonomy in Phase 3.

---

## Hex: scope constraint (not a roadmap commitment)

- Phase 3 implements edge placement **square-first** (hit-testing, snapping).
- The plan **does not** assume that square edge behavior **automatically generalizes** to hex — that is a **non-assumption** and **risk guardrail**, **not** a promise to ship hex edge authoring.
- **Hex edge authoring** remains **out of scope** for Phase 3 **unless** canonical documentation **already** requires it; if a future phase needs hex parity, that phase must **explicitly** design it. **Brief safe wording:** *“Hex parity is not assumed in this phase.”*

**Do not** add hex edge treatment to the roadmap from this plan alone.

---

## Rail scope (locked)

**In scope (Phase 3):** Selected-edge **inspection** and **minimal** actions, e.g.:

- Selected edge **identity** / kind
- **Family + variant** display (resolver/registry metadata)
- **Remove / clear** (or equivalent minimal destructive action)
- **Light** metadata display where needed

**Out of scope (Phase 3 → defer to Phase 4):**

- Rich **door/window state** editing
- Deep **linking / configuration** flows
- Generalized **edge property** editing systems

---

## Alignment with Phase 2 (unchanged principles)

Phase 2 remains **normative** where not superseded by the **decision record** above. In particular:

- **`familyKey` + `variantId`** clarity invariant; **no** bare family in armed state.
- **Resolver-only** variant mapping to wire (no new persisted variant field).
- **Scale vocabulary** for **new** authoring: content scales / policy — not `LOCATION_SCALE_IDS_WITH_LEGACY` as the default source for “what to offer.”
- **`combatCoverKind`** semantics unchanged; Phase 3 does not redefine combat rules.

### Runtime / combat semantics (guardrail)

- **Authoring move ≠ mechanics change:** Re-homing door/window from **Draw** to **Place** is an **editor and registry** change. It **must not** alter how encounters or grid mechanics interpret **`edgeEntries`** for **`door`** / **`window`** **kinds** relative to **today’s** behavior, except for bugs explicitly fixed under a separate ticket.
- **Preserve registry `runtime` meanings:** **`blocksMovement`**, **`blocksLineOfSight`**, **`combatCoverKind`**, and **`isMovable`** on edge families remain the **authoritative** authoring-side declaration; they should stay **consistent** with existing gameplay expectations for those edge kinds. **Do not** “simplify” or reset runtime fields as a side effect of the migration without product/mechanics sign-off.
- **Deferred:** Open/closed doors, locks, interactive state, and other **rich** door/window behavior — **Phase 4+** only (see **Rail scope** and Phase 4 plan).

---

## Phase purpose (summary)

Introduce **edge-authored placement** so boundary objects (starting with **doors/windows**) are first-class in the **same** registry and placement pipeline as cell objects — with **`placementMode: 'edge'`**, **square-first** targeting, **shared** edge write core with Draw, **explicit removal** of Draw door/window once stable, and **minimal** rail inspection — **without** changing combat/runtime semantics for existing edge kinds.

---

## Roadmap context

| Phase | Focus |
|-------|--------|
| 1 | Palette foundation — registry, toolbar, loaded state, cell click-to-place |
| 2 | Variants — familyKey + variantId; resolver-only wire; toolbar UX; vocabulary guardrails |
| **3** | **Edge placement** — `placementMode`, edge targeting, resolver edge path, Draw→Place migration + **Draw door/window cleanup**, shared edge commit core, minimal rail; **no** runtime/mechanics drift |
| 4 | Config / editing — richer rail, door/window state, stairs linking, deep edge config |

---

## In scope

- **Target `door` / `window` registry shapes** — see **Target registry examples** (concrete defaults before implementation)
- **`placementMode`** (`cell` / `edge`) in **shared** registry; palette/filter behavior by mode
- **Armed state** model: **familyKey + variantId** + **placementMode** + **target** (cellId vs edgeId)
- **Resolver:** shared ownership; **cell** vs **edge** entry points as needed
- **Square-first** edge hit-testing and snapping
- **Shared edge targeting + draft commit core** — Draw boundary-paint and Place edge placement both use it; **no** duplicate edge-write paths during migration overlap
- **Doors/windows** (and agreed types) migrating **off Draw** toward **Place** edge placement **without** breaking saves
- **Explicit cleanup:** remove **Draw-based door/window** authoring after Place edge placement is **stable**; **keep** Draw **wall** (and other non-migrated) boundary-paint unless a **later** plan removes it
- **Runtime parity:** preserve **`blocksMovement`**, **`blocksLineOfSight`**, **`combatCoverKind`** (and related) semantics for affected edge kinds — authoring move alone does not change combat/runtime behavior
- **Rail:** minimal selected-edge inspection + actions listed above

---

## Out of scope

- **Persisted variant field** on edge (or cell) wire in Phase 3
- **Save migration** unless unavoidable and documented
- **Hex edge authoring** / hex–square **parity** as a Phase 3 deliverable (**unless** canonical docs already mandate it — treat as **separate** if not)
- **Rich** rail editing (**Phase 4**)
- **Parallel** edge-only registry or **bypass** resolver paths
- **Mechanics / combat behavior changes** tied to doors/windows **beyond** preserving existing edge-kind semantics (e.g. new open/closed rules, cover changes, movement rules) — **Phase 4+** or dedicated mechanics work
- **Removing Draw-based wall** (or other boundary-paint edge kinds) **unless** a **later** plan explicitly schedules that removal

---

## Dependencies on earlier phases

### Phase 1

Registry, palette, loaded state, `placementRegistryResolver` seam, toolbar vs rail split.

### Phase 2

`familyKey` + `variantId`, default + picker UX, resolver-only cell wire, scale/`combatCoverKind` docs.

Build on these — **no** bypass.

---

## Risks

- **Draw** coupling for doors/windows — mitigated by **shared edge core** and **explicit Draw cleanup** milestone
- **Duplicate edge write paths** during migration overlap (Place vs Draw) — **high** risk if not forced through one targeting/commit module
- Edge **geometry** / snapping UX on square
- **Scope creep:** rail, hex, persistence, or **mechanics** changes disguised as migration
- **Bypassing** resolver or **duplicating** families
- **Accidentally** using legacy scale unions for **new** edge-tool gating
- **Runtime drift:** registry `runtime` or consumer code changes that alter **`blocksMovement` / `blocksLineOfSight` / `combatCoverKind`** for door/window **without** explicit intent

---

## Guardrails

### Do

- Keep **one** registry, **one** resolver owner, **one** armed identity rule
- Map **family + variant** → **existing** wire through resolver
- Preserve **saves**
- Unify **edge targeting + `edgeEntries` draft commits** across **Draw** and **Place** for the duration of any overlap
- **Remove** Draw door/window authoring once Place edge placement is **stable** (Phase 3 completion criterion)
- Preserve **combat-relevant** semantics (`blocksMovement`, `blocksLineOfSight`, `combatCoverKind`, `isMovable`) for edge kinds when migrating authoring surfaces

### Do not

- **Ad hoc** wire mapping in palette/components
- **Assume** hex === square
- **Expand** Phase 3 into hex edge features **unless** canonical docs already require them
- **Fold** `edgeId` into family/variant identity
- Maintain **two** independent implementations for writing **`edgeEntries`** (Draw vs Place) beyond a **short**, **documented** migration overlap
- Change **runtime / encounter** behavior for door/window **edges** as an **implicit** side effect of editor migration — mechanics changes need **explicit** scope (Phase 4+)
- Remove **Draw wall** (or other non-migrated boundary-paint) **by default** — only if a **later** plan requires it

---

## Implementation details intentionally open (after this refinement)

These are **acceptable** to decide during implementation without revising this decision record:

- Exact **type names** and **file** splits (`ArmedPlacementState` vs evolving `LocationMapActivePlaceSelection`)
- Whether **`resolveEdgePlacement`** lives in the same **file** as cell resolution or a **colocated** sibling — as long as **ownership** stays one module/seam
- **Which** edge families ship first (doors/windows vs others) within Phase 3 scope
- **Pointer** details for hover vs select order on edges (square)

---

## Acceptance criteria (Phase 3 plan document)

This plan is **fit for implementation** when contributors can answer **without ambiguity**:

1. **Where** do edge families live? → **Same** registry, **`placementMode: 'edge'`**.
2. **What** is armed identity? → **`familyKey` + `variantId`**; **target** is separate.
3. **Where** does wire mapping live? → **Resolver** (cell + edge entry points, **one** owner).
4. **What** changes on disk? → **No** new variant field; **existing** `edgeEntries` shape unless roadmap revision says otherwise.
5. **What** about hex? → **Square-first**; **no** assumed parity; **no** implicit hex edge roadmap from this phase.
6. **What** about rail? → **Minimal** inspection only; **deep** editing **Phase 4**.
7. **What** happens to Draw door/window? → **Removed** after Place edge is **stable**; overlap only if needed, with **one** shared edge targeting/commit core.
8. **What** happens to Draw walls? → **Remain** on Draw boundary-paint **unless** a **later** plan says otherwise.
9. **What** about combat/runtime? → **Unchanged** by authoring migration alone; preserve **`blocksMovement`**, **`blocksLineOfSight`**, **`combatCoverKind`** meanings for existing kinds; richer state = **Phase 4+**.

---

## Related

- [location_workspace_object_authoring_phase2_variants.plan.md](location_workspace_object_authoring_phase2_variants.plan.md)
- [location_workspace_object_authoring_phase4_config_editing.plan.md](location_workspace_object_authoring_phase4_config_editing.plan.md)
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)
- [.cursor/plans/location-workspace/README.md](README.md)
