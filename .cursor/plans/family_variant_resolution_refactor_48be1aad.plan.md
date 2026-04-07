---
name: Family variant resolution refactor
overview: (A) `resolveFamilyVariant` + placed-object delegation + edge hydration (done). (B) Shared tray primitives + place/paint shells (in progress). (C) Cleanup after A/B. (D) **Cell-fill clean-cut:** replace flat `LOCATION_CELL_FILL_KIND_META` with `AUTHORED_CELL_FILL_DEFINITIONS`, structured persistence `{ familyId, variantId }` per cell, policy + palette + theme + map rendering in one pass—**no legacy ids, no read-time mapping** for removed flat ids (`forest_light`, `stone_floor`, etc.). Old maps are intentionally not supported after cutover.
todos:
  - id: add-shared-resolve
    content: Add familyVariantResolve.ts + tests (invariant visible; no double-fallback for bad registry)
    status: completed
  - id: selectors-delegate
    content: "Selectors: delegate normalize + review variantDefinitionForFamily / isVariantIdValidForFamily; getters doc; pin whitespace id behavior"
    status: completed
  - id: edge-hydration
    content: Update locationMapEdgeAuthoring.resolve.ts to use resolvePlacedObjectVariant
    status: completed
  - id: exports-tests
    content: Re-export resolvePlacedObjectVariant; unit + integration/smoke (placement or edge)
    status: completed
  - id: docs-workspace
    content: Update docs/reference/location-workspace.md (variant resolution + pointers)
    status: pending
  - id: tray-primitives
    content: Add LocationMapEditorTray* primitives + presentational types; refactor PlaceTray to use them (no behavior change)
    status: pending
  - id: paint-palette-viewmodel
    content: Group paint palette by family/category (helper and/or shell adapter) + types as needed for sectioned rows
    status: pending
  - id: paint-tray-shell
    content: Rewrite LocationMapEditorPaintTray on primitives; Surface/Region + swatch leadings; optional variant UI when multi-variant
    status: pending
  - id: docs-tray
    content: Optional location-workspace.md note on tray primitives + paint/place structural parity
    status: pending
  - id: refactor-cleanup
    content: Post-refactor cleanup — remove superseded helpers, dead exports, temp adapters, duplicate layout
    status: pending
  - id: cell-fill-registry
    content: "Phase D: AUTHORED_CELL_FILL_DEFINITIONS + resolveCellFillVariant; remove flat LOCATION_CELL_FILL_KIND_META model"
    status: pending
  - id: cell-fill-persistence
    content: "Phase D: cellFillByCellId → structured LocationMapCellFillSelection; serialize/hydrate/snapshot in one pass"
    status: pending
  - id: cell-fill-policy-palette
    content: "Phase D: scale policy + paint palette helpers + swatch/theme keys aligned to families/variants"
    status: pending
  - id: cell-fill-ui-state
    content: "Phase D: LocationMapPaintState + paint handlers + map render readers; paint tray parity with place tray"
    status: pending
isProject: false
---

# Family / variant resolution refactor

This plan has **four** tracks: **(A)** Domain variant resolution (placed objects), **(B)** Map editor tray UI (shared primitives + paint/place shells), **(C)** Cleanup after A/B, **(D)** **Cell-fill clean-cut** — family registry, structured persistence, policy, palette, paint UI, and rendering (**no legacy flat ids**). A/B can proceed before D; **D** subsumes earlier “cell-fill future / follow-up” notes.

## Summary

