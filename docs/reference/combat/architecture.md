# Combat Architecture

## Purpose

This document describes the **combat architecture** at a high level: what the system is, which layers exist, how they interact, and the **philosophy** that keeps those boundaries stable.

It is the top-level answer to:

- what the combat system is
- what major layers it has
- how those layers interact
- what long-term shape the refactor is moving toward

**Operational status** (what is implemented vs planned next, and known limitations) lives in [roadmap.md](./roadmap.md) so this file stays relatively stable.

## Philosophy (why these layers exist)

Combat documentation is split on purpose:

- **Truth** (rules, state, legality, resolution) must be **shared** and **testable** in one place so client and server do not diverge.
- **Workflow** (modals, setup, routing, DM experience) is product-specific and belongs in **Encounter**, not inside the engine.
- **Presentation** (grid rendering, tooltips) is **client UI** and must not own canonical state.
- **Authority** (who may act, what is persisted, ordering, broadcast) is **server**; the server calls the same mechanics functions as the client.

If you are unsure where something goes, use [ownership-boundaries.md](./ownership-boundaries.md).

## Current implementation snapshot

This is a **brief** anchor; details and gaps are in [roadmap.md](./roadmap.md).

- **Client:** Encounter uses **`startEncounterFromSetup`** for encounter start and **`applyCombatIntent`** for migrated in-encounter actions (see [client/local-dispatch.md](./client/local-dispatch.md)). This is still **local** to the browser for the main product flow.
- **Shared package:** [`@rpg-world-builder/mechanics`](../../../packages/mechanics/README.md) exposes the combat application seams and wire types (see [adr-shared-combat-extraction.md](./adr-shared-combat-extraction.md)).
- **Server:** REST endpoints persist **combat sessions** (MongoDB) with **`sessionId`**, **`revision`**, and **`EncounterState` snapshot**; startup and apply-intent are **separate** routes. Realtime broadcast and campaign permissions are **not** part of the current minimal server surface.

## Core architecture

The combat system is split into five major layers:

1. **shared combat engine**
2. **client combat UI**
3. **encounter feature**
4. **server combat application**
5. **authored content + adapter seam**

### 1. Shared combat engine

This layer owns **truth**.

It is responsible for:

- canonical combat state
- action legality
- targeting legality
- movement legality
- turn progression
- conditions/effects/concentration
- reactions
- combat space / runtime board state
- selectors and pure derived models
- intents, results, and events

This layer should be:

- pure
- deterministic
- serializable
- reusable on both client and server
- free of React, router, and Encounter workflow concerns

### 2. Client combat UI

This layer owns reusable combat-facing UI primitives.

It is responsible for:

- reusable combat components
- reusable combat presentation helpers
- reusable renderer-level contracts
- client display of canonical combat state and results

This layer does **not** own truth.

### 3. Encounter feature

This layer owns the product workflow around combat.

It is responsible for:

- routes
- setup flow
- active encounter screen composition
- DM workflow
- wrappers/adapters that connect feature state to combat UI
- feature-specific modals and orchestration shells

Encounter is a **consumer** of combat engine and combat UI.

### 4. Server combat application

This layer owns authority for multiplayer/live play.

It is responsible for:

- receiving intents
- validating permissions
- loading latest state
- resolving through shared combat engine
- persisting state/events
- broadcasting canonical updates
- sequencing and reconnect behavior

This layer does **not** own core rules logic.

### 5. Authored content + adapter seam

This layer owns location/map/floor authoring concepts.

It is responsible for:

- location floor schema
- map/floor editor semantics
- authored rooms/doors/objects/tags
- adapter seam into combat runtime seed data

Authored content does **not** directly own live combat state.

## High-level data flow

### Target direction (end state)

1. Authored content produces a location floor
2. An adapter converts the location floor into a combat seed
3. Combat starts with canonical runtime state
4. Client UI renders combat state through reusable combat UI
5. Encounter composes product workflow around that UI
6. Truth-changing operations use the **intent** seam (client-local and/or server-backed)
7. Server is authoritative for persisted combat state and broadcasts updates to participants

The gap between “local intents only” and “server-backed multiplayer” is tracked in [roadmap.md](./roadmap.md).

### Today (incremental)

Local dispatch is in production for migrated flows; the server exposes a **persisted** combat API suitable for **authoritative** clients when wired up. Encounter is not required to use the server API yet.

## Key boundaries

### Combat vs Encounter
- Combat owns reusable truth and reusable combat-facing abstractions
- Encounter owns feature workflow and orchestration

### Engine vs Client UI
- Engine owns pure derivation and state transitions
- Client UI owns rendering and client-only presentation helpers

### Client vs Server
- Client gathers input and renders canonical state
- Server validates, resolves, persists, and broadcasts

### Authored content vs Combat runtime
- Authored content owns editor-facing map concepts
- Combat runtime owns normalized board/space state

## What this architecture is trying to prevent

This architecture is specifically intended to prevent:

- truth being trapped inside Encounter UI
- engine code depending on feature code
- reusable combat UI depending on routes or setup state
- server-authoritative multiplayer requiring a full rewrite later
- authored location/map concepts leaking directly into runtime combat internals

## Definition of success

This architecture is successful when:

- combat engine can run identically on client and server
- Encounter consumes combat instead of owning combat truth
- reusable combat UI is clearly separated from Encounter workflow
- location floors enter combat through an explicit adapter seam
- truth-changing flows can move from local dispatch to server authority without rewriting the whole UI