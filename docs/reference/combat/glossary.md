# Combat Glossary

## Purpose

This glossary defines the main terms used across combat architecture and refactor docs.

These terms should stay stable unless there is a deliberate naming change.

## Combat
The reusable combat system concept.

Usually refers to:
- shared combat engine
- reusable combat UI
- combat runtime concepts
- truth-changing flows

Combat is broader than any one feature screen.

## Encounter
The product feature/surface that hosts combat workflow in the app.

Usually refers to:
- setup flow
- active combat screen composition
- DM workflow
- feature-specific wrappers, shells, and orchestration

Encounter is a consumer of combat.

## Shared combat engine
The pure/shared layer that owns combat truth.

It includes:
- state
- resolution
- selectors
- pure derivation
- intents/results/events

It is designed to be reusable by both client and server.

## Client combat UI
The reusable client-only combat-facing UI layer.

It includes:
- reusable components
- client presentation helpers
- renderer-level primitives
- optional reusable combat hooks

It does not own truth.

## Combat space
The normalized runtime board/space representation used during live combat.

It includes concepts like:
- cells
- obstacles
- blockers
- runtime visibility/cover/terrain state

It is different from authored floor/map editor data.

## Location floor
An authored content model representing a floor/map in the location editor/content domain.

It belongs to authored content, not live combat runtime.

## Combat seed
A normalized startup/runtime input derived from authored content and other setup information that is used to initialize combat runtime state.

## Intent
A truth-changing request submitted by UI or another caller.

Examples:
- end turn
- move combatant
- resolve action
- place area
- choose spawn cell

Intents should be explicit and serializable.

## Event
A canonical record of something that happened as a result of combat resolution.

Events are useful for:
- logs
- toasts
- timelines
- replay/rebuild flows
- server broadcast

## Result
The structured outcome of handling an intent.

A result may include:
- success/failure
- validation issues
- produced events
- updated state or state references

## Selector
A pure derived-state function that summarizes or extracts useful information from canonical combat state.

## Pure presentation derivation
A pure/shared derivation layer that produces reusable display-oriented models from combat state without becoming client-rendering code.

This belongs closer to engine ownership than client-only rendering helpers.

## Client presentation helper
A client-only helper that formats or maps combat data for rendering concerns such as:
- chips
- tooltips
- modal/card stat display
- UI-only formatting

This belongs to client combat UI, not the shared engine.

## Shell
A feature-owned orchestration component that composes reusable primitives and manages workflow/state coordination.

Examples:
- drawer shells
- modal shells
- panel shells

## Wrapper
A thin adapter component that maps feature-specific state/props into reusable combat-owned component props.

## Panel
A smaller UI leaf component, often prop-driven, that may be reusable even when its parent shell is not.

## Authoritative state
The canonical source of truth for combat state.

Long-term, this will live on the server for multiplayer/live play.

## Local UI state
Temporary client-only interaction state that should not be treated as canonical combat truth.

Examples:
- hover state
- open/closed modals
- temporary selection preview
- unconfirmed area placement