Centralize the **“valid requested id → use it; else `defaultVariantId`”** rule in [`shared/domain/registry/familyVariantResolve.ts`](shared/domain/registry/familyVariantResolve.ts) as `resolveFamilyVariant`, with types `FamilyWithVariants<TVariant>` and `ResolvedFamilyVariant<TVariant>`. Refactor [`locationPlacedObject.selectors.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts) so `normalizeVariantIdForFamily` is a thin delegate to `resolveFamilyVariant(...).resolvedVariantId`, and add `resolvePlacedObjectVariant(kind, requestedVariantId)` that reads `AUTHORED_PLACED_OBJECT_DEFINITIONS[kind]`, calls `resolveFamilyVariant`, and returns `{ resolvedVariantId, variant: AuthoredPlacedObjectVariantDefinition }`. Replace the normalize-then-multiple-lookup pattern in edge hydration with a single `resolvePlacedObjectVariant` call. Add unit tests for the generic helper and placed-object wrappers; preserve all existing read/hydration fallback behavior (no throws on invalid ids). **Registry invariant:** `defaultVariantId` ∈ `variants` keys—no second fallback in `resolveFamilyVariant`. **Getter docs** + **selector consolidation** per sections below. **Behavior pin:** whitespace-prefixed invalid ids (e.g. `' rect_wood'`). Update [`docs/reference/location-workspace.md`](docs/reference/location-workspace.md) so workspace contributors see where variant resolution lives and when to use which helper (see **Documentation** below). **Cell-fill:** full migration spec is **Phase D — Cell-fill registry (clean-cut migration)** (registry, `resolveCellFillVariant`, structured `cellFillByCellId`, policy, swatches, palette, paint state, tray parity, render). **Separately (tray track):** extract **`LocationMapEditorTray*`** presentational primitives from the place tray, then align the paint tray to the same section/row/variant pattern; Phase D completes paint data + persistence so tray work is not blocked on flat meta adapters—see **Map editor tray UI** and **Phase D** below.

```mermaid
flowchart LR
  subgraph shared [shared/domain/registry]
    resolveFamilyVariant
  end
  subgraph selectors [locationPlacedObject.selectors]
    normalizeVariantIdForFamily
    resolvePlacedObjectVariant
  end
  resolvePlacedObjectVariant --> resolveFamilyVariant
  normalizeVariantIdForFamily --> resolveFamilyVariant
```

---

## Map editor tray UI (shared primitives + paint parity)

### Summary

Refactor [`LocationMapEditorPlaceTray.tsx`](src/features/content/locations/components/workspace/leftTools/place/LocationMapEditorPlaceTray.tsx) to extract **presentational** building blocks, then refactor [`LocationMapEditorPaintTray.tsx`](src/features/content/locations/components/workspace/leftTools/paint/LocationMapEditorPaintTray.tsx) so paint **feels structurally parallel** to place: **category heading → family option row → optional scoped variant affordance** (popover/menu). **Do not** merge place and paint into one large domain abstraction; shells own palette derivation, grouping, selection models, handlers, and **leading visuals** (glyph vs swatch). Shared code owns repeated **layout**, **selected chrome**, **section headings**, **option row shell**, **variant trigger + popover chrome**.

[`LocationMapEditorToolTrayShell.tsx`](src/features/content/locations/components/workspace/leftTools/LocationMapEditorToolTrayShell.tsx) stays the outer fixed-width column; new primitives live under e.g. `leftTools/tray/` (or `leftTools/shared/`) and are **not** placed-object-specific in naming.

### Architecture

| Layer | Owns |
|-------|------|
| **`LocationMapEditorTray*`** primitives | Scroll column `sx`, section heading typography, option row wrapper (tooltip, selected border, optional tile size prop), optional `Badge` + variant trigger + `Popover` shell with list/list-item slots or children |
| **Place shell** | `getPlacePaletteItemsForScale`, `getPlacedObjectPaletteCategoryLabel`, `getPlacedObjectVariantPickerRowsForFamily`, `LocationMapActivePlaceSelection`, `onSelectPlace`, icon resolution, `map-object` + `variantCount > 1` rules |
| **Paint shell** | `getPaintPaletteItemsForScale` and/or **adapter** grouping by [`LOCATION_CELL_FILL_KIND_META`](shared/domain/locations/map/locationMapCellFill.constants.ts) facets (`category`, `family`), `LocationMapPaintState`, `onPaintChange`, **Surface / Region** toggle + region hint, `getMapSwatchColor` for swatch leadings |

**Preferred shape:** smaller composable primitives (scroll column, section heading, option row, variant affordance, variant popover), not one mega-tray. Optional **presentational view-model** types colocated with primitives (UI-only; not shared with domain DTOs).

### Suggested component names (generic; no “placed object” in primitive names)

- `LocationMapEditorTrayScrollColumn`
- `LocationMapEditorTraySectionHeading`
- `LocationMapEditorTrayOptionRow` (or split inner **tile** vs row wrapper if needed)
- `LocationMapEditorTrayVariantAffordance` / `LocationMapEditorTrayVariantTrigger` (badge + button that opens popover)
- `LocationMapEditorTrayVariantPopover` (popover + paper; body via children or default list)

Use **`Tray`** prefix to align with [`LocationMapEditorToolTrayShell`](src/features/content/locations/components/workspace/leftTools/LocationMapEditorToolTrayShell.tsx) and existing `*PlaceTray` / `*PaintTray`. Keep **Palette** for domain types (`MapPaintPaletteItem`, helpers).

### Presentational view-model (shells map domain → props)

Rough direction (exact names in implementation):

```ts
type TrayVariantOption = { id: string; label: string; description?: string; leading?: React.ReactNode };

type TrayOptionRowModel = {
  id: string;
  label: string;
  description?: string;
  isSelected: boolean;
  onSelect: () => void;
  tooltipTitle?: React.ReactNode;
  leading?: React.ReactNode;
  variants?: TrayVariantOption[];
  selectedVariantId?: string;
  onVariantSelect?: (variantId: string) => void;
  showVariantBadge?: boolean;
  variantCount?: number;
  renderVariantMenuContent?: () => React.ReactNode;
};

type TraySectionModel = { id: string; label: string; options: TrayOptionRowModel[] };
```

Primitives consume **`leading`** for icon vs swatch; variant menu can use **default list** from `variants` + optional per-row `leading`, or **`renderVariantMenuContent`** for edge cases. **Tile size:** place uses ~40px icons, paint ~28px swatches—expose via prop or `sx`, do not hardcode one size in primitives.

### Data dependency (paint grouping)

[`getPaintPaletteItemsForScale`](src/features/content/locations/domain/authoring/editor/palette/locationMapEditorPalette.helpers.ts) is currently a **flat** list with a **TODO** to group by facets. **True** parity (e.g. Terrains → Forest → forest variants) requires either:

1. **Evolve** the helper + `MapPaintPaletteItem` (and paint state if needed) toward **family rows** + variant metadata, aligned with the cell-fill family/variant roadmap; or  
2. **Interim adapter** in the paint shell that groups flat items by `meta.family` / `meta.category` for section headings and rows; variant picker appears only when a family has **multiple concrete kinds** (or later when variants are first-class).

Pick (1) or (2) for **pre–Phase-D** tray work; document in PR. **Phase D** replaces (2) with registry-native family rows everywhere—remove interim adapters when D lands.

### Files to add (tray track)

| File | Purpose |
|------|---------|
| `leftTools/tray/locationMapEditorTray.types.ts` (or similar) | Presentational `TraySectionModel` / `TrayOptionRowModel` / `TrayVariantOption` |
| `leftTools/tray/LocationMapEditorTrayScrollColumn.tsx` | Shared scroll column layout |
| `leftTools/tray/LocationMapEditorTraySectionHeading.tsx` | Category label |
| `leftTools/tray/LocationMapEditorTrayOptionRow.tsx` | Composes leading, primary tile, optional variant affordance |
| `leftTools/tray/LocationMapEditorTrayVariantPopover.tsx` (+ trigger helpers as needed) | Popover + menu body slot |
| `leftTools/tray/index.ts` | Barrel exports |

Paths under [`components/workspace/leftTools/`](src/features/content/locations/components/workspace/leftTools/) — adjust if project conventions prefer another subfolder.

### Files to change (tray track)

| File | Change |
|------|--------|
| [`LocationMapEditorPlaceTray.tsx`](src/features/content/locations/components/workspace/leftTools/place/LocationMapEditorPlaceTray.tsx) | Reimplement using tray primitives; **behavior and visuals** match pre-refactor (regression check: categories, default click, multi-variant popover, linked vs map-object). |
| [`LocationMapEditorPaintTray.tsx`](src/features/content/locations/components/workspace/leftTools/paint/LocationMapEditorPaintTray.tsx) | Surface/Region block **above** scroll column; surface mode renders sectioned rows + swatch leadings; variant UI when multiple variants per family row (per data available). |
| [`locationMapEditorPalette.helpers.ts`](src/features/content/locations/domain/authoring/editor/palette/locationMapEditorPalette.helpers.ts) | **If** grouping is done in domain: extend `getPaintPaletteItemsForScale` / types; else adapter module colocated with paint shell. |
| [`locationMapEditor.types.ts`](src/features/content/locations/domain/authoring/editor/types/locationMapEditor.types.ts) | **If** paint palette DTOs gain family/variant fields—extend here; keep separate from tray presentational types. |
| [`docs/reference/location-workspace.md`](docs/reference/location-workspace.md) | **Optional:** Map editor toolbar / paint tray bullet: structural parity with place tray + pointer to `leftTools/tray/` primitives. |

### Relationship to domain variant resolution

- Placed-object **`resolvePlacedObjectVariant`** / **`normalizeVariantIdForFamily`** are orthogonal to tray UI; trays consume **palette helpers** and editor state only.
- **Phase D** adds the cell-fill family registry + **`resolveCellFillVariant`**; tray primitives stay unchanged; paint shell consumes new palette rows + structured paint state.

### Tray track — non-goals

- No unified `LocationMapEditorDomainTray` prop type covering place + paint selection unions.
- No change to [`LocationMapEditorDrawTray`](src/features/content/locations/components/workspace/leftTools/draw/LocationMapEditorDrawTray.tsx) unless opportunistically reusing **scroll column** only.
- **Persistence / wire for cell fills** is owned by **Phase D** (structured `{ familyId, variantId }`); not a separate optional task.

### Tray track — verification

- Manual: place mode — categories, primary selection, variant popover, tooltips.
- Manual: paint mode — Surface vs Region, sectioned surface list (once data exists), swatch selection, variant popover when applicable.
- Existing palette tests: extend or add [`locationMapEditorPalette.helpers.test.ts`](src/features/content/locations/domain/authoring/editor/__tests__/palette/locationMapEditorPalette.helpers.test.ts) if helper output shape changes.

---

## Registry invariant

- **Required:** For every `FamilyWithVariants`, `family.defaultVariantId` must be a **key** of `family.variants`. Authored registries (`AUTHORED_PLACED_OBJECT_DEFINITIONS`, future `AUTHORED_CELL_FILL_DEFINITIONS`) must satisfy this; existing selector tests already assert it per placed-object family.
- **`resolveFamilyVariant` may assume this invariant** in this pass: after choosing `resolvedVariantId`, return `family.variants[resolvedVariantId]` without a second defensive fallback (e.g. do not scan keys if default is missing).
- **Do not** add alternate recovery paths for malformed registry rows—fix data at the registry instead.
- **Tests:** Keep / extend coverage so the invariant stays visible: (1) placed-object registry test that every family’s `defaultVariantId` is in `variants` (already present); (2) `resolveFamilyVariant` tests on a **minimal fixture** where `defaultVariantId` is a valid key (document in test comment that violating the invariant is out of scope for runtime handling).

## Getter safety

- **`getPlacedObjectVariantPresentation`** and **`getPlacedObjectVariantLabel`** may remain as raw lookups for **low churn**.
- **Document** in [`locationPlacedObject.selectors.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts) (JSDoc on each export) that callers must pass a **normalized / registry-valid** variant id for that family; they do **not** apply the default-variant fallback rule.
- **Prefer** [`resolvePlacedObjectVariant`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts) at call sites when the id may be **missing, invalid, or from persisted wire** data, then read `variant.presentation`, `variant.label`, etc.

