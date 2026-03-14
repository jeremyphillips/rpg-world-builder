---
name: Combat Effects Test Route
overview: Add a campaign-scoped test route for assembling a party and enemy lineup, viewing core combat stats, stepping turn order, and inspecting combat/effect logs while establishing the first explicit turn/encounter rules.
todos:
  - id: define-route-surface
    content: Add a campaign-scoped combat test route and decide its URL, navigation entry, and access guard.
    status: completed
  - id: define-combatant-selection
    content: Define how party, monster, and NPC options are loaded and normalized into a shared selectable combatant model.
    status: completed
  - id: define-encounter-state
    content: Introduce encounter state for sides, combatants, initiative order, round, active turn, and combat log events.
    status: completed
  - id: define-turn-rules
    content: Define the minimum turn and round rules needed to step combat forward and trigger timed effects.
    status: completed
  - id: define-log-model
    content: Define the combat log event schema and the actions that should emit log entries.
    status: completed
  - id: implement-test-route-ui
    content: Build the two-column encounter setup UI and the full-width combat log panel.
    status: in_progress
  - id: implement-encounter-controls
    content: Add initiative, next-turn, reset, and targeted test controls for validating combat effects.
    status: completed
  - id: add-guardrails
    content: Add tests around turn order, encounter state transitions, and combat log output for the test route milestone.
    status: in_progress
isProject: false
---

# Combat Effects Test Route

## Goal

Create a campaign-scoped test route where combat effects can be exercised without needing the full production combat experience first.

Milestone outcome:

- top half of the page is split into two columns:
  - `Party`
  - `Enemies`
- each side has a multiselect input
- party options load approved party members for the active campaign
- enemy options load monsters plus NPCs
- selected entries are appended into each side with core combat stats visible
- bottom section shows combat logs
- the page can step turns and record enough encounter state to validate timing-sensitive effects

## Recommended Route Shape

Add a campaign-scoped route under the existing authenticated campaign shell.

Recommended path:

- `/campaigns/:id/combat-test`

Likely touch points:

- `src/app/routes.ts`
- `src/app/router.tsx`
- `src/app/routes/index.ts`
- a new route component, likely near other campaign routes

Recommendation:

- keep this route campaign-scoped so it can reuse:
  - active campaign context
  - approved party APIs
  - campaign rules/catalog access
- treat it as a test harness rather than a user-facing polished combat feature
- gate the route to:
  - campaign owner
  - platform owner

Status update:

- added `/campaigns/:id/combat-test`
- route is wired into the campaign router and admin-only campaign navigation
- added a dedicated owner/platform-admin guard for the route
- added initial encounter domain types for combatants, encounter state, initiative rolls, and combat log events
- added a first deterministic initiative test file to anchor the pure helper layer
- party multiselect now loads approved party members into detailed combatant cards
- enemy multiselect now loads NPC and monster sources, with duplicate monster copies supported from the rendered cards
- combatant cards now surface core stats, attacks, and currently derivable effect chips
- encounter start now auto-rolls initiative and records initial log events
- next-turn now advances active combatant, wraps rounds, and appends deterministic encounter log entries
- selection changes currently reset the local encounter so lineup edits stay simple for milestone 1
- added targeted local test controls for damage, healing, condition markers, and state markers
- runtime HP, conditions, and states now render back onto combatant cards from encounter state
- added encounter helper coverage for HP mutation plus condition/state add-remove operations

## Locked Decisions

These decisions are now in scope for milestone 1:

1. Access:
  - route is gated to campaign owner and platform owner
2. Initiative:
  - first pass uses auto-roll on encounter start
  - manual/override controls come later
3. NPC mechanics:
  - NPCs should use the same combat stat pipeline as PCs where possible
4. Enemy duplication:
  - monsters can be selected multiple times from one option entry
5. Persistence:
  - encounter state and logs can stay route-local for milestone 1
6. Combatant detail level:
  - show attack entries and active effects, not just summary stats
7. Trigger testing:
  - manual canonical trigger firing is deferred to a later milestone
  - milestone 1 focuses on turn-boundary timing and explicit test controls

## What You Need Beyond The View

Your listed milestone needs more than layout and selectors. To make the page actually useful for testing effects, you will also need the following support systems.

### 1. Shared combatant view model

You need one normalized combatant shape for:

