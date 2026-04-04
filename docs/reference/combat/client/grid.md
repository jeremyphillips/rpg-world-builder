# Combat Grid vs encounter orchestration

## Purpose

This document defines the intended boundary between:

- reusable **`CombatGrid`** (`src/features/combat/components/grid/CombatGrid.tsx`)
- encounter feature **orchestration** around the grid (not a second grid implementation)

## Why the split exists

The tactical renderer should be broadly reusable and must not import Encounter routes, context, or setup workflow. Encounter-specific wiring (view model, pan/zoom, hover, interaction modes, token popover) lives in **`useEncounterActivePlaySurface`**, which composes **`CombatGrid`** directly.

There is **no** separate `EncounterGrid.tsx` component file: the encounter barrel may re-export **`CombatGrid` as `EncounterGrid`** for backwards-compatible imports only.

## `CombatGrid` owns

`CombatGrid` should own renderer concerns such as:

- rendering the grid from normalized props/view models
- cell rendering
- token/obstacle rendering
- generic selected/highlighted/preview visuals
- click/hover callback emission
- grid-local visual helper usage
- cell visual state and cell visual styles where those are generic renderer concerns

`CombatGrid` should be reusable by another combat-oriented client surface in principle.

## Encounter orchestration owns

**`useEncounterActivePlaySurface`** (and route parents) should own:

- supplying the grid view model and callbacks (pan/zoom, hover, token popover renderer, interaction flags)
- feature-specific orchestration around the grid (selected actor/target, modals, drawers, DM workflow) — **not** inside `CombatGrid`

## What `CombatGrid` must not own

`CombatGrid` must not import or depend on:

- `EncounterRuntimeContext`
- Encounter route types
- Encounter hooks (except through props from parents)
- setup workflow types
- modal/drawer orchestration
- campaign/route param logic

If the grid still needs those, the boundary is wrong and the **orchestration layer** needs to absorb more.

## Prop contract guidance

`CombatGrid` should prefer a renderer-oriented contract.

Good inputs:
- normalized grid/cell data
- selected/highlighted state
- generic callbacks
- normalized render models

Bad inputs:
- raw Encounter context
- route params
- campaign ids
- setup modal state
- large feature store/controller objects

A slightly narrower but honest prop contract is better than a fake reusable one.

## Visual helper ownership

Helpers like:
- `cellVisualState`
- `cellVisualStyles`

should live with the grid renderer if they are truly generic renderer concerns.

If parts of them are Encounter-specific, they should be split rather than moved wholesale.

## Authored base map vs tactical overlays

`CombatGrid` draws **tactical** cell state from `GridCellViewModel` (`getCellVisualState`, `getCellVisualSx` — movement, AoE, placement bands, perception). When `authoringPresentation` is present, `CombatGridAuthoringOverlay` renders the **authored location map** chrome only (presentation; not mechanics) as an SVG layer **above** cell terrain fills (`z-index` above default cells, **below** blind veil and viewer-lifted cells):

1. **Paths** and **edges** (SVG strokes).
2. **Authored object icons** — cell-anchored glyphs from `EncounterAuthoringPresentation.authoredObjectRenderItems` (same canonical shape as `LocationMapAuthoredObjectRenderItem` in `shared/domain/locations/map/`), derived by `deriveLocationMapAuthoredObjectRenderItems` when building the presentation blob.

**Derive vs render:** Pure lists and geometry live in `shared/domain`; MUI icons, SVG smoothing, and z-order live in feature components (`CombatGridAuthoringOverlay`, `LocationMapAuthoredObjectIconsLayer`, `pathOverlayRendering.ts`).

**Not the same as:** runtime `GridObject` rows or **placed-object** visuals (`placedObjectVisual` / `PlacedObjectCellVisualDisplay` in tactical cells) — those reflect encounter mechanics and stay separate from authored map SVG underlay icons, though both use **`resolvePlacedObjectCellVisual`** for icon/label consistency.

## Success criteria

The grid split is successful when:

- `CombatGrid` can render without Encounter imports
- encounter orchestration (`useEncounterActivePlaySurface`) supplies props and callbacks — not a duplicate grid component
- parent route code changes remain reasonably small
- grid-local visual helpers move with the reusable renderer where appropriate
- another combat-oriented surface could reuse `CombatGrid` in principle