## Selector consolidation

- **`normalizeVariantIdForFamily`** must delegate to **`resolveFamilyVariant`** (single implementation of the fallback rule).
- **Review** private `variantDefinitionForFamily` and public `isVariantIdValidForFamily`:
  - They implement **lookup / membership**, not fallback. **Do not** implement a second fallback in either; optional refactor is only to share **direct** `variants[requestedId]` / `requestedId in variants` style access with `resolvePlacedObjectVariant` internals if it reduces duplication.
  - `isVariantIdValidForFamily` must remain “requested id is a **key** in `variants`” (boolean). It does **not** call `resolveFamilyVariant` (that would conflate “valid key?” with “resolved id”).
- **Goal:** one canonical fallback rule inside `resolveFamilyVariant`; selectors only add family lookup by `LocationPlacedObjectKindId`.

## Behavior compatibility

- Preserve current behavior for **invalid** variant strings **exactly** (e.g. unknown keys fall back to `defaultVariantId`).
- **Do not** introduce **trimming**, case coercion, or other normalization of variant id strings unless identical behavior already exists today.
- **Pin** current behavior with a test: for a family like `table`, `normalizeVariantIdForFamily('table', ' rect_wood')` (leading space) behaves as today—**invalid** key → fallback to default (not the `rect_wood` variant). This guards against accidental `.trim()` in a future edit.

## Files to add

| File | Purpose |
|------|---------|
| [`shared/domain/registry/familyVariantResolve.ts`](shared/domain/registry/familyVariantResolve.ts) | Export `FamilyWithVariants`, `ResolvedFamilyVariant`, `resolveFamilyVariant` with the exact signatures specified. Module doc: structural-only; no wire/legacy policy; **registry invariant:** `defaultVariantId` must be a key of `variants`—callers may rely on it; no defensive second fallback. **future:** cell fills reuse via `AUTHORED_CELL_FILL_DEFINITIONS` + `resolveCellFillVariant` once family-based registry exists. |
| [`shared/domain/registry/familyVariantResolve.test.ts`](shared/domain/registry/familyVariantResolve.test.ts) | Vitest: valid id → that variant; invalid id → default variant; `null`/`undefined` → default variant. Use a minimal inline `FamilyWithVariants` fixture where default is a valid key (invariant documented in test). Optionally assert `resolvedVariant.variant === family.variants[resolvedVariantId]` after resolution. |

