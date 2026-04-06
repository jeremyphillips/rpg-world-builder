---
name: Object authoring Phase 2 — variants
overview: Phase 2 extends Phase 1 with grouped variant UX (picker, counts, tooltips). Decision record locks persistence (resolver-only), family-scoped variant ids, required registry field defaultVariantId, loaded state as familyKey + variantId, wire mapping, map-object-first picker scope, linked-content non-regression, interaction defaults, UI hierarchy, stairs, docs.
todos:
  - id: audit-phase1-foundation
    content: Confirm what Phase 1 established for registry structure, palette sections, loaded object state, and click-to-place so variant support extends that model rather than bypassing it
    status: pending
  - id: define-variant-model
    content: Registry families include required defaultVariantId + wider variants map; loaded activePlace uses familyKey + variantId per decision record; no UI grouping as persistence
    status: pending
  - id: design-variant-selection-ux
    content: Define how palette items expose variant availability, when default selection is enough, and when a popover or modal picker should appear
    status: pending
  - id: wire-registry-driven-tooltips
    content: Add richer tooltip metadata driven from the authored object registry so base items and variants have inspectable metadata before placement
    status: pending
  - id: preserve-placement-contract
    content: Variant selection feeds familyKey + variantId into placementRegistryResolver; linked-content city/building/site non-regression on link branch and pendingPlacement
    status: pending
  - id: tests-and-docs
    content: Add focused tests and docs for variant grouping, picker behavior, default variant selection, and tooltip metadata expectations
    status: pending
isProject: true
---

# Object authoring Phase 2 — variants

**Parent:** [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md)  
**Depends on:** [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md) — family-first registry, `**placementRegistryResolver`** seam, loaded identity + context, toolbar drawer palette, click-to-place for cell objects.  
**Canonical reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)

**Role:** **Child plan (implementation)** — scoped to **Phase 2** of the object authoring roadmap.

---

## Objective

Add **variant-aware object authoring** so the palette can represent **families** of placeables without overwhelming first-level UI: one base tile per family when appropriate, clear **variant count** affordances, **intentional** variant selection via a picker, **registry-driven** tooltips (family + variant), and **resolved placement intent** (family + variant identity) that feeds the **same** `**placementRegistryResolver`** + click-to-place pipeline as Phase 1.

---

## Phase 2 modeling cleanup (content scales vs map zones + `combatCoverKind`)

**Scope:** Naming and policy clarity only — no migration of legacy persisted rows, no combat-system redesign, no map-zone rendering rewrite.

- **Content scales vs map zone kinds:** In `shared/domain/locations/location.constants.ts`, **first-class content scales** (`CONTENT_LOCATION_SCALE_IDS`, plus `SURFACE_CONTENT_LOCATION_SCALE_IDS` / `INTERIOR_CONTENT_LOCATION_SCALE_IDS` groupings) are separate from **map zone kinds** (`LOCATION_MAP_ZONE_KIND_IDS` — `region`, `subregion`, `district`). **`LOCATION_SCALE_RANK_ORDER_LEGACY`** is **sorting/ranking only** for historical rows; it must not imply creatable content scales. **Authoring** `allowedScales` on placed-object registry families use **content scales only** (e.g. `tree` / `building`: `world` \| `city` \| `site`).
- **`combatCoverKind`:** Renamed from `coverKind` on `GridObject` and registry `runtime` — D&D-style tactical combat cover when the object is **used as cover**; does **not** drive movement blocking or line of sight (`blocksMovement` / `blocksLineOfSight`). Type alias `CombatCoverKind` in `packages/mechanics/.../space.types.ts`; `GridObjectCoverKind` kept deprecated.
- **Building default:** Registry `building.runtime.combatCoverKind` defaults to **`none`** (footprint markers are not assumed to grant tactical cover until explicitly modeled).
- **Persistence alignment:** `mapPlacedObjectKindToPersistedMapObjectKind` maps `tree` / `building` → `marker` when host scale is `world` \| `city` \| `site` (aligned with palette `allowedScales`).

**Remaining legacy surface:** `region` / `subregion` / `district` may still appear as persisted `location.scale` and in **campaign list** filters (`CAMPAIGN_LOCATION_LIST_SCALE_IDS`); use **MapZone** on parent maps for new subdivisions.

### Follow-up: vocabulary guardrails (docs + comments — **no behavior change**)