- party characters
- NPCs
- monsters

Minimum shared fields:

- `id`
- `sourceType`: `party_character` | `npc` | `monster`
- `displayName`
- `side`: `party` | `enemy`
- `initiativeModifier`
- `armorClass`
- `maxHitPoints`
- `currentHitPoints`
- attacks or test actions summary
- active conditions / states
- derived effects snapshot

Reason:

- the test route cannot work well if each source renders from a different schema
- turn rules and logging need one runtime combatant model

### 2. Selection loaders and option labeling

You need separate option providers:

- party characters from the active campaign
- monsters from the system/content catalogs
- NPCs from campaign/world content

You will also need:

- loading states
- empty states
- duplicate-selection policy
- clear labels when sources overlap in name

Recommended option shape:

- `value`
- `label`
- `sourceType`
- lightweight preview metadata

### 3. Encounter state, not just selected UI state

The milestone really needs an encounter model, not just two arrays of selected names.

Minimum encounter state:

- `partyCombatants`
- `enemyCombatants`
- `allCombatantsById`
- `initiativeOrder`
- `roundNumber`
- `activeCombatantId`
- `turnIndex`
- `startedAt` / reset token
- combat log entries

Likely implementation split:

- route-local state for first slice is fine
- separate pure helpers for encounter transitions

### 4. Turn rules

You called this out already, and it is the key unlock for effect testing.

Minimum turn rules for milestone:

1. Encounter start
  - initiative is assigned or manually set
  - combatants are sorted
  - first active combatant is selected
2. Turn progression
  - advance to next combatant
  - wrap to next round
  - log turn start and turn end
3. Round progression
  - increment round number when initiative wraps
4. Start/end turn hooks
  - process effects with `turn_start`
  - process effects with `turn_end`
5. Duration ticking
  - decrement or evaluate effects with turn-boundary durations
6. Skipping incapacitated/defeated combatants
  - define whether 0 HP or specific conditions remove a combatant from turn order
7. Reset rules
  - clear encounter state
  - optionally preserve last selected combatants for fast reruns

Recommended first-cut non-goals:

- reactions / interrupt windows
- movement grid
- targeting UI
- full combat action economy enforcement
- concentration resolution beyond simple logging
- manual trigger firing for arbitrary canonical `trigger` effects

### 5. Effect execution entry points

To test combat effects, the route needs a way to produce events, not just display participants.

At minimum, you need explicit test controls for:

- apply damage
- apply healing
- apply condition
- remove condition
- advance turn
- trigger a named effect/event manually

Potential milestone control set:

- `Next turn`
- `Reset encounter`
- `Deal damage`
- `Heal`
- `Apply condition`
- `Clear log`

Without those controls, the log panel won’t reveal much and turn rules will be hard to validate.

### 6. Combat log schema

The log panel should not just be freeform strings if you want this route to help future combat work.

Recommended log event shape:

- `id`
- `timestamp` or monotonic sequence
- `type`
- `actorId`
- `targetIds`
- `round`
- `turn`
- `summary`
- optional `details`

Useful event types:

- `encounter_started`
- `turn_started`
- `turn_ended`
- `round_started`
- `damage_applied`
- `healing_applied`
- `condition_applied`
- `condition_removed`
- `effect_triggered`
- `effect_expired`
- `combatant_defeated`
- `encounter_reset`

This gives you both UI rendering and future test assertions.

### 7. Derived stat snapshots

For effect testing, “core combat stats” should probably be derived at selection time and refreshable during combat.

Recommended first displayed stats:

- AC
- current / max HP
- initiative modifier
- movement
- attack entries
- active effects
- passive conditions / notes

You will likely need source-specific adapters:

- PCs can reuse `useCombatStats()` and existing character context/effect resolution
- monsters need a lightweight monster-to-combatant stat adapter
- NPCs likely need either:
  - the same character pipeline as PCs if NPCs share character mechanics
  - or a simpler NPC combat adapter

### 8. Stable ids for repeated test runs

You need a runtime combatant instance id that is not just the source content id.

Reason:

- the same monster may be added multiple times
- logs and initiative need unique instance identity

Recommended shape:

- `instanceId`
- `sourceId`
- `sourceType`

### 9. Deterministic testing tools

If the route is meant for effect testing, you will want deterministic controls early.