## Files to change

| File | Change |
|------|--------|
| [`locationPlacedObject.selectors.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts) | Import `resolveFamilyVariant`. `normalizeVariantIdForFamily` → delegate to `resolveFamilyVariant(family, variantId).resolvedVariantId`. Add `resolvePlacedObjectVariant` per spec. Consolidate `variantDefinitionForFamily` / `isVariantIdValidForFamily` per **Selector consolidation** section (no duplicate fallback rule). JSDoc on `getPlacedObjectVariantPresentation` / `getPlacedObjectVariantLabel`: **normalize/valid id only**; prefer `resolvePlacedObjectVariant` when input may be invalid or from wire. Optionally implement `getPlacedObjectIconName` via `resolvePlacedObjectVariant` (behavior must match existing tests). |
| [`locationMapEdgeAuthoring.resolve.ts`](src/features/content/locations/domain/authoring/map/locationMapEdgeAuthoring.resolve.ts) | In the `door`/`window` branch: replace normalize + `getPlacedObjectVariantPresentation` + `getPlacedObjectVariantLabel` with `resolvePlacedObjectVariant(placedKind, entry.variantId)`; map `resolvedVariantId`, `variant.presentation`, `variant.label`. Trim imports. |
| [`locationPlacedObject.types.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.types.ts) | Re-export `resolvePlacedObjectVariant` alongside existing selector exports (match existing barrel pattern). |
| [`locationPlacedObject.selectors.test.ts`](src/features/content/locations/domain/model/placedObjects/__tests__/locationPlacedObject.selectors.test.ts) | Existing `normalizeVariantIdForFamily` cases; add `resolvePlacedObjectVariant` coverage; **pin** whitespace-prefixed invalid id (`' rect_wood'` for `table`) to current normalize behavior; add cases as needed for consolidation. |
| [`docs/reference/location-workspace.md`](docs/reference/location-workspace.md) | **In scope.** Extend the **Object authoring UX modernization (roadmap)** subsection (after the Phase 2 sentence on `defaultVariantId` / `variants`): add a short **Variant resolution** note—`shared/domain/registry/familyVariantResolve.ts` (`resolveFamilyVariant`, `FamilyWithVariants`); placed-object wrappers `resolvePlacedObjectVariant` and `normalizeVariantIdForFamily` in `locationPlacedObject.selectors.ts`; **registry invariant** that `defaultVariantId` is always a key of `variants`; use **`resolvePlacedObjectVariant`** when the variant id may be missing, invalid, or from persisted wire; raw **`getPlacedObjectVariantPresentation` / `getPlacedObjectVariantLabel`** expect a **normalized** id; edge-authored identity hydration flows through **`resolveAuthoredEdgeInstance`** (uses `resolvePlacedObjectVariant`). Optionally add one bullet under **Pointers for the next agent** if a single line fits. Keep tight; point to code modules rather than duplicating this plan’s cell-fill illustrations (those stay in the plan until migration). |

## Optional one-line doc touch

| File | Change |
|------|--------|
| [`locationMapEditor.types.ts`](src/features/content/locations/domain/authoring/editor/types/locationMapEditor.types.ts) | Optionally extend the `variantId` comment: `normalizeVariantIdForFamily` for id-only; `resolvePlacedObjectVariant` when full variant row is needed. |

## Call sites intentionally left unchanged (or minimal)

- **[`resolvePlacedKindToAction.ts`](src/features/content/locations/domain/authoring/editor/placement/resolvePlacedKindToAction.ts)** — uses **`normalizeVariantIdForFamily` only** (needs resolved id string for `buildPersistedPlacedObjectPayload`). **Intentionally** not switching to `resolvePlacedObjectVariant` unless desired for symmetry; behavior unchanged via delegate to `resolveFamilyVariant`.
- **[`resolvePlacedObjectCellVisual.ts`](src/features/content/locations/domain/presentation/map/resolvePlacedObjectCellVisual.ts)** — uses **`getPlacedObjectIconName`** only; that helper normalizes internally before icon lookup. **Unchanged**; not “normalize + raw getters.”
- **Palette / place UI** (`LocationMapEditorPlaceTray`, `locationMapEditorPalette.helpers`, etc.) — use `defaultVariantId` from palette rows or explicit `variantId`; no wire ambiguity. **Tray track** refactors `LocationMapEditorPlaceTray` onto shared primitives without changing that contract.

### Intentionally unchanged: resolve id + raw getters (acceptable)

After this pass, **no** remaining production path should chain **`normalizeVariantIdForFamily` + `getPlacedObjectVariantPresentation` / `getPlacedObjectVariantLabel`** (edge hydration moves to `resolvePlacedObjectVariant`). If grep finds such a pattern later, prefer refactoring to `resolvePlacedObjectVariant` for clarity and safety.

- **`getDefaultVariantPresentationForKind`**, **`getPlacedObjectVariantPickerRowsForFamily`**, **`defaultVariantEntryOf`** — no mega-refactor; only touch if a tiny internal use of `resolveFamilyVariant` or `resolvePlacedObjectVariant` removes duplication without behavior change.

## Phase D — Cell-fill registry (clean-cut migration)

**Status:** Unlocks full reshaping of cell-fill data; **supersedes** prior “documentation only” / “follow-up later” notes for this topic. **Executed as one coordinated pass** (or a tight sequence of PRs with no mixed model in `main`).

### Hard constraints (non-negotiable)