**Goal:** Reduce future misuse of compatibility/sort/filter constants vs new-authoring vocabulary.

**Done in this pass:**

- **`location.constants.ts`:** Table-style “which constant for which job”; stronger per-constant docs for `LOCATION_SCALE_IDS_WITH_LEGACY`, `CAMPAIGN_LOCATION_LIST_SCALE_IDS`, `LOCATION_SCALE_RANK_ORDER_LEGACY`.
- **`location.types.ts` / `locationEntity.types.ts`:** `LocationScaleId`, `CampaignLocationListScaleId`, and persisted `scale` field clarify compatibility vs creatable semantics.
- **`scale/locationScale.rules.ts`:** Module doc distinguishes `isContentLocationScaleId` vs `isValidLocationScaleId` vs legacy zone id vs rank.
- **`LOCATION_SCALE_MAP_CONTENT_POLICY`:** Comment that keys include legacy scales for exhaustive `Record<LocationScaleId, …>` — empty buckets are not “new authoring” endorsement.
- **UI helpers:** Comments on `LOCATION_SCALE_OPTIONS_WITH_LEGACY` (edit display), `LOCATION_SCALE_FILTER_OPTIONS` (list chips), `sortLocations` (rank bridge only).
- **`placed object registry` + mechanics `GridObject`:** Central docs for `blocksMovement` / `blocksLineOfSight` / `combatCoverKind` separation.
- **`docs/reference/locations.md`:** Vocabulary table + map policy note.

**Audit:** No incorrect usages found that required code changes (create/list/form paths already use the appropriate surface vs `LOCATION_SCALE_IDS_WITH_LEGACY` where legacy display/filtering is intended).

**Intentionally unchanged (behavior / product):** Default `combatCoverKind` values per family (e.g. tree/table half, linked markers none); legacy ranking; persisted scale model.

---

## Phase 2 decision record (authoritative)

**Purpose:** Lock architectural and UX forks **before** implementation so work does not revisit persistence, id scope, linked-family scope, or interaction defaults mid-pass. This block is **normative** for Phase 2 PRs unless the roadmap is formally revised.

### Persistence strategy — **Option A: resolver-only variants above existing wire**

- **Registry + `activePlace` + picker + `placementRegistryResolver`** carry **familyKey + variantId** for authoring and resolution (see **Loaded placement state** below).
- **Persisted cell object wire** remains **unchanged in Phase 2:**
  - `LocationMapObjectKindId`
  - optional `authoredPlaceKindId`
- **No** new persisted variant field (or parallel authored identity column) in Phase 2 — **no** save/load/normalization migration for variant ids on the wire in this phase.
- Phase 2 is **registry + loaded-state + resolver + UI evolution**, **not** a persistence schema change.

*(Option B — additive persisted variant field — is **out of scope** for Phase 2; a future phase would require an explicit migration plan and doc updates.)*

### Loaded placement state — **`familyKey` + `variantId`**

- **Canonical loaded identity** for the place tool is **`familyKey` + `variantId`** (both required in the evolved type — Phase 1’s optional `variantId` becomes **required** once Phase 2 lands, defaulting to **`defaultVariantId`** for single-variant families).
- **`familyKey`:** the **top-level registry key** (`LocationPlacedObjectKindId` — e.g. `table`, `stairs`, `city`). Same value Phase 1 currently stores as **`kind`** on `LocationMapActivePlaceSelection`; Phase 2 treats that field as the **family key** (rename to `familyKey` in types **or** document **`kind` ≡ `familyKey`** — **one** choice in implementation PR, no duplicate divergent names).
- **`variantId`:** **family-scoped** variant id; must exist as a key in **`variants[familyKey]`** (or be **`defaultVariantId`** for that family).
- **`activePlace.category`** (`linked-content` \| `map-object`) remains the **resolver routing** discriminant — **orthogonal** to **`familyKey` + `variantId`**. Loaded state is always a **resolved** pair, never “family only.”

### Variant id scope — **family-scoped**

- Variant ids are **unique within a family** only (e.g. family `table`, variants `rect_wood`, `circle_wood`, …; **default** id comes from **`defaultVariantId`**, not from a mandatory `variants.default` key).
- **Globally unique variant ids across all families** are **not** required in Phase 2 — avoids unnecessary coupling and keeps selectors/resolver signatures simple (`familyId` + `variantId` pair is canonical).
- Display strings and tooltips come from **registry metadata**, not from encoding global uniqueness into raw ids.

