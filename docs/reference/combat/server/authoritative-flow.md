# Server Authoritative Combat Flow

## Purpose

This document describes the **authoritative server** model for combat: responsibilities, how intents are handled, how the shared engine fits in, and how persistence and broadcast relate.

It should answer:

- what the server is responsible for
- how combat intents should be handled server-side
- how the shared combat engine fits in
- how state, persistence, and broadcast relate

**What is implemented today** vs **future** is summarized in [roadmap.md](../roadmap.md) (gaps, next steps). This file stays oriented toward the **target** end state; the roadmap tracks **current** HTTP surface and limitations.

## Current server surface (minimal persistence)

As of the Stage 3C pass, the server exposes revisioned combat sessions over REST:

- **`POST /api/combat/sessions`** — builds initial state via **`startEncounterFromSetup`**, persists a document with **`sessionId`**, **`revision`** (initial snapshot), and **`state`**, returns those fields to the client.
- **`POST /api/combat/sessions/:sessionId/intents`** — body includes **`baseRevision`**, **`intent`**, optional **`context`**; loads persisted state, checks revision, runs **`applyCombatIntent`**; on success, persists **`nextState`** and increments revision; returns **`409`** on stale revision and **`404`** if the session id is unknown.

This is **not** multiplayer yet: there is **no** socket broadcast, **no** campaign permission checks on these routes by default, and the **Encounter** client still uses **local** dispatch unless separately wired to these APIs. See [roadmap.md](../roadmap.md).

## Core principle

In multiplayer/live play, the server becomes the authoritative owner of combat truth.

That means the server is responsible for:
- receiving truth-changing intents
- validating them against latest state and permissions
- resolving them through the shared combat engine
- persisting canonical updates
- broadcasting canonical results/state to clients

## High-level flow

The target flow is:

1. client gathers input
2. client submits a combat intent
3. server validates permission and latest-state assumptions
4. server resolves through shared combat engine
5. server persists canonical updates
6. server broadcasts canonical result/state/events
7. clients render updated canonical state

## What the server owns

The server owns:

- authority
- validation
- sequencing
- persistence
- realtime broadcast
- reconnect/resync support
- session lifecycle

The server does not need to own a separate duplicate rules engine.
It should use the shared combat engine.

## Validation responsibilities

Before resolving an intent, the server should verify things such as:

- does the acting user have permission to act?
- is it the correct turn?
- is the intent stale relative to latest state?
- is the combatant still valid/alive/available?
- is the selected target or destination still legal?

These checks sit around and alongside engine resolution, not instead of it.

## Shared engine relationship

The server should use the shared combat engine for:
- legality
- resolution
- canonical event generation
- resulting state updates

This is why the engine must remain:
- deterministic
- serializable
- free of client-only dependencies

## Persistence model

The server will likely need to persist:
- current combat snapshot
- important event history
- session metadata

Exact storage strategy may evolve, but the server should preserve a canonical source of truth outside of the client.

## Broadcast model

After a successful resolution, the server should broadcast enough canonical information for clients to update.

That may include:
- updated state snapshot
- state delta/patch
- canonical events
- turn changes
- combat log-relevant result data

The exact transport format can evolve later.

## Client role in authoritative flow

In authoritative mode, the client should become:

- input gatherer
- intent sender
- canonical-state renderer

The client may still maintain local UI state such as:
- hover
- open panels
- temporary previews

But truth-changing operations should be driven by server-approved results.

## Benefits of this model

This model supports:

- multiplayer live play
- consistent truth across participants
- replay/debug opportunities
- safer permission enforcement
- clearer separation between UI and truth

## Relation to local dispatch

Before server authority exists, the client may use a local dispatch seam with intents/results/events.

That local seam is useful because it makes the later transition to server authority more incremental:
- UI already thinks in terms of intents
- engine already produces structured results/events
- the implementation backing dispatch can later move to the server