- **No** preservation of old flat cell-fill ids as the persisted wire format.
- **No** read-time legacy mapping from removed ids (`forest_light`, `forest_heavy`, `stone_floor`, etc.).
- **No** compatibility helpers that translate old flat ids to the new model.
- **No** half-migrated state: remove/replace flat `LOCATION_CELL_FILL_KIND_META`–driven policy, palette, and types in the same effort as the registry and persistence.
- **Composite string persistence** (e.g. `plains.temperate_open`) is **not** the preferred model; use **structured** `{ familyId, variantId }` per cell unless an audit finds a compelling technical reason (document in PR if so).

**Product implication:** Existing stored maps that only know flat ids are **not** required to remain readable after cutover; treat as acceptable breakage (reset/reseed maps or accept data loss for this layer).

### Recommendation summary

| Topic | Decision |
|-------|----------|
| **Registry** | Introduce `AUTHORED_CELL_FILL_DEFINITIONS` keyed by `LocationCellFillFamilyId`; each family satisfies `AuthoredCellFillFamilyDefinition` (extends `FamilyWithVariants` + `category`, `allowedScales`, etc.). |
| **Resolver** | `resolveCellFillVariant(familyId, requestedVariantId)` → `{ resolvedVariantId, variant }` via `resolveFamilyVariant` on the family slice (same pattern as placed objects). |
| **Persistence** | `LocationMapCellFillByCellId = Record<string, LocationMapCellFillSelection \| undefined>` where `LocationMapCellFillSelection = { familyId, variantId }` (exact names may follow existing `locationGridDraft` / `LocationMap*` conventions after audit). |
| **Policy** | **Default: Option A** — `cellFillFamilies` (or `cellFillPolicy`) lists **allowed family ids per scale**; all variants in an allowed family are paintable unless the product adds explicit filtering later. **Option B** (family id + optional allowed variant id list per scale) is reserved for when a scale must expose only a **subset** of variants within a family; add only if needed. |
| **Palette** | Derive **family rows** + variant lists from **registry ∩ policy**; no flat “one row per legacy concrete id”. |
| **Paint state** | `LocationMapPaintState` holds **structured** surface selection, e.g. `selectedSurfaceFill?: { familyId, variantId }` (rename to match `locationMapEditor.types.ts` conventions); region mode unchanged in intent (`activeRegionId`). |
| **Tray UI** | `LocationMapEditorPaintTray` mirrors **LocationMapEditorPlaceTray**: category heading → family row → variant popover when `variants.length > 1`. Shared primitives stay **presentational**; shells own data + handlers. |
| **Swatches** | Every variant `swatchColorKey` maps to **`LocationMapSwatchColorKey`** + `mapColors.ts` entry in the same pass; shared swatch keys are OK if intentional. |

### Chosen persistence model

```ts
export type LocationMapCellFillSelection = {
  familyId: LocationCellFillFamilyId;
  variantId: string;
};

export type LocationMapCellFillByCellId = Record<string, LocationMapCellFillSelection | undefined>;
```

- Replace usages of `Record<string, LocationMapCellFillKindId | undefined>` (flat per cell) with **structured** selection everywhere: grid draft, bootstrap payloads, workspace snapshot serialization, dirty-state, save paths, hydrate.
- **Erase / paint application** read/write this shape only.

### Chosen registry / type names (targets)

| Name | Role |
|------|------|
| `AUTHORED_CELL_FILL_DEFINITIONS` | Canonical registry object |
| `AuthoredCellFillFamilyDefinition` | Per family: `category`, `allowedScales`, `defaultVariantId`, `variants` |
| `AuthoredCellFillVariantDefinition` | `label`, `description?`, `swatchColorKey`, `presentation?` |
| `LocationCellFillFamilyId` | Union of family keys (e.g. `plains`, `forest`, `mountains`, `desert`, `water`, `floor`, `swamp`, …) |
| `AuthoredCellFillVariantPresentation` | Optional typed facet blob (align with existing facet types where useful) |
| `resolveCellFillVariant` | Wrapper around `resolveFamilyVariant` |

**Variant ids** are **family-scoped strings** (e.g. `temperate_open`), not dotted global ids.

### Policy model (detail)

- Remove `cellFillKinds: readonly LocationCellFillKindId[]` in [`locationScaleMapContent.policy.ts`](src/features/content/locations/domain/model/policies/locationScaleMapContent.policy.ts) keyed to flat ids.
- Replace with **`allowedFamilyIds` per scale** (name TBD: e.g. `cellFillFamilyIds: readonly LocationCellFillFamilyId[]`) consistent with **Option A**.
- Palette helpers (`getPaintPaletteSectionsForScale` / successors) filter **registry** by **policy** and **scale** in one place.

### Paint palette row model (domain)

Align with `MapPaintPaletteSection` / family row types in [`locationMapEditor.types.ts`](src/features/content/locations/domain/authoring/editor/types/locationMapEditor.types.ts); target shape:

```ts
type PaintPaletteVariantOption = {
  id: string;
  label: string;
  description?: string;
  swatchColorKey: LocationMapSwatchColorKey;
};

type PaintPaletteFamilyRow = {
  familyId: LocationCellFillFamilyId;
  label: string;
  description?: string;
  category: LocationMapPaintPaletteCategoryId;
  defaultVariantId: string;
  variants: PaintPaletteVariantOption[];
};
```

### Shared tray primitives (parity)

Prefer existing names under `leftTools/tray/`:

- `LocationMapEditorTrayScrollColumn`, `LocationMapEditorTraySectionHeading`, `LocationMapEditorTrayVariantPopover` (already present or planned).
- **Extract or add** as needed: `LocationMapEditorTrayOptionRow` (selectable row shell + leading slot), optional `LocationMapEditorTrayVariantTrigger` (badge + open popover) so place and paint share chrome without sharing domain types.

### Files to change (audit checklist — expand during implementation)

