# Combat Ownership Boundaries

## Purpose

This document defines which layer owns which responsibilities.

This is the primary reference for deciding **where code belongs** in the combat system—during refactors and for new features. It complements [architecture.md](./architecture.md) (system view) and [roadmap.md](./roadmap.md) (what is shipped and what remains).

## Core rule

> Combat owns truth. Encounter owns workflow.

That rule is expanded below.

## Shared combat engine owns

The shared combat engine owns canonical combat truth and shared derivation.

It owns:

- combat state types
- combat state mutations
- action legality
- targeting legality
- movement legality
- turn progression
- conditions/effects/concentration
- reactions
- combat space / runtime board state
- selectors
- pure presentation derivation
- intents/results/events

Questions the engine should answer:

- Is this target valid?
- Can this actor move here?
- Does line of sight exist?
- Is the target visible?
- What happens when HP reaches zero?
- Does concentration end here?
- What events happened as a result of this action?

The engine must not own:

- React components
- route state
- setup flow
- Encounter-specific workflow
- modal/drawer orchestration
- server transport
- authored location editor semantics

## Client combat UI owns

Reusable client combat UI owns rendering primitives and client-only presentation helpers.

It owns:

- reusable combat components
- reusable combat renderer layers
- client-only formatting/chips/tooltips
- optional reusable combat UI hooks
- wrappers around canonical state/results for display

Questions client combat UI should answer:

- How should a combatant preview card render?
- How should a grid cell be visually styled?
- How should a combat log entry display?
- How should a reusable action-row primitive render?

Client combat UI must not own:

- combat truth
- Encounter workflow
- route/campaign lookup
- setup modal types
- server authority
- authored location semantics

## Encounter feature owns

Encounter owns product workflow and orchestration.

It owns:

- routes
- setup flow
- active-screen composition
- feature-specific wrappers
- DM workflow
- drawer shells
- modal shells
- route/campaign-specific link construction
- temporary UI state tied to feature workflow

Questions Encounter should answer:

- Which setup modal is open?
- Which floor is selected for this encounter?
- How should the active screen be composed?
- How do feature-level wrappers adapt Encounter state into combat props?

Encounter must not own:

- shared combat truth
- reusable engine derivation
- reusable combat UI primitives that can live elsewhere

## Server combat application owns

Server combat application owns authority and session orchestration.

It owns:

- intent validation
- permission checks
- latest-state loading
- resolving through the shared engine
- persistence
- broadcast/realtime sync
- session lifecycle
- reconnect/resync behavior

Questions server combat application should answer:

- Is this client allowed to perform this action?
- Is this intent stale or still valid?
- What is the latest authoritative state?
- What should be persisted and broadcast?

The server must not duplicate engine rules logic unnecessarily.

## Authored content owns

Authored content owns map/floor/location authoring concepts.

It owns:

- location floor schema
- editor semantics
- authored rooms/doors/objects/tags
- floor metadata
- authored lighting/terrain semantics
- adapter inputs into combat seed creation

Questions authored content should answer:

- How is a floor represented in the editor?
- What authored tags/objects/doors exist?
- What location metadata belongs to the floor?

Authored content must not directly own:

- live combat truth
- runtime-only combat state
- server session authority

## Adapter seam owns

The adapter seam bridges authored content and combat runtime.

It owns:

- normalization of authored floor data into combat seed data
- translation of authored objects/terrain/light into combat-usable runtime state

It should be explicit and narrow.

## Quick decision guide

### Put code in shared combat engine if:
- it decides truth
- it mutates canonical combat state
- the server will need it
- it is pure and serializable

### Put code in client combat UI if:
- it is a reusable combat-facing component or client presentation helper
- it should not depend on Encounter routes/workflow

### Put code in Encounter if:
- it is setup, layout, orchestration, or feature workflow
- it is a shell around reusable combat pieces

### Put code in server combat application if:
- it is about authority, validation, persistence, sync, or session flow

### Put code in authored content if:
- it belongs to location/map/floor authoring or authoring semantics