Helpful additions:

- manual initiative override
- fixed-seed initiative roll button
- add same monster multiple times
- clear and replay encounter setup
- optionally pin one combatant as active for effect debugging

### 10. Guardrail tests

The milestone should include tests for:

- party option loading normalization
- enemy option normalization
- initiative ordering
- turn advance / round wrap
- combat log emission
- reset behavior
- duplicate combatant instance ids

Keep the route UI thin and put test coverage on pure encounter helpers.

## Recommended Architecture

### UI layer

Create a dedicated route component with three zones:

1. top-left: `Party`
2. top-right: `Enemies`
3. bottom full-width: `Combat Log`

Probable companion components:

- `CombatTestRoute`
- `CombatantSelectorPanel`
- `CombatantCardList`
- `CombatLogPanel`
- `EncounterControlsBar`

### State layer

Add a local encounter state module with pure functions:

- `createEncounterState()`
- `addCombatantToSide()`
- `removeCombatantFromSide()`
- `startEncounter()`
- `advanceTurn()`
- `resetEncounter()`
- `appendLogEvent()`

### Adapter layer

Create explicit adapters:

- `partyCharacterToCombatant()`
- `monsterToCombatant()`
- `npcToCombatant()`

### Rule layer

Create turn/round helpers that operate on normalized encounter state:

- `buildInitiativeOrder()`
- `getActiveCombatant()`
- `applyTurnStartRules()`
- `applyTurnEndRules()`
- `advanceRoundIfNeeded()`

## Proposed Milestone Scope

### Phase 1: Route skeleton and loaders

- add route constant and router registration
- add route guard for campaign owner / platform owner access
- create page shell with two-column top and full-width bottom
- load:
  - approved party members
  - monsters
  - NPCs
- wire both multiselects
- allow duplicate monster selections via per-instance add behavior

Success criteria:

- users can select party and enemy entries and see them rendered in the correct column

### Phase 2: Combatant normalization

- define shared runtime combatant shape
- map PC, NPC, and monster selections into combatant instances
- display:
  - core stats
  - attack entries
  - active effects

Success criteria:

- selected entries append into each side with stable instance ids and usable core combat stats

### Phase 3: Encounter and turn rules

- define encounter state
- start encounter
- auto-roll initiative ordering on encounter start
- next turn
- round increment
- start/end turn log entries

Success criteria:

- encounter can be started and stepped turn-by-turn with deterministic log output

### Phase 4: Effect test controls

- add a small action/control bar
- support:
  - damage
  - healing
  - apply/remove condition
  - reset
- log all actions
- do not add manual trigger firing yet

Success criteria:

- route is useful for validating effect timing and state changes

### Phase 5: Guardrails

- add pure helper tests for encounter transitions
- add route-level smoke coverage if practical
- document the route’s purpose and scope

Success criteria:

- future combat experimentation does not regress basic turn or log behavior silently

## Turn Rules Recommendation

For the first milestone, use these explicit rules:

1. Initiative is required before the encounter starts.
2. Encounter start auto-rolls initiative for every combatant instance.
3. Advancing past the last combatant starts a new round.
4. Turn start logs before any manual action controls are used.
5. Turn end logs when advancing away from the active combatant.
6. Timed effects evaluate only at:
  - turn start
  - turn end
7. Defeated combatants stay visible but can be skipped automatically.
8. No reactions, held actions, or interrupts in milestone 1.
9. No manual trigger firing in milestone 1.

This gives you enough structure to test combat effects without needing a full combat engine first.

## Deferred Decisions

These are intentionally deferred until after the milestone works end-to-end:

1. Add manual initiative controls or override ordering.
2. Persist encounter state or logs across reloads.
3. Add manual trigger firing for canonical `trigger` effects.
4. Expand from effect testing into fuller combat action flow.
5. Add more advanced timing windows like reactions, interrupts, or concentration management.

## Recommendation On Missing Pieces

If the question is “what else do I need beyond the page layout and turn rules?”, the short list is:

- a normalized combatant runtime model
- encounter state
- initiative / round / active-turn rules
- effect test controls
- a structured combat log model
- source adapters for PCs, monsters, and NPCs
- stable instance ids for duplicate enemies
- pure helper tests for encounter transitions

Without those, the route will render but won’t actually be a reliable combat-effects test harness.