| Area | Files / directions |
|------|---------------------|
| **Registry** | New module(s) under `shared/domain/locations/map/` (e.g. `authoredCellFillDefinitions.ts`) or `features/.../model/map/` per project rules; **delete or replace** flat meta in [`locationMapCellFill.constants.ts`](shared/domain/locations/map/locationMapCellFill.constants.ts). |
| **Types** | [`locationCellFill.types.ts`](src/features/content/locations/domain/model/map/locationCellFill.types.ts), [`locationMapEditor.types.ts`](src/features/content/locations/domain/authoring/editor/types/locationMapEditor.types.ts) (`LocationMapPaintState`, palette DTOs), [`locationGridDraft.types.ts`](src/features/content/locations/components/authoring/draft/locationGridDraft.types.ts). |
| **Swatches** | [`locationMapSwatchColors.types.ts`](src/features/content/locations/domain/model/map/locationMapSwatchColors.types.ts), [`mapColors.ts`](src/app/theme/mapColors.ts). |
| **Policy** | [`locationScaleMapContent.policy.ts`](src/features/content/locations/domain/model/policies/locationScaleMapContent.policy.ts) + tests. |
| **Palette** | [`locationMapEditorPalette.helpers.ts`](src/features/content/locations/domain/authoring/editor/palette/locationMapEditorPalette.helpers.ts) + tests. |
| **Resolver** | `resolveCellFillVariant` next to registry or in `registry/`; unit tests. |
| **Workspace** | `workspacePersistableSnapshot`, `useLocationEditWorkspaceModel`, map session draft helpers, save/serialize. |
| **UI** | [`LocationMapEditorPaintTray.tsx`](src/features/content/locations/components/workspace/leftTools/paint/LocationMapEditorPaintTray.tsx), [`LocationEditRoute.tsx`](src/features/content/locations/routes/LocationEditRoute.tsx), [`LocationEditorMapCanvasColumn.tsx`](src/features/content/locations/components/workspace/canvas/LocationEditorMapCanvasColumn.tsx), canvas paint handlers. |
| **Rendering** | Any component resolving cell fill → color (square map, overlays, combat underlay if applicable). |
| **Tests** | All tests using literal flat fill ids; perf/snapshot tests; policy tests. |

### Coupled systems (must move in lockstep)

- **Grid draft** shape and **equality** / **prune** helpers (`usePruneGridDraftOnDimensionChange`, erase, apply paint).
- **Workspace persistence** and **dirty** detection.
- **Map rendering** (swatch resolution from `{ familyId, variantId }`).
- **Vitest** fixtures and **stableStringify** snapshots touching map payloads.

### Risks / open decisions

- **Exact export surface** for `LocationCellFillFamilyId` and registry (shared vs feature barrel).
- **Option B** policy: only if product needs variant-level gating before ship.
- **Combat / encounter** reads of terrain: if any code path uses cell fill id for rules, update or explicitly decouple in the same pass.
- **Region / subregion** scales: when to allow paint families vs empty policy (product).

### Implementation order (Phase D)

1. **Registry + types** — `AUTHORED_CELL_FILL_DEFINITIONS`, `LocationCellFillFamilyId`, `resolveCellFillVariant` + tests; remove flat meta dependency from new code paths.
2. **Swatch keys** — extend `LocationMapSwatchColorKey` + theme map for every variant.
3. **Policy** — replace flat `cellFillKinds` with family-based allowlists; policy tests.
4. **Draft + persistence** — `cellFillByCellId` structured shape; snapshot + save + hydrate; **no** legacy readers.
5. **Palette helpers** — family rows from registry ∩ policy.
6. **Paint state + handlers** — `LocationMapPaintState`, `onPaintChange`, apply-to-cell logic.
7. **Paint tray** — parity with place tray using shared primitives.
8. **Map render** — resolve fill → color via new resolver.
9. **Full test sweep** — grep for old ids and flat `LocationCellFillKindId` wire assumptions; delete obsolete tests.

### Slice if not one PR

If surface area is too large: **(1)** registry + types + resolver + swatches (no UI), **(2)** draft + persistence + policy + palette, **(3)** UI + paint state + handlers + render — **do not merge** intermediate state where flat `cellFillKinds` and structured `cellFillByCellId` coexist.

### Reference: illustrative family records (authoring targets)

The snippets below are **authoring targets** for `AUTHORED_CELL_FILL_DEFINITIONS`: each **family** has `defaultVariantId`, `variants`, `category`, `allowedScales`; each **variant** carries `label`, `description`, `swatchColorKey`, and optional `presentation`. **Surface / floor** families should expose **wood** and **stone** (and other materials) as distinct variants—see **Floors (material variations)** after the terrain examples.

**`plains`**

```ts
plains: {
  category: 'terrain',
  allowedScales: ['world'],
  defaultVariantId: 'temperate_open',
  variants: {
    temperate_open: {
      label: 'Plains',
      description: 'Open grassland or steppe.',
      swatchColorKey: 'cellFillPlains',
      presentation: {
        biome: 'temperate',
        vegetation: 'grassland',
        density: 'open',
      },
    },
    prairie: {
      label: 'Prairie',
      description: 'Wide fertile grassland with taller grasses.',
      swatchColorKey: 'cellFillPlainsPrairie',
      presentation: {
        biome: 'temperate',
        vegetation: 'grassland',
        fertility: 'fertile',
      },
    },
    steppe: {
      label: 'Steppe',
      description: 'Dry open plain with sparse grasses.',
      swatchColorKey: 'cellFillPlainsSteppe',
      presentation: {
        biome: 'semi_arid',
        vegetation: 'grassland',
        density: 'sparse',
      },
    },
    scrubland: {
      label: 'Scrubland',
      description: 'Open plain with low brush and hardy shrubs.',
      swatchColorKey: 'cellFillPlainsScrub',
      presentation: {
        biome: 'semi_arid',
        vegetation: 'scrub',
      },
    },
  },
},
```

**`forest`**

