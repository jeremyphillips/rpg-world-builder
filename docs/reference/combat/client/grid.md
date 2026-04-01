# Combat Grid vs Encounter Grid

## Purpose

This document defines the intended boundary between:

- reusable `CombatGrid`
- Encounter-owned `EncounterGrid`

This is one of the most important UI boundaries in the combat refactor.

## Why the split exists

The original grid implementation lived under Encounter, which made sense initially.

As the system grows, the grid needs to be split because:

- the renderer is broadly reusable
- Encounter should not own every combat-facing UI primitive
- the grid is a core combat UI surface that may be reused elsewhere
- server-authoritative architecture later benefits from a clean renderer boundary

The goal is not to create a hyper-generic grid framework.
The goal is to create a **truly Encounter-independent grid renderer**.

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

## `EncounterGrid` owns

`EncounterGrid` should remain Encounter-owned and act as a thin wrapper/adaptor.

It should own:

- adapting Encounter state/props into `CombatGrid` props
- connecting feature-specific callbacks
- feature-level selection/target state wiring
- keeping parent route/screen churn minimal
- any necessary compatibility with the existing Encounter surface

The goal is for `EncounterGrid` to stop being the primary renderer.

## What `CombatGrid` must not own

`CombatGrid` must not import or depend on:

- `EncounterRuntimeContext`
- Encounter route types
- Encounter hooks
- setup workflow types
- modal/drawer orchestration
- campaign/route param logic

If the grid still needs those, the boundary is wrong and the wrapper needs to absorb more.

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

## Wrapper philosophy

`EncounterGrid` should be as thin as reasonably possible, but not thinner.

It is acceptable for the wrapper to retain:
- feature adaptation logic
- some compatibility mapping
- minor glue needed to preserve external API stability

It is not acceptable for the wrapper to still secretly contain most of the real renderer behavior.

## Success criteria

The grid split is successful when:

- `CombatGrid` can render without Encounter imports
- `EncounterGrid` is primarily adaptation/wrapping code
- parent route code changes remain reasonably small
- grid-local visual helpers move with the reusable renderer where appropriate
- another combat-oriented surface could reuse `CombatGrid` in principle