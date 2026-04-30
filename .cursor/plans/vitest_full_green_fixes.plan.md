---
name: Vitest full green fixes
overview: Fix all 20 failing Vitest tests by adding shapechanger to CREATURE_SUBTYPE_DEFINITIONS; aligning taxonomy tests (legacy rows stay commented); fixing Patched meta assertions in tests only; deriving linked-scale expectations from ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE (world from registry export); updating path tests for city > world; aligning square grid tests with SQUARE_GRID_GAP_PX; updating stairs geometry expectations to match the resolver only (no production changes for stairs).
todos:
  - id: taxonomy-tests-data
    content: Add { id: 'shapechanger', name: 'Shapechanger' } to CREATURE_SUBTYPE_DEFINITIONS; update creatureTaxonomy.test.ts + monsterForm.mappers.test.ts; do not uncomment legacy subtype rows
    status: pending
  - id: patched-meta-tests
    content: Update *Detail.presentation.test.tsx Patched assertions — do not expect row.label === 'Patched'; assert via empty label + value/badge or rendered text
    status: pending
  - id: location-links
    content: Update locationMapPlacement.policy.test.ts — use ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE as canonical for world (and helpers must match export); city site+building, canLink(city,city) false
    status: pending
  - id: path-grid-stairs
    content: pathMapStyles test — city strokes > world; square grid tests use SQUARE_GRID_GAP_PX; stairs test — expect outputs from resolvePlacedObjectCellVisual / footprint resolver only (rely on resolver)
    status: pending
isProject: false
---

# Plan: Vitest full green (20 failures across 17 files)

## Decisions (user)

- **Legacy subtype rows:** Keep **commented out** in [`creatureTaxonomy.ts`](src/features/content/creatures/domain/values/creatureTaxonomy.ts) (`CREATURE_SUBTYPE_DEFINITIONS`); do not uncomment dwarf/elf/gnome/orc/human/halfling for the sake of tests.
- **`shapechanger`:** **Add** `{ id: 'shapechanger', name: 'Shapechanger' }` to [`CREATURE_SUBTYPE_DEFINITIONS`](src/features/content/creatures/domain/values/creatureTaxonomy.ts) so fiend subtype options and [`creatureTaxonomyOptions.test.ts`](src/features/content/creatures/domain/options/creatureTaxonomyOptions.test.ts) stay aligned.
- **Patched meta row:** **Do not** change [`contentDetailPatchedMetaSpecs`](src/features/content/shared/domain/details/contentDetailMetaSpecs.tsx) to set `label: 'Patched'`. **Update tests** so they no longer expect `row.label === 'Patched'`.
- **City links:** **City must not** link to **city**. Allowed targets for city host: **`site`**, **`building`** (order as [`ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE.city`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts) defines).
- **`world` linked scales:** **[`ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE.world`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts) is the source of truth.** Tests must **not** maintain a parallel hardcoded `world` array. Import the export (via [`locationMapPlacement.policy`](shared/domain/locations/map/locationMapPlacement.policy.ts) re-export or direct registry import per project convention) and assert **helpers match the map**, e.g. `expect(getAllowedLinkedLocationScalesForHostScale('world')).toEqual(ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE.world)` or structural rules (`canLink`) **derived from** that array—not a duplicated literal in the test file.
- **Path stroke widths:** **Do not** change palette values to satisfy an old test. **Update** [`pathMapStyles.test.ts`](src/features/content/locations/domain/presentation/map/__tests__/pathMapStyles.test.ts) for **city > world** (relative assertions).
- **Stairs footprint:** **Rely on the resolver.** Update [`resolvePlacedObjectCellVisual.geometry.test.ts`](src/features/content/locations/domain/presentation/map/__tests__/resolvePlacedObjectCellVisual.geometry.test.ts) expected `layoutWidthPx` / `layoutHeightPx` to what [`resolvePlacedObjectCellVisualFromRenderItem`](src/features/content/locations/domain/presentation/map/resolvePlacedObjectCellVisual.ts) + footprint pipeline **actually returns** (e.g. 50 width if that is current). **Do not** change production layout code just to satisfy the old 40 px expectation.

---

## A. Creature taxonomy and monsters (6 tests / 4 files)

**Source of truth:** [`creatureTaxonomy.ts`](src/features/content/creatures/domain/values/creatureTaxonomy.ts) — `humanoid` allows `['cleric','druid','wizard']`; `goblinoid` is on **`fey`**, not humanoid.

1. **Data:** Add **`shapechanger`** to `CREATURE_SUBTYPE_DEFINITIONS` (see Decisions).

2. **[`creatureTaxonomy.test.ts`](src/features/content/creatures/domain/values/creatureTaxonomy.test.ts)**  
   - Rewrite **“restricts subtypes by creature type”** for current `allowedSubtypeIds` (humanoid length **3**, no goblinoid on humanoid).
   - Add **fey + goblinoid** and **humanoid without goblinoid** checks.
   - Keep elemental/fiend/undead/beast checks where they still match the table (fiend includes shapechanger with proper display name once definition exists).