### Family + variant → wire mapping

- **Default rule:** All variants of a family resolve through a **single, centralized path** — **`placementRegistryResolver`** (and helpers it owns) together with **registry data** — to the **existing** payload shape. Variant rows **do not** embed ad hoc “wire kind” overrides that bypass the resolver.
- **Typical expectation for Phase 2:** Variants of one family usually map to the **same** `LocationMapObjectKindId` / `authoredPlaceKindId` pair as today for that family (visual/metadata differ; wire identity unchanged). Where product **later** needs different wire kinds per variant, that mapping lives **only** in resolver/registry mapping tables — **never** in palette JSX or unconstrained per-variant hooks.
- **No bypass:** Variant metadata must **not** define wire mapping in a way that skips the resolver.

### Linked-content families — **initial Phase 2 scope: map-object families only**

- **Grouped variant UX** (family tile, variant count, picker, primary/secondary interaction) ships for **`map-object`** families first (e.g. floor props with multiple registry variants).
- **Linked-content** families (`city`, `building`, `site`) remain **single-variant toolbar rows** in Phase 2 initial implementation — **no** multi-variant picker for those rows yet unless/until a follow-up explicitly expands scope.
- **Rationale:** Reduces coupling to link modal + `pendingPlacement` flows while proving the variant model; registry **`category`** and palette sectioning remain **shared** across both row types.
- Toolbar may still show **structure** (or other buckets) for linked rows alongside map-object families; only **variant-picker rollout** is narrower.

**Linked-content non-regression (Phase 2):** Work on **map-object** variant UX **must not** regress linked placement. **Acceptance:** selecting **`city`**, **`building`**, or **`site`** and clicking a cell still produces the **same** **`link`** resolution path as Phase 1 (`**resolvePlacedKindToAction`** → **`pendingPlacement`** with correct **`linkedScale`** / host-scale behavior and linked-location modal). No bypass of **`placementRegistryResolver`**; no change to **`linked-content`** vs **`map-object`** routing semantics for those families.

### Default interaction model — **Option A (primary = default, secondary = picker)**

- **Primary click** on a family tile **loads the family’s default variant** into `activePlace` as resolved **family + variant** (including **single-variant** families — still a resolved variant, not a bare family).
- When **`variantCount > 1`**, a **secondary affordance** (e.g. chevron, count badge, “more”) **opens the variant picker** without changing the rule that primary click = default variant for fast repeat placement.
- **Option B** (primary opens picker whenever multiple variants exist) is **not** the default — too slow for repeat placement; use only if a **family-specific** exception is justified and documented.
- **Option C** (family-specific rules) is **rare**; the **default** product rule above applies unless an exception is listed in registry notes and tests.

**Clarity invariant:** Loaded state always reflects **`familyKey` + resolved `variantId`** after any click path — never “unresolved family” as a placeable selection.

### Category → family → variant (UI hierarchy)

**Single hierarchy** (prevents competing grouping dimensions):

1. **Category section** — registry `paletteCategory` (`structure`, `furniture`, …), same as Phase 1 section headers.
2. **Family tile** — one interactive tile per **family** when multi-variant UX applies; single-variant families behave as today (tile = family + implicit default).
3. **Variant picker** — popover or modal listing **variants for that family only**; commits to `activePlace` as resolved **family + variant**.

Picker is **not** a parallel “second palette”; it is **scoped under** the family tile.

### Registry typing — wider `variants` map + **`defaultVariantId`** (chosen)

- Phase 2 **generalizes** each family’s **`variants`** from a single entry to a **record** of **family-scoped** variant id → variant definition.
- **Chosen convention:** every family record includes a required **`defaultVariantId`** field (string). It **must** equal **one of the keys** in that family’s **`variants`** map. **Primary click** resolves to **`variantId === defaultVariantId`** — **no** inferring default from a magic key name (e.g. assuming the key is always literal `default`).
- **Phase 1 migration:** existing single-variant families add **`defaultVariantId: 'default'`** (or whichever key exists) alongside current **`variants.default`** entries.
- Selectors expose **`getDefaultVariantIdForFamily(familyKey)`** (or equivalent) reading **`defaultVariantId`** from the registry — palette, loaded state, and resolver consume **only** this helper + explicit **`variantId`**, not ad hoc key checks.

### Special case: stairs