```ts
forest: {
  category: 'terrain',
  allowedScales: ['world'],
  defaultVariantId: 'temperate_open',
  variants: {
    temperate_open: {
      label: 'Light forest',
      description: 'Sparse or young woodland.',
      swatchColorKey: 'cellFillForestLight',
      presentation: {
        biome: 'temperate',
        density: 'open',
      },
    },
    temperate_dense: {
      label: 'Dense forest',
      description: 'Thick canopy or old growth.',
      swatchColorKey: 'cellFillForestHeavy',
      presentation: {
        biome: 'temperate',
        density: 'dense',
      },
    },
    boreal: {
      label: 'Boreal forest',
      description: 'Cold evergreen woodland.',
      swatchColorKey: 'cellFillForestBoreal',
      presentation: {
        biome: 'boreal',
        density: 'moderate',
      },
    },
    tropical: {
      label: 'Tropical forest',
      description: 'Lush warm forest with dense growth.',
      swatchColorKey: 'cellFillForestTropical',
      presentation: {
        biome: 'tropical',
        density: 'dense',
      },
    },
    deadwood: {
      label: 'Dead forest',
      description: 'Blighted or burned woodland.',
      swatchColorKey: 'cellFillForestDeadwood',
      presentation: {
        biome: 'blighted',
        density: 'sparse',
      },
    },
  },
},
```

**`mountains`**

```ts
mountains: {
  category: 'terrain',
  allowedScales: ['world'],
  defaultVariantId: 'rocky',
  variants: {
    rocky: {
      label: 'Mountains',
      description: 'High, rugged terrain.',
      swatchColorKey: 'cellFillMountains',
      presentation: {
        surface: 'rocky',
        elevation: 'high',
      },
    },
    alpine: {
      label: 'Alpine mountains',
      description: 'High peaks with snow or exposed stone.',
      swatchColorKey: 'cellFillMountainsAlpine',
      presentation: {
        surface: 'rocky',
        elevation: 'high',
        climate: 'cold',
      },
    },
    forested: {
      label: 'Forested mountains',
      description: 'Mountain slopes with heavy tree cover.',
      swatchColorKey: 'cellFillMountainsForested',
      presentation: {
        surface: 'rocky',
        vegetation: 'forest',
      },
    },
    volcanic: {
      label: 'Volcanic mountains',
      description: 'Jagged dark peaks shaped by fire.',
      swatchColorKey: 'cellFillMountainsVolcanic',
      presentation: {
        surface: 'volcanic',
      },
    },
    hills: {
      label: 'High hills',
      description: 'Rolling elevated terrain below full mountains.',
      swatchColorKey: 'cellFillHills',
      presentation: {
        surface: 'rocky',
        elevation: 'moderate',
      },
    },
  },
},
```

**`desert`**

```ts
desert: {
  category: 'terrain',
  allowedScales: ['world'],
  defaultVariantId: 'sand',
  variants: {
    sand: {
      label: 'Sandy desert',
      description: 'Arid dunes and exposed sand.',
      swatchColorKey: 'cellFillDesert',
      presentation: {
        biome: 'arid',
        surface: 'sand',
      },
    },
    rocky: {
      label: 'Rock desert',
      description: 'Dry terrain of stone, gravel, and sparse dust.',
      swatchColorKey: 'cellFillDesertRocky',
      presentation: {
        biome: 'arid',
        surface: 'rock',
      },
    },
    badlands: {
      label: 'Badlands',
      description: 'Dry eroded terrain with ridges and gullies.',
      swatchColorKey: 'cellFillDesertBadlands',
      presentation: {
        biome: 'arid',
        surface: 'eroded',
      },
    },
    salt_flat: {
      label: 'Salt flats',
      description: 'Dry flat mineral basin with little vegetation.',
      swatchColorKey: 'cellFillDesertSaltFlat',
      presentation: {
        biome: 'arid',
        surface: 'salt',
      },
    },
    scrub_desert: {
      label: 'Scrub desert',
      description: 'Dry land with sparse brush and hardy plants.',
      swatchColorKey: 'cellFillDesertScrub',
      presentation: {
        biome: 'semi_arid',
        surface: 'scrub',
      },
    },
  },
},
```

**`water`** — **`defaultVariantId: 'deep'`** is intentional: deep water is the default palette / primary-click variant; shallow is opt-in.

```ts
water: {
  category: 'terrain',
  allowedScales: ['world'],
  defaultVariantId: 'deep',
  variants: {
    shallow: {
      label: 'Shallow water',
      description: 'Fordable or near-shore water.',
      swatchColorKey: 'cellFillWaterShallow',
      presentation: {
        depth: 'shallow',
      },
    },
    deep: {
      label: 'Deep water',
      description: 'Dark deeper water unsuitable for wading.',
      swatchColorKey: 'cellFillWaterDeep',
      presentation: {
        depth: 'deep',
      },
    },
  },
},
```

**Floors (material variations)**

- Future **`floor`** (or `surface` / interior floor) families should include at least **wood** and **stone** material variants (aligned with [`LOCATION_CELL_FILL_MATERIAL_IDS`](shared/domain/locations/map/locationMapCellFill.facets.ts)). Exact variant ids and `swatchColorKey` names are defined in **Phase D**; the pattern is `FamilyWithVariants` + `resolveCellFillVariant` for read-time resolution and palette defaults.

## Cleanup (post-refactor)

Dedicated pass **after** variant-resolution and tray work are merged and tests pass. **Goal:** remove legacy and transitional code the refactor introduced, without changing behavior.

| Area | Actions |
|------|---------|
| **Selectors** | Remove `variantDefinitionForFamily` / private helpers only if fully inlined into `resolveFamilyVariant` delegation with no second code path; grep for duplicate “valid key else default” logic. |
| **Edge / placement** | Confirm no leftover imports of removed getters; no dead branches. |
| **Paint palette** | If a **shell-only adapter** was used for grouping, delete it once [`getPaintPaletteItemsForScale`](src/features/content/locations/domain/authoring/editor/palette/locationMapEditorPalette.helpers.ts) (or successor) is the single source of truth for sectioned rows. |
| **Tray** | Remove duplicate scroll/heading/tile markup from [`LocationMapEditorPlaceTray`](src/features/content/locations/components/workspace/leftTools/place/LocationMapEditorPlaceTray.tsx) / [`LocationMapEditorPaintTray`](src/features/content/locations/components/workspace/leftTools/paint/LocationMapEditorPaintTray.tsx) after primitives own it; drop unused tray props/types. |
| **Barrels** | Trim speculative exports; align with **narrow imports** rule. |
| **Docs** | Remove outdated references to pre-refactor patterns if any were left in comments. |