3. **[`creatureTaxonomyOptions.test.ts`](src/features/content/creatures/domain/options/creatureTaxonomyOptions.test.ts)**  
   - Stays valid after `shapechanger` row is added (`label: 'Shapechanger'`).

4. **[`monsterForm.mappers.test.ts`](src/features/content/monsters/domain/forms/mappers/monsterForm.mappers.test.ts)**  
   - Round-trip **goblinoid** with **`type: 'fey'`** (or **`humanoid` + `cleric`**).
   - **`getMonsterFieldConfigs`:** **goblinoid** under **fey** options, not humanoid.

---

## B. “Patched” meta row (11 tests / 11 files)

**Where it is built:** [`contentDetailPatchedMetaSpecs`](src/features/content/shared/domain/details/contentDetailMetaSpecs.tsx) — `label: ''`, **`render()`** → badge in **`value`**.

**Fix:** In each failing `*Detail.presentation.test.tsx`, assert Patched via **rendered `value`** (e.g. RTL + `/Patched/`), not `row.label === 'Patched'`.

Optional: confirm [`ContentDetailMetaRow.tsx`](src/features/content/shared/components/detail/ContentDetailMetaRow.tsx) handles empty labels.

---

## C. Linked location scales (2 tests / 1 file)

**Canonical export:** [`ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry.ts) (re-exported from [`locationMapPlacement.policy`](shared/domain/locations/map/locationMapPlacement.policy.ts)).

**Fix [`locationMapPlacement.policy.test.ts`](shared/domain/locations/__tests__/map/locationMapPlacement.policy.test.ts):**

- **`world`:** Stop hardcoding `['city', 'site']` (or any fixed list). Use **`ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE.world`** as the expected value when asserting **`getAllowedLinkedLocationScalesForHostScale('world')`**, or assert policy rules **using** that array (no second copy of the list in the test).
- **`city`:** Expect **`site`** and **`building`** (match export); **`canLinkLocationScaleFromHostScale('city', 'city')` === `false`**.
- Keep other cases aligned with the same map + [`canLinkLocationScaleFromHostScale`](shared/domain/locations/map/locationMapPlacement.policy.ts).

---

## D. Path stroke widths (1 test / 1 file)

**Fix:** [`pathMapStyles.test.ts`](src/features/content/locations/domain/presentation/map/__tests__/pathMapStyles.test.ts) — relative assertions: **city strokes > world** (`default` / `selected` as appropriate). No exact px locks.

**Optional:** Align misleading comment in [`pathMapStyles.ts`](src/features/content/locations/domain/presentation/map/pathMapStyles.ts) with real behavior if you edit that file.

---

## E. Square grid geometry tests (2 tests / 1 file)

Import [`SQUARE_GRID_GAP_PX`](shared/domain/grid/squareGridOverlayGeometry.ts); derive **`step`**, centers, and gutter probe coords from **`cellPx + gap`**.

---

## F. Stairs footprint layout (1 test / 1 file)

**Resolver is authoritative:** Run the resolver once, set **`expect(v.layoutWidthPx).toBeCloseTo(...)`** / height to **observed** outputs. Short comment: expectations track [`resolvePlacedObjectFootprintLayoutPx`](src/features/content/locations/domain/presentation/map/) + registry footprint for `stairs` / `straight`. **No resolver changes** for this test-fix pass unless a separate bug is filed.

---

## Ambiguities and brittleness

**Resolved / narrowed**

- **shapechanger:** Add definition row (no optional “relax test” path).
- **Stairs:** Test follows resolver; production unchanged in this pass.
- **world scales:** Registry export is single source of truth in tests.

**Still brittle if done carelessly**

- Footprint tests: prefer `toBeCloseTo` + comment tied to registry after one resolver truth run.
- Square grid: tie to `SQUARE_GRID_GAP_PX`.
- Patched: prefer value/text, not label string.

---

## Verification

```bash
npx vitest run shared/domain/locations/__tests__/map/locationMapPlacement.policy.test.ts \
  src/features/content/creatures/domain/values/creatureTaxonomy.test.ts \
  src/features/content/creatures/domain/options/creatureTaxonomyOptions.test.ts \
  src/features/content/monsters/domain/forms/mappers/monsterForm.mappers.test.ts \
  src/features/content/shared/forms/registry/buildDetailItemsFromSpecs.test.tsx \
  'src/**/*Detail.presentation.test.tsx' \
  src/features/content/locations/domain/presentation/map/__tests__/pathMapStyles.test.ts \
  src/features/content/locations/domain/presentation/map/__tests__/resolvePlacedObjectCellVisual.geometry.test.ts \
  src/features/content/locations/components/authoring/geometry/__tests__/squareGridMapOverlayGeometry.test.ts
```

Then: `npx vitest run`.