- Variant selection may change **stairs** presentation/metadata (labels, icons, future art).
- **`stairEndpoint`** seeding (e.g. default direction) remains **draft-creation / append-object** responsibility in the same layer as Phase 1 — **not** moved into generic variant row definitions as if every object shared that behavior.
- Resolver/draft boundary: **resolver** yields object intent + payload shape; **draft append** applies stairs-specific defaults — do not collapse that into variant registry entries.

### Documentation alignment

- After this decision record is adopted, update **`docs/reference/location-workspace.md`** so it does **not** imply **variant-on-wire** persistence (Phase 2 uses **resolver-only** wire shape).
- Document **picker behavior**, **family-scoped variant ids**, **map-object-first variant UX**, and **primary/secondary interaction** in the reference doc so contributors do not see **contradictory** Phase 1 vs Phase 2 guidance.
- If a **future** phase adds additive persistence, that phase must **explicitly** revise this doc — Phase 2 PRs should not half-update persistence wording.

---

## Why variants are Phase 2

The parent plan sequences **palette foundation** before **variants** so registry and loaded placement exist before layering grouping semantics. Phase 2 adds **scalability** to the palette (families, defaults, pickers) **without** pulling in edge placement (Phase 3) or deep rail editing (Phase 4).

---

## Parent layer boundaries (unchanged)

This phase preserves the same separation as the parent:


| Layer                 | Phase 2 responsibility                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Registry/domain**   | Kind, family/group, variant ids, defaults, per-variant metadata, tooltip fields                                   |
| **Placement model**   | Picker → loaded **`familyKey` + `variantId`**; `**placementRegistryResolver`** at place time to existing payloads |
| **Persistence model** | Phase 2 **decision record:** **no** new variant field on wire — resolver maps family+variant → existing `LocationMapObjectKindId` + optional `authoredPlaceKindId`; no UI-only “family” as source of truth |
| **UI presentation**   | Count indicators, picker chrome, tooltip rendering — **reads** registry                                           |


**Core principle:** Variants are a **registry/domain concept with presentation affordances**, not one-off UI branches. **Do not** let palette grouping become the persistence model.

---

## Dependencies on Phase 1

Phase 1 **locks** the following — Phase 2 **must extend** them, **not** replace or bypass:

- **Registry:** **Family-first** top-level keys; explicit `**variants`** container; **`category`** = **UI palette bucket only** (`structure`, `furniture`, … — see Phase 1 **Category vs `interaction` vs linking**); **`interaction`** (or equivalent) = **behavior semantics**, **not** mixed into `category`; **no** **`linked-locations`** **palette** category as behavioral catch-all; family-level shared `**runtime`** with optional future variant overrides.
- **Link/reference:** Toolbar chooses **family + variant**; optional **linking** stays **authored configuration** (inspector / rail) per Phase 1 — Phase 2 variant UX **does not** encode link state in **`category`**.
- `**placementRegistryResolver`:** Single seam from **family + variant identity** → **existing** authored cell payload shape.
- **Loaded object state:** **`familyKey` + `variantId`** (see **decision record**) **+** minimal placement context — **not** a second canonical copy of the full persisted cell payload as default.
- **Palette:** Toolbar drawer consumes the **same** registry as any other placeable UI — **no** parallel placeable lists.

Before implementation, **audit** the actual Phase 1 code against the above and the Phase 1 **placeables inventory**.

Phase 2 **extends** these foundations. **Bypassing** them with variant-only parallel registry or resolver paths is out of scope.

---

## Proposed registry model for variants (design direction)

Phase 1 already commits to **one registry family** (top-level key) with **explicit `variants`**. Phase 2 **does not** re-litigate family-vs-flat registry structure.

**Bias:**

- **One palette row per family** maps to **one registry family** with a stable **family id** (the top-level key).
- **Each variant** has a stable **variant id** **family-scoped** — see **Phase 2 decision record**.
- **Persisted wire (Phase 2):** Placed objects continue to use **existing** `cellEntries` / object payload shapes; **no** additive variant id on the wire. `**placementRegistryResolver`** maps **family + variant** → that payload. **Category/group** remains **not** part of persisted authored identity.
- **Explicit variants** support future **swatch/image** selection better than an implicit matrix of dimensions — Phase 2 may add presentation; **data** stays explicit per variant.
- **Default variant:** Each family declares **`defaultVariantId`** (required); **primary-click** behavior is locked in the **decision record** (default = primary, picker = secondary when `variantCount > 1`).