**Guardrail:** do not delete code paths still required for backward compatibility at persistence boundaries unless a separate migration explicitly removes them. **Exception:** **Phase D** intentionally breaks old flat cell-fill wire compatibility (no legacy layer)—see **Phase D — Cell-fill registry**.

## Verification

- **Unit:** `vitest` for `shared/domain/registry/familyVariantResolve.test.ts` and `locationPlacedObject.selectors.test.ts` (including whitespace-prefixed id pin and `resolvePlacedObjectVariant` cases).
- **Integration / smoke:** Run at least one existing test file that touches **edge hydration** or **placement resolution**, e.g. [`locationMapEdgeAuthoring.resolve.test.ts`](src/features/content/locations/domain/authoring/map/__tests__/locationMapEdgeAuthoring.resolve.test.ts) (directly covers `resolveAuthoredEdgeInstance`) and/or [`placementRegistryResolver.test.ts`](src/features/content/locations/domain/authoring/editor/__tests__/placement/placementRegistryResolver.test.ts) (`normalizeVariantIdForFamily` via `resolvePlacedKindToAction`). Goal: confirm no regressions after selector refactor.
- **Manual:** Optional grep for `normalizeVariantIdForFamily` + `getPlacedObjectVariantPresentation` / `getPlacedObjectVariantLabel` in the same function—should be **none** in production code after edge hydration update (see **Intentionally unchanged** above).
- **Docs:** [`location-workspace.md`](docs/reference/location-workspace.md) reads correctly and links/paths match implemented modules after the refactor.
- **Tray (when implemented):** manual spot-check place + paint trays per **Tray track — verification**; palette unit tests if helpers change.
- **Cleanup (Phase C):** full suite green after dead-code removal; confirm no duplicate adapter + helper paths for paint grouping.
- **Phase D:** unit tests for `resolveCellFillVariant` + registry invariant; policy + palette tests; snapshot/workspace tests updated for structured `cellFillByCellId`; grep confirms no references to removed flat fill ids in persistence paths; manual paint + map render smoke.

## Implementation order (build)

1. Add [`familyVariantResolve.ts`](shared/domain/registry/familyVariantResolve.ts) + [`familyVariantResolve.test.ts`](shared/domain/registry/familyVariantResolve.test.ts).
2. Refactor [`locationPlacedObject.selectors.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts) + extend [`locationPlacedObject.selectors.test.ts`](src/features/content/locations/domain/model/placedObjects/__tests__/locationPlacedObject.selectors.test.ts) (whitespace pin, `resolvePlacedObjectVariant`).
3. Update [`locationMapEdgeAuthoring.resolve.ts`](src/features/content/locations/domain/authoring/map/locationMapEdgeAuthoring.resolve.ts); re-export from [`locationPlacedObject.types.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.types.ts).
4. Run unit + integration/smoke tests (edge + placement).
5. Update [`docs/reference/location-workspace.md`](docs/reference/location-workspace.md) per the **Files to change** row (variant resolution note + optional pointer).

### Phase B — Map editor tray (after or in parallel once track A is stable)

6. Add **`LocationMapEditorTray*`** primitives + [`locationMapEditorTray.types.ts`](src/features/content/locations/components/workspace/leftTools/tray/locationMapEditorTray.types.ts) (or paths in **Files to add** above).
7. Refactor **`LocationMapEditorPlaceTray`** onto primitives; verify no behavior regression.
8. Implement **paint palette grouping** (helper extension and/or shell adapter) per **Data dependency** in the tray section.
9. Refactor **`LocationMapEditorPaintTray`** onto primitives + sectioned rows; keep Surface/Region and paint-only copy in the shell.
10. Optional: **`location-workspace.md`** tray note; extend palette tests if DTOs change.

### Phase C — Cleanup (after tracks A and B are merged and green)

11. **Dead code and superseded paths:** Remove private helpers in [`locationPlacedObject.selectors.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.ts) that are fully replaced by `resolveFamilyVariant` / `resolvePlacedObjectVariant` (only where no remaining callers); remove any duplicate fallback logic verified by grep. Remove **temporary paint grouping adapters** in the paint shell only if domain [`getPaintPaletteItemsForScale`](src/features/content/locations/domain/authoring/editor/palette/locationMapEditorPalette.helpers.ts) now emits the same shape—**do not** delete adapters until the helper owns grouping.

12. **Tray UI:** Remove inlined layout from place/paint trays that is fully subsumed by `LocationMapEditorTray*` components; avoid duplicate `sx` between shell and primitives.

13. **Exports / barrels:** Drop unused re-exports from [`locationPlacedObject.types.ts`](src/features/content/locations/domain/model/placedObjects/locationPlacedObject.types.ts) and tray `index.ts` if any were added speculatively; prefer narrow imports per project rules.

14. **Verification:** Full test suite + targeted greps (e.g. `normalizeVariantIdForFamily` chained with raw getters in one function, deprecated palette helpers). **No intended behavior change**—cleanup only.

### Phase D — Cell-fill clean-cut (see dedicated section)

15–23. Follow **Phase D — Cell-fill registry (clean-cut migration)** above: registry + `resolveCellFillVariant`, swatches, policy, structured `cellFillByCellId`, palette helpers, paint state + tray + render, full test sweep. Prefer **one merge** or the **three-slice** sequence documented there (no mixed old/new model on `main`).

See **Cleanup (post-refactor)** for the checklist narrative.
