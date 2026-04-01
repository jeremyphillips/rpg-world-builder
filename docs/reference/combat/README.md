# Combat Reference

This directory contains the reference docs for the combat refactor and long-term combat architecture.

## Reading order

Start here:

1. [architecture.md](./architecture.md)
2. [ownership-boundaries.md](./ownership-boundaries.md)
3. [glossary.md](./glossary.md)
4. [migration-roadmap.md](./migration-roadmap.md)

Then branch by concern:

- Engine: [engine/overview.md](./engine/overview.md)
- Client UI: [client/overview.md](./client/overview.md)
- Local intent dispatch (Phase 4A+): [client/local-dispatch.md](./client/local-dispatch.md)
- Deferred client feedback follow-ups (Phase 4E docs): [client/feedback-followups.md](./client/feedback-followups.md)
- Server authority: [server/overview.md](./server/overview.md)
- Authored content bridge: [authored-content/location-floor-adapter.md](./authored-content/location-floor-adapter.md)

## Purpose

These docs exist to keep the end-state architecture clear during a long refactor.

The core model is:

- **combat** owns reusable engine truth
- **client combat UI** owns reusable combat-facing UI primitives
- **encounter** owns product workflow and screen composition
- **server** owns authority, sequencing, persistence, and broadcast
- **authored content** owns location floors/maps and adapts them into combat runtime seeds

## Directory guide

### Top-level docs
- `architecture.md` — big-picture system view
- `ownership-boundaries.md` — what each layer owns
- `glossary.md` — stable terminology
- `migration-roadmap.md` — phased refactor plan
- `adr-shared-combat-extraction.md` — ADR: shared combat extraction boundary, public API freeze, server import policy

### `engine/`
Shared combat engine docs:
- state
- resolution
- space/visibility
- intents/events
- selectors/presentation

### `client/`
Reusable client combat UI + Encounter integration docs:
- UI layer
- grid
- drawers/panels
- combat log
- local dispatch
- deferred feedback (`action-log-slice`, `registerIntentFailure`): [client/feedback-followups.md](./client/feedback-followups.md)

### `server/`
Future server-authoritative combat docs:
- authoritative flow
- session lifecycle
- persistence
- realtime sync
- permissions/validation

### `authored-content/`
How location floors/maps connect to combat runtime:
- location floor adapter
- combat seed

## How to use these docs during refactor work

When working on a combat refactor pass:

1. confirm which layer owns the code being changed
2. verify the intended boundary in `ownership-boundaries.md`
3. check whether the change affects engine, client, server, or authored-content docs
4. update the relevant phase or architecture doc if the plan changes materially

## Current architectural direction

The long-term target is:

- Encounter UI becomes a consumer of combat engine + combat UI
- truth-changing actions move toward intent dispatch
- server authority later replaces or backs local dispatch
- location floors enter combat through an explicit adapter seam