**Closed by decision record:** Persistence fork, id scope, wire-mapping ownership, linked-content scope for picker UX, default interaction — **do not** re-open without roadmap revision.

---

## Palette interaction model

**Default pattern is locked** in **Phase 2 decision record** (primary = default variant, secondary opens picker when multiple variants exist). The table below is **reference**; exceptions are rare and must be documented per family.

### What happens when the user clicks a grouped palette item?


| Pattern                                                 | When to use                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Primary click loads default variant**                 | **Default Phase 2 behavior** — fast repeat placement.                                                              |
| **Primary click opens picker**                          | **Not** the default; only if a **documented family exception** (e.g. no safe default).                            |
| **Secondary affordance** (“more”, chevron, count badge) | Opens picker **without** changing primary-click semantics — **default** for `variantCount > 1`.                    |


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

- **Loaded state** holds **resolved placement intent** as **registry identity**: **family id + variant id** (plus minimal placement context). It does **not** replace `**placementRegistryResolver`**; **on place**, the resolver produces the **current** cell payload.
- **On place (Phase 2):** Resolver output / cell object payload uses **existing** wire fields only — **no** persisted variant id on `LocationMap` cell objects in this phase. Variant exists **above** the wire in loaded state + resolver.
- **Hydration / render:** Stable **wire** kinds + `authoredPlaceKindId`; variant-specific **render** choices (if any) derive from **resolver/registry** rules keyed by family+variant, not from a new persisted column unless a **later** phase adds one.
- **Migration:** Existing **single-variant** families remain **one default variant** in the registry — **no** extra picker overhead until multiple variants exist.
- **Legacy authored maps:** No variant column — **defaults** apply when reading legacy placements; document in implementation.

**Explicit non-goal for this phase:** Full **metadata editing** after placement; **stairs linking** beyond registry coherence; **edge** kinds; **additive persisted variant field** (deferred per **decision record**).

---

## Cross-cutting concerns (must be explicit)


| Area                       | Questions to close                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Loaded state semantics** | **`familyKey` + `variantId`** in **`activePlace`**; **`defaultVariantId`** in registry; resolver still owns payload shape. **Closed** in **decision record**. |
| **Default variant policy** | **Closed:** primary = default; secondary = picker when `variantCount > 1`; rare exceptions documented per family. |
| **Registry extensibility** | New families add **data** only; no new palette component per family.                                                        |
| **Tooltip consistency**    | Family vs variant overrides; single formatting path.                                                                        |
| **Compatibility**          | Single-variant entries; legacy maps; **Phase 2:** no wire schema change — **no** breaking persisted shape. |


---

## Risks / migration notes


| Risk                   | Mitigation                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Phase 1 model mismatch | **Audit first** todo; align Phase 2 spec to actual code.                                                                 |
| Persistence drift      | **Phase 2:** **no** additive variant field — if a future phase adds one, **new** migration + doc pass; do not sneak wire changes into Phase 2 variant UX. |
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
- **Parallel registry** or **duplicate resolver** paths that bypass Phase 1 `**placementRegistryResolver`**.

---

## Out of scope (this phase)

- **Additive persisted variant id** (or equivalent) on cell objects — **resolver-only** Phase 2 per **decision record**.
- **Multi-variant picker UX for linked-content families** (`city`, `building`, `site`) in **initial** Phase 2 — single row each until follow-up.
- Edge placement mode; door/window migration from Draw; edge snapping/hit-testing.
- Deep inspector or rail **editing** redesign.
- Rich **post-placement** behavior/state editing.
- Stairs linking workflows beyond **minimal** registry coherence.
- Full **metadata** editing after placement.
- Broad **palette visual** redesign beyond variant affordances.

---

## Acceptance criteria

This child plan is **ready for implementation** when:

