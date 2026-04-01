# Combat Engine Overview

## Purpose

This document describes the role of the shared combat engine.

It should answer:

- what the engine owns
- what the engine does not own
- what design constraints apply to engine code
- how the engine relates to client UI, Encounter, server authority, and authored content

## What the shared combat engine is

The shared combat engine is the canonical layer that owns combat truth and reusable combat derivation.

It is intended to be usable by:

- the client
- the future server-authoritative combat application
- tests
- tooling or simulation helpers where needed

The engine is not a UI layer and not a product workflow layer.

## What the engine owns

The engine owns:

- canonical combat state
- combat state transitions and mutations
- action legality
- targeting legality
- movement legality
- turn progression
- conditions, effects, concentration, auras
- reactions
- runtime battlefield / combat space state
- selectors
- pure/shared presentation derivation
- intents, results, and events

## What the engine does not own

The engine does not own:

- React components
- client-only rendering helpers
- route state
- Encounter workflow
- setup modal orchestration
- server transport
- realtime session membership
- location editor semantics
- authored content UI concepts

## Design constraints

Engine code should be:

- pure where practical
- deterministic
- serializable
- reusable on client and server
- free of React and router concerns
- explicit about canonical inputs and outputs

Engine code should avoid:

- imports from Encounter feature code
- imports from client combat UI
- imports from authored content editor layers
- ad hoc UI message formatting as canonical output

## Main engine subdomains

### State
Owns the canonical combat state model:
- combatants
- turn state
- participation
- defeat/remains
- battlefield/runtime references
- runtime effect state

### Resolution
Owns truth-changing resolution:
- action resolution
- targeting
- movement
- effect application
- turn advancement
- spawn/replacement behavior

### Space / visibility
Owns runtime board concepts:
- cells
- blockers
- obstacles
- line of sight
- obscurity
- visibility/perception interactions

### Selectors / pure presentation
Owns pure reusable derivation from canonical state:
- availability summaries
- presentation-ready but still pure models
- header summaries
- turn summaries
- combat-visible derived data

### Intents / results / events
Owns the canonical request/result shape for truth-changing operations.

This is especially important for the Phase 4+ architecture.

## Relationship to client combat UI

The client combat UI should consume the engine.

The client may use:
- canonical state
- selectors
- pure presentation derivation
- intent/result/event contracts

But client combat UI should not re-own combat truth.

## Relationship to Encounter

Encounter is a product feature that consumes the engine.

Encounter may:
- gather user input
- manage workflow
- adapt feature state into engine calls
- compose UI shells around engine-derived data

Encounter should not own logic that determines canonical combat truth if that logic belongs in the engine.

## Relationship to server authority

The long-term plan is for the server to become the authoritative runtime owner for multiplayer/live play.

When that happens, the server should still use the same shared combat engine for:
- validation
- resolution
- canonical event production

This is why the engine must remain client/server-shareable.

## Relationship to authored content

Authored content does not directly define runtime combat state.

Instead:
- authored content produces source data such as `LocationFloor`
- an adapter normalizes that data into a combat seed
- the engine consumes the combat seed/runtime state

This keeps editor-facing concepts from leaking into engine internals.

## Success criteria

The engine layer is healthy when:

- it can run without React or Encounter
- it can be reused by the future server authority layer
- its contracts are shaped around combat concepts, not UI mechanics
- it remains the canonical home of combat truth