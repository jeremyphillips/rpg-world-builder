# Location Floor Adapter

## Purpose

This document describes the adapter seam between authored location floor content and combat runtime state.

It should answer:

- what a location floor is
- what a combat seed/runtime input is
- why an adapter seam is needed
- what should and should not cross that boundary

## Why this adapter exists

Location floors belong to authored content.
Combat runtime belongs to the combat system.

Those are different domains.

If authored location concepts are pushed directly into combat runtime internals, the combat system becomes tightly coupled to editor-facing structures and semantics.

The adapter exists to keep that boundary explicit.

## Source side: `LocationFloor`

A location floor is authored content.

It may contain concepts such as:
- authored cells/rooms
- doors/openings
- placed objects
- terrain tags
- light/darkness metadata
- spawn markers
- editor-oriented metadata

These concepts belong to authored content and should remain understandable in that domain.

## Destination side: combat seed / runtime input

Combat does not want raw editor-facing structures.

Combat wants normalized runtime-relevant input such as:
- combat space cell data
- blockers/obstacles
- difficult terrain
- obscured areas
- cover-relevant objects
- runtime light/darkness inputs
- spawn anchors
- environment baseline data
- initial placement hints where appropriate

This normalized output can be thought of as a combat seed or combat runtime initialization input.

## Adapter responsibilities

The adapter owns:

- translation from authored floor concepts into runtime combat concepts
- normalization of authored data into combat-usable structures
- preserving a clean boundary between editor semantics and combat runtime

The adapter should be explicit and narrow.

## What should not cross the boundary directly

These should not leak directly into combat internals without normalization:

- editor-only metadata
- UI-only authoring state
- authoring workflow flags
- content-management-specific wrapper structures
- arbitrary location editor assumptions that the combat engine does not need

## Relationship to Encounter

Encounter may use a location floor during setup, but Encounter should not directly treat the raw location floor as combat runtime state.

The intended flow is:

1. Encounter/setup selects a location floor
2. adapter transforms the floor into combat seed/runtime input
3. combat runtime initializes from normalized combat-facing data

## Relationship to shared engine

The combat engine should consume normalized runtime concepts, not authored editor concepts.

That keeps the engine:
- cleaner
- more stable
- easier to reuse
- less coupled to authored content implementation churn

## Likely output categories

The exact schema may evolve, but likely output categories include:
- normalized grid/cell structure
- obstacle/blocker placement
- cover-relevant data
- visibility/light baseline
- terrain movement modifiers
- spawn anchors or placement hints
- environment settings

## Design goal

The adapter seam is successful when:

- authored content can evolve without destabilizing combat runtime internals
- combat runtime can operate on normalized data it actually understands
- Encounter setup can connect the two without collapsing their boundaries