1. **Phase 2 decision record** is treated as authoritative — persistence (**resolver-only**), **family-scoped** variant ids, **`defaultVariantId`** on each family, **loaded state = `familyKey` + `variantId`**, **wire mapping** ownership, **map-object-first** picker scope, **primary/secondary** interaction, **UI hierarchy**, **stairs** boundary, **docs** alignment.
2. **Variant UX** is documented on top of Phase 1’s **family + `variants` + resolver** — **no** replacement of Phase 1 registry shape.
3. **Grouped palette click** behavior follows the **locked** default (primary = default; secondary = picker); rare exceptions documented.
4. **Popover vs modal** rules are **explicit** enough to implement.
5. **Tooltips** are **registry-driven** with family/variant resolution rules.
6. **Placement** flows through **loaded identity** → `**placementRegistryResolver`** → **click-to-place** without a second mapping layer.
7. **`docs/reference/location-workspace.md`** reflects Phase 2 decisions (no variant-on-wire implication; picker + id scope + interaction; **`familyKey` + `variantId`** loaded shape; **`defaultVariantId`**).
8. **Linked-content non-regression:** `city` / `building` / `site` placement still resolves to **`link`** + **`pendingPlacement`** + linked-location modal with **Phase 1-equivalent** `linkedScale` / host behavior (see **decision record** criterion).
9. Phase 2 stays **separate** from **Edge placement (Phase 3)** and **Config/editing (Phase 4)**.

---

## Implementation todos (tracked)

See YAML frontmatter: audit Phase 1, define variant model, design selection UX, wire tooltips, preserve placement contract, tests and docs. **Update `docs/reference/location-workspace.md`** per **Documentation alignment** in the **decision record** before considering Phase 2 complete.

---

## Relationship to Phase 1 (anti-drift)

- Phase 1 provides **family-first registry**, `**variants`** (at least default path), `**placementRegistryResolver**`, and **loaded identity** semantics.
- Phase 2 **adds** grouped variant selection, counts, picker, and tooltip richness — **extending** the same registry and seam **rather than redesigning** them.

---

## Refinement: concrete variant keys + flexible `presentation` — **post–Phase 2 UX**

**Status:** Implemented in registry (`locationPlacedObject.registry.ts`), persistence (`locationPlacedObject.persistence.ts`), resolver (`resolvePlacedKindToAction.ts`), selectors/tests.

### Modeling rules

- **`defaultVariantId`** — **only** source of truth for the primary palette variant; must be a key of `variants`.
- **`variants`** — concrete entries only; **no** redundant `variants.default` when `defaultVariantId` already names a concrete id.
- **`AuthoredPlacedObjectVariantPresentation`** — local, flexible: `material`, `shape`, plus optional `form`, `kind`, `type`, `size` (strings) for family-specific hints. **Not** mechanics truth; **`runtime`** stays on the family.
- **`iconName`** — **`LocationMapGlyphIconName`** (place-tool glyphs), not a separate `LocationMapObjectIconNameId` type in-repo).

### Families migrated (no `variants.default`)

| Family | `defaultVariantId` | Notes |
|--------|-------------------|--------|
| `table` | `rect_wood` | + `circle_wood` |
| `stairs` | `straight` | + `spiral` (form-factor; direction/endpoints remain rail/editor) |
| `treasure` | `chest` | + `hoard` |
| `tree` | `deciduous` | + `pine`; **content-scale** hosts `world/city/site` (not region/subregion — those are map zone kinds) |
| `building` | `residential` | + `civic`; **content-scale** hosts `world/city/site`; **removed `linkedScale`** — places **map `marker`** + `authoredPlaceKindId: 'building'` (footprint icon), not the linked-building modal at city. |

### Resolver / persistence

- **`building`** branch removed from `resolvePlacedKindToAction` (no longer city-link shortcut).
- **`mapPlacedObjectKindToPersistedMapObjectKind`:** `tree` and `building` → `marker` on `world` \| `city` \| `site`.

### Still on legacy `variants.default`

- **`city`**, **`site`** — single-row linked content; **`defaultVariantId: 'default'`** + key **`default`**.

### Tests

- Registry assertions for each family’s `defaultVariantId`, concrete keys, and `presentation` fields; `normalizeVariantIdForFamily` fallback; palette world row includes `building` + `city` + `tree`.

---

## Related

- [location_workspace_object_authoring_phase1_palette_foundation.plan.md](location_workspace_object_authoring_phase1_palette_foundation.plan.md) — prerequisite Phase 1.
- [location_workspace_object_authoring_phase3_edge_placement.plan.md](location_workspace_object_authoring_phase3_edge_placement.plan.md) — following Phase 3 (placeholder).
- [location_workspace_object_authoring_roadmap.plan.md](location_workspace_object_authoring_roadmap.plan.md) — parent roadmap.
- [.cursor/plans/location-workspace/README.md](README.md) — plan bundle index.

