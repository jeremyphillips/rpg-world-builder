# Client Combat UI Overview

## Purpose

This document describes the role of the reusable client combat UI layer and how it relates to Encounter.

It should answer:

- what `src/features/combat` is for
- what belongs there
- what must stay out
- how Encounter should consume reusable combat UI

## What the client combat UI layer is

The client combat UI layer is the reusable, client-only React/UI layer for combat.

It exists so that Encounter does not need to own every combat-facing component and client presentation helper.

This layer should contain:
- reusable combat-facing components
- reusable renderer primitives
- client-only presentation helpers
- optional reusable combat UI hooks where clearly justified

It should not own combat truth.

## What belongs in client combat UI

Examples of things that belong here:

- `CombatPlayView` (shared active play layout shell)
- `CombatantAvatar`
- `CombatantPreviewCard`
- combat badges/chips
- `CombatGrid`
- reusable action-row primitives
- reusable panel leaves
- reusable combat log display leaves
- client-only presentation helpers for chips/tooltips/stats

## What does not belong here

Things that should not live in client combat UI:

- canonical combat state transitions
- engine selectors/pure shared derivation
- Encounter routes
- setup flow
- feature-owned modal/drawer shells
- route/campaign-specific link building
- server authority logic

## Boundary with shared combat engine

The shared combat engine owns:
- truth
- state
- resolution
- selectors
- pure/shared presentation derivation
- intents/results/events

The client combat UI owns:
- rendering
- component-level composition
- client-only presentation helpers

A helpful rule:

> If it must be reusable by server/shared logic, it belongs closer to engine ownership. If it is purely client rendering/presentation, it belongs in client combat UI.

## Boundary with Encounter

Encounter owns:
- product workflow
- screen composition
- setup flow
- DM workflow
- shells and wrappers around reusable combat pieces

Client combat UI owns:
- reusable leaves and primitives

A good mental model is:

- Encounter is the **consumer/composer**
- client combat UI is the **reusable leaf layer**

## Expected directory shape

The client combat UI layer will usually look something like:

- `src/features/combat/components`
- `src/features/combat/presentation`
- `src/features/combat/hooks`

Not every pass needs to populate all of these equally.

## Important design rules

### No Encounter imports
Files under `src/features/combat/**` should not import from:
- `src/features/encounter/**`

If a reusable-looking component needs Encounter imports, either:
- split the reusable leaf from the Encounter wrapper
- or leave it in Encounter

### Avoid prop explosion
Do not make a component reusable by shoving Encounter internals into a huge prop surface.

Prefer:
- small focused presentational contracts
- thin wrappers in Encounter

### Prefer base + wrapper over duplicated variants
If Encounter has several side-specific or workflow-specific variants, it is often better to:
- extract a reusable base into client combat UI
- keep thin Encounter wrappers around it

## Relationship to Phase 3

Phase 3 is primarily about establishing this layer.

Examples:
- shared primitive extraction
- client presentation helper extraction
- `CombatGrid` vs `EncounterGrid`
- panel leaves vs drawer shells
- combat log display leaves vs shell modals/panels

## Relationship to Phase 4

As Phase 4 introduces local dispatch and intent flow, the client combat UI layer should remain focused on:
- rendering canonical state/results
- gathering input
- invoking dispatch through clean interfaces

It should not become the new owner of combat truth.

Details: [local-dispatch.md](./local-dispatch.md) — intents, `applyCombatIntent`, and Encounter’s role as composer.