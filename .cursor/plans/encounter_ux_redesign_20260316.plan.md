---
name: Encounter UX Redesign
overview: |
  Redesign the combat simulation route into a two-mode encounter experience (setup → active) with new component architecture, terminology rename (Party→Allies, Enemies→Opponents), folder rename (combatSimulation→encounter), structured log presentation, sticky header/footer, modals, and consistent badge/tone integration via COMBAT_STATE_UI_MAP.
todos:
  - id: phase-0-terminology
    content: Rename Party→Ally/Allies, Enemies→Opponent/Opponents across types, hooks, components, route, and file names. Rename feature folder combatSimulation→encounter.
    status: completed
  - id: phase-1-environment
    content: Populate environment.constants.ts with { id, name, description } arrays for setting, lighting, terrain, visibility, atmosphere. Export dynamic types back into environment.types.ts.
    status: completed
  - id: phase-2-domain-types
    content: Add encounter-view.types.ts (CombatantPreviewCard types, CharacterCombatant, MonsterCombatant, wrapper props, TurnOrderStatus) and combat-log.types.ts + combat-log.ts (log grouping, filtering, formatting).
    status: completed
  - id: phase-3-base-components
    content: Create CombatantPreviewCard (pure presentational), CombatLogEntry, TurnOrderList base components.
    status: completed
  - id: phase-4-view-shell
    content: Create EncounterView (mode switcher + scroll container), EncounterSetupHeader, EncounterActiveHeader, EncounterActiveFooter with sticky positioning.
    status: pending
  - id: phase-5-setup-view
    content: Build EncounterSetupView, EncounterEnvironmentSetup, AllyCombatantSetupPreviewCard, OpponentCombatantSetupPreviewCard, AllyRosterLane, OpponentRosterLane.
    status: pending
  - id: phase-6-active-view
    content: Build EncounterActiveView, EncounterEnvironmentSummary, AllyCombatantActivePreviewCard, OpponentCombatantActivePreviewCard, AllyCombatantActiveCard, OpponentCombatantActiveCard, CombatActionPreviewCard, CombatTargetPreviewCard, CombatLogPanel.
    status: pending
  - id: phase-7-modals
    content: Build EncounterEditModal, CombatTargetSelectModal, CombatLogModal, CombatTurnOrderModal, SelectEncounterCombatantModal, SelectEncounterAllyModal, SelectEncounterOpponentModal.
    status: pending
  - id: phase-8-route-rewire
    content: Rename route to EncounterRoute, wire EncounterView as top-level, delete deprecated monolith files, update barrel exports and app route config.
    status: pending
  - id: phase-9-polish
    content: Audit all badges against COMBAT_STATE_UI_MAP, verify collapsible sections, responsive layout, sticky positioning does not affect left rail.
    status: pending
isProject: true
---

# Encounter UX Redesign

## Overview

Redesign the combat simulation route into a two-mode encounter experience with:

- **Setup view**: roster selection, environment config, combatant preview
- **Active view**: turn-by-turn combat with focused combatant detail, inline log, sticky controls

The redesign also renames the feature folder (`combatSimulation` → `encounter`), updates all terminology (Party → Allies, Enemies → Opponents), introduces structured log presentation, modals, and wires `COMBAT_STATE_UI_MAP` tones into `AppBadge` throughout.

### Wireframes

Wireframe image is stored at:
`.cursor/projects/Users-jeremyphillips-Development-dnd-character-builder/assets/Untitled-2026-03-15-1211-4c5cd197-c6cc-4a5c-b4d4-d986f22f647b.png`

---

## Resolved Decisions


| #   | Topic                     | Decision                                                                                                                                                           |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Folder rename             | **Yes** — rename `combatSimulation/` → `encounter/`. All import paths update.                                                                                      |
| 2   | Hook refactoring          | Keep the single `useCombatSimulationEncounter` hook (renamed). Create view-specific prop types that slice its return value.                                        |
| 3   | Log grouping              | Heuristic grouping in the UI layer (group consecutive entries sharing round + turn + actor). Engine-level `actionGroupId` is a future improvement.                 |
| 4   | Preview card naming       | "Active" in `AllyCombatantActivePreviewCard` refers to the `EncounterActiveView` context, not "active turn." `isCurrentTurn` disambiguates. See naming note below. |
| 5   | Environment constants     | Define constants for fields that appear as selects: `setting`, `lighting.level`, `visibility.obscured`, `terrain.movement`, `atmosphere.tags`.                     |
| 6   | Sticky positioning        | `EncounterView` becomes a flex column filling available height. Header/footer use `position: sticky` within that container. Does not affect global left rail.      |
| 7   | Footer target display     | Footer displays the currently selected target inline — no target selection from the footer. `CombatTargetSelectModal` handles selection.                           |
| 8   | Edit Encounter modal      | Only accessible from `EncounterActiveView` (mid-encounter editing).                                                                                                |
| 9   | CombatLogPanel visibility | Always visible within `EncounterActiveView` (below the lanes). `CombatLogModal` is a separate full-detail modal.                                                   |


---

## Naming Conventions

### Terminology Rename


| Old                | New                   |
| ------------------ | --------------------- |
| Party / party      | Ally / Allies         |
| Enemy / enemies    | Opponent / Opponents  |
| `PartyOption`      | `AllyOption`          |
| `EnemyOption`      | `OpponentOption`      |
| `EnemyRosterEntry` | `OpponentRosterEntry` |
| `selectedPartyIds` | `selectedAllyIds`     |
| `enemyRoster`      | `opponentRoster`      |
| `PartyRosterLane`  | `AllyRosterLane`      |
| `EnemyRosterLane`  | `OpponentRosterLane`  |


### Component Naming

Route and feature-level:


| Component             | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `EncounterRoute`      | Top-level route (renamed from `CombatSimulationRoute`) |
| `EncounterView`       | Mode switcher rendering setup or active view           |
| `EncounterSetupView`  | Full setup layout                                      |
| `EncounterActiveView` | Full active-encounter layout                           |


Headers and footers:


| Component               | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `EncounterSetupHeader`  | Sticky header for setup (encounter name, Start Encounter button)         |
| `EncounterActiveHeader` | Sticky header for active (round/turn, active combatant, nav buttons)     |
| `EncounterActiveFooter` | Sticky footer (turn resources, selected action/target, Resolve/End Turn) |


Environment:


| Component                     | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `EncounterEnvironmentSetup`   | Environment config selects (setting, lighting, terrain, visibility) |
| `EncounterEnvironmentSummary` | Read-only environment summary in active view                        |


Roster lanes:


| Component            | Purpose                                |
| -------------------- | -------------------------------------- |
| `AllyRosterLane`     | Ally combatant column (both views)     |
| `OpponentRosterLane` | Opponent combatant column (both views) |


Preview cards (compact lane cards):


| Component                            | Mode   | Purpose                                                                     |
| ------------------------------------ | ------ | --------------------------------------------------------------------------- |
| `CombatantPreviewCard`               | —      | Pure presentational base driven by `CombatantPreviewCardProps`              |
| `AllyCombatantSetupPreviewCard`      | setup  | Wraps base, maps `CharacterCombatant` data, setup actions (remove)          |
| `OpponentCombatantSetupPreviewCard`  | setup  | Wraps base, maps `MonsterCombatant` data, setup actions (remove, duplicate) |
| `AllyCombatantActivePreviewCard`     | active | Wraps base, maps character data, active actions (inspect, select)           |
| `OpponentCombatantActivePreviewCard` | active | Wraps base, maps monster data, active actions (inspect, select)             |


> **Naming note:** "Active" in `AllyCombatantActivePreviewCard` consistently maps to the
> `EncounterActiveView` context. It does **not** imply the combatant has the active turn — that
> concept is represented by the `isCurrentTurn` prop on `CombatantPreviewCardProps`. This naming
> is acceptable because it mirrors the view-mode naming (`setup` / `active`) used throughout.
> If a shorter name is preferred later, `AllyCombatantLaneCard` is a viable alternative.

Detail cards (expanded, for focused combatant):


| Component                     | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `CombatantActiveCard`         | Shared base (if ally/opponent share enough layout)                       |
| `AllyCombatantActiveCard`     | Full detail card with collapsible Actions, Bonus Actions, Combat Effects |
| `OpponentCombatantActiveCard` | Same pattern, monster-specific fields (form, manual triggers)            |


Action and target:


| Component                 | Purpose                 |
| ------------------------- | ----------------------- |
| `CombatActionPreviewCard` | Selected action display |
| `CombatTargetPreviewCard` | Selected target display |


Log and turn order:


| Component        | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `CombatLogPanel` | Inline log (always visible in active view), compact presentation |
| `CombatLogEntry` | Single grouped log entry                                         |
| `TurnOrderList`  | Initiative/turn order display with `TurnOrderStatus` badges      |


Modals (all wrap `AppModal`):


| Component                       | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `EncounterEditModal`            | Edit encounter mid-combat (active view only)          |
| `CombatTargetSelectModal`       | Target selection with rich combatant list             |
| `CombatLogModal`                | Full combat log with headline + detail + debug layers |
| `CombatTurnOrderModal`          | Full initiative table                                 |
| `SelectEncounterCombatantModal` | Base combatant selection modal                        |
| `SelectEncounterAllyModal`      | Ally selection variant                                |
| `SelectEncounterOpponentModal`  | Opponent selection with Monsters/NPCs tabs            |


---

## Domain Types

### encounter-view.types.ts

```ts
export type CombatantPreviewMode = 'setup' | 'active'
export type CombatantPreviewKind = 'character' | 'monster'

export type PreviewTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success'

export type PreviewChip = {
  id: string
  label: string
  tone?: PreviewTone
}

export type PreviewStat = {
  label: string
  value: string
}

export type CombatantPreviewAction = {
  id: string
  label: string
  disabled?: boolean
  onClick?: () => void
}

export type CombatantPreviewCardProps = {
  id: string
  kind: CombatantPreviewKind
  mode: CombatantPreviewMode
  title: string
  subtitle?: string
  stats: PreviewStat[]
  chips?: PreviewChip[]
  isCurrentTurn?: boolean
  isSelected?: boolean
  isDefeated?: boolean
  primaryAction?: CombatantPreviewAction
  secondaryActions?: CombatantPreviewAction[]
  onClick?: () => void
}

export type CharacterCombatant = {
  id: string
  name: string
  race?: string
  className?: string
  level?: number
  armorClass?: number
  hitPoints?: { current: number; max: number }
  initiativeModifier?: number
  movement?: { current?: number; max?: number }
  criticalStates?: Array<{ id: string; label: string; tone?: PreviewTone }>
}

export type MonsterCombatant = {
  id: string
  name: string
  creatureType?: string
  challengeRating?: string
  armorClass?: number
  hitPoints?: { current: number; max: number }
  initiativeModifier?: number
  movement?: { current?: number; max?: number }
  criticalStates?: Array<{ id: string; label: string; tone?: PreviewTone }>
}

export type SetupPreviewWrapperProps<TCombatant> = {
  combatant: TCombatant
  isSelected?: boolean
  onClick?: () => void
  onRemove?: () => void
}

export type ActivePreviewWrapperProps<TCombatant> = {
  combatant: TCombatant
  isCurrentTurn?: boolean
  isSelected?: boolean
  onClick?: () => void
  onInspect?: () => void
}

export type TurnOrderStatus =
  | 'current'
  | 'next'
  | 'upcoming'
  | 'acted'
  | 'delayed'
  | 'defeated'
```

### combat-log.types.ts

```ts
export type CombatLogPresentationMode = 'compact' | 'normal' | 'debug'

export type CombatLogEntryImportance = 'headline' | 'supporting' | 'debug'

export type CombatLogEntry = {
  id: string
  round: number
  turn: number
  category:
    | 'encounter'
    | 'turn'
    | 'action'
    | 'attack'
    | 'damage'
    | 'healing'
    | 'condition'
    | 'effect'
    | 'system'
  importance: CombatLogEntryImportance
  message: string
  details?: string[]
  debugDetails?: string[]
}
```

---

## Log Presentation

Three layers:

1. **Headline events** — what happened (always shown)
2. **Supporting detail** — how it resolved (shown in `normal` and `debug`)
3. **Debug detail** — raw breakdown / engine notes (shown in `debug` only)

Grouping: The UI heuristically groups consecutive entries sharing `round` + `turn` + actor.
Engine-level `actionGroupId` is a future improvement for robust grouping.

### CombatLogPanel (compact, always visible in active view)

```
Encounter started
Initiative order: Ringle Roostdaddy (23), Bugbear Warrior (1)

R1 T1
Ringle Roostdaddy starts their turn
Ringle Roostdaddy uses Crossbow, Light against Bugbear Warrior
Ringle Roostdaddy misses Bugbear Warrior with Crossbow, Light
Ringle Roostdaddy ends their turn
```

### CombatLogModal (full detail)

```
R1 T2 • Bugbear Warrior uses Grab against Ringle Roostdaddy
Hit for 9 bludgeoning damage. Target becomes grappled.

Details:
- Attack roll: d20 20 + 4 = 24 vs AC 14
- Damage: 2d6 + 2 = 9
- Source: Grab
```

---

## Footer Behavior

`EncounterActiveFooter` displays turn resource badges and contextual action state.


| State                      | Display                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| Nothing selected           | `No action selected` — [End Turn]                                           |
| Action selected, no target | `Selected: Fire Bolt • No target selected` — [Resolve] disabled, [End Turn] |
| Ready to resolve           | `Selected: Fire Bolt → Kobold 3` — [Resolve Action], [End Turn]             |
| Bonus action ready         | `Selected: Healing Word → Aria` — [Resolve Bonus Action], [End Turn]        |


Turn resource badges: `Action: available`, `Bonus: spent`, `Movement: 15/30`, `Reaction: available`

Footer only **displays** the selected target — does not perform selection. Selection happens via `CombatTargetSelectModal`.

---

## Active View Layout

From the wireframes:

- **Top**: Focused combatant's `AllyCombatantActiveCard` or `OpponentCombatantActiveCard` spanning both columns. Actions, Bonus Actions, and Combat Effects sections are collapsible.
- **Below**: Two-column grid with `AllyRosterLane` (left) and `OpponentRosterLane` (right), each rendering compact preview cards (`AllyCombatantActivePreviewCard` / `OpponentCombatantActivePreviewCard`).
- **Below lanes**: `CombatLogPanel` (always visible, compact view).
- **Sticky header**: `EncounterActiveHeader` at top.
- **Sticky footer**: `EncounterActiveFooter` at bottom.

---

## Sticky Positioning

`EncounterView` becomes a flex column filling available viewport height:

```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
  <EncounterActiveHeader sx={{ position: 'sticky', top: 0, zIndex: 10 }} />
  {/* scrollable content */}
  <EncounterActiveFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10 }} />
</Box>
```

Positioned within the encounter container — does not affect the global left rail.

---

## Environment Constants

Define in `environment.constants.ts` as `{ id, name, description }` arrays:

```ts
export const ENVIRONMENT_SETTINGS = [
  { id: 'indoors', name: 'Indoors', description: 'Enclosed interior space' },
  { id: 'outdoors', name: 'Outdoors', description: 'Open exterior space' },
  { id: 'mixed', name: 'Mixed', description: 'Combination of indoor and outdoor' },
  { id: 'other', name: 'Other', description: 'Non-standard environment' },
] as const

export const LIGHTING_LEVELS = [
  { id: 'bright', name: 'Bright Light', description: 'Full visibility' },
  { id: 'dim', name: 'Dim Light', description: 'Lightly obscured' },
  { id: 'darkness', name: 'Darkness', description: 'Heavily obscured without darkvision' },
] as const

// Similar for TERRAIN_MOVEMENT_TYPES, VISIBILITY_OBSCURED_LEVELS, ATMOSPHERE_TAGS
```

Export dynamic types back into `environment.types.ts`:

```ts
import { ENVIRONMENT_SETTINGS } from './environment.constants'
export type EncounterEnvironmentSetting = (typeof ENVIRONMENT_SETTINGS)[number]['id']
```

---

## Phased Implementation

### Phase 0: Terminology + Folder Rename

Rename `combatSimulation/` → `encounter/` and update all import paths. Rename Party→Ally/Allies, Enemies→Opponent/Opponents across:

- `types.ts` — rename all option/roster types
- `hooks/useCombatSimulationOptions.ts` → `useEncounterOptions.ts`
- `hooks/useCombatSimulationRoster.ts` → `useEncounterRoster.ts`
- `hooks/useCombatSimulationEncounter.ts` → `useEncounterState.ts`
- `hooks/index.ts` — update barrel
- `components/CombatSimulationLanes.tsx` — rename functions and props
- `components/CombatSimulationCards.tsx` — rename functions and props
- `components/CombatSimulationPanels.tsx` — rename functions and props
- `components/index.ts` — update barrel
- `routes/CombatSimulationRoute.tsx` → `EncounterRoute.tsx`
- `routes/CombatSimulationGuard.tsx` → `EncounterGuard.tsx`
- `routes/index.ts` — update barrel
- `index.ts` — update barrel
- App-level route config (wherever `CombatSimulationRoute` is referenced)
- `helpers/combat-simulation-helpers.ts` → `encounter-helpers.ts`
- `helpers/combat-simulation-helpers.test.ts` → `encounter-helpers.test.ts`

All internal variables and string literals ("Party" → "Allies", "Enemies" → "Opponents").

### Phase 1: Environment Constants + Types

1. Populate `environment.constants.ts` with `ENVIRONMENT_SETTINGS`, `LIGHTING_LEVELS`, `TERRAIN_MOVEMENT_TYPES`, `VISIBILITY_OBSCURED_LEVELS`, `ATMOSPHERE_TAGS`
2. Update `environment.types.ts` to import dynamic types from constants
3. Update `environment/index.ts` barrel

### Phase 2: Domain Types + Log Model

1. Create `domain/encounter-view.types.ts` — all preview/wrapper/turn-order types
2. Create `domain/combat-log.types.ts` — log entry, importance, presentation mode types
3. Create `domain/combat-log.ts` — `groupLogEntries()`, `filterLogByMode()`, formatting helpers
4. Update `domain/index.ts` barrel

### Phase 3: Base Presentational Components

1. `components/CombatantPreviewCard.tsx` — pure component from `CombatantPreviewCardProps`
2. `components/CombatLogEntry.tsx` — single grouped log entry renderer
3. `components/TurnOrderList.tsx` — initiative list with `TurnOrderStatus` badges
4. Update `components/index.ts`

### Phase 4: View Shell + Sticky Layout

1. `components/EncounterView.tsx` — mode switcher, scroll container, sticky context
2. `components/EncounterSetupHeader.tsx` — sticky setup header
3. `components/EncounterActiveHeader.tsx` — sticky active header (round/turn, combatant name, nav)
4. `components/EncounterActiveFooter.tsx` — sticky footer (resources, action state, buttons)
5. Implement sticky positioning within EncounterView container

### Phase 5: Setup View

1. `components/EncounterSetupView.tsx` — layout shell
2. `components/EncounterEnvironmentSetup.tsx` — environment selects from Phase 1 constants
3. `components/AllyCombatantSetupPreviewCard.tsx` — wraps CombatantPreviewCard
4. `components/OpponentCombatantSetupPreviewCard.tsx` — wraps CombatantPreviewCard
5. `components/AllyRosterLane.tsx` — refactored, uses setup preview cards
6. `components/OpponentRosterLane.tsx` — refactored, uses setup preview cards
7. Wire "Start Encounter" → transition to active mode

### Phase 6: Active View

1. `components/EncounterActiveView.tsx` — layout: focused card → lane grid → log panel
2. `components/EncounterEnvironmentSummary.tsx` — read-only environment display
3. `components/AllyCombatantActivePreviewCard.tsx` — compact lane card, wraps CombatantPreviewCard
4. `components/OpponentCombatantActivePreviewCard.tsx` — compact lane card, wraps CombatantPreviewCard
5. `components/AllyCombatantActiveCard.tsx` — full detail, collapsible sections (Actions, Bonus Actions, Combat Effects)
6. `components/OpponentCombatantActiveCard.tsx` — full detail, monster-specific fields
7. `components/CombatActionPreviewCard.tsx` — action display
8. `components/CombatTargetPreviewCard.tsx` — target display
9. `components/CombatLogPanel.tsx` — refactored, uses new log model, always visible
10. Footer state transitions (no action → selected → targeted → ready)

### Phase 7: Modals

All modals wrap `AppModal`. Click events follow wireframe documentation.

1. `components/modals/EncounterEditModal.tsx` — edit encounter (active view only)
2. `components/modals/CombatTargetSelectModal.tsx` — target selection with combatant list
3. `components/modals/CombatLogModal.tsx` — full log with headline/detail/debug layers
4. `components/modals/CombatTurnOrderModal.tsx` — full initiative table
5. `components/modals/SelectEncounterCombatantModal.tsx` — base selection modal
6. `components/modals/SelectEncounterAllyModal.tsx` — ally variant
7. `components/modals/SelectEncounterOpponentModal.tsx` — opponent variant (Monsters/NPCs tabs)
8. `components/modals/index.ts` barrel

### Phase 8: Route Rewire + Cleanup

1. `routes/EncounterRoute.tsx` — uses `EncounterView` as top-level
2. Move hook orchestration into view components where appropriate
3. Delete deprecated files: `CombatSimulationCards.tsx`, `CombatSimulationPanels.tsx`, `CombatSimulationLanes.tsx`
4. Update route barrel exports
5. Update app-level route config
6. Verify all imports resolve

### Phase 9: Polish + Badge Integration

1. Audit all badge/chip usage — `[xxxx]` wireframe notation → `AppBadge`
2. Wire `COMBAT_STATE_UI_MAP` tones to `AppBadge` tones for conditions/states/effects
3. Verify `PreviewTone` ↔ `AppBadgeTone` mapping
4. Test collapsible sections in active cards
5. Responsive testing (xs/sm/md/lg breakpoints)
6. Verify sticky positioning isolation from left rail

---

## File Structure (Final State)

```
src/features/encounter/
├── index.ts
├── types.ts
├── domain/
│   ├── index.ts
│   ├── combat-state-ui-map.ts
│   ├── presentable-effects.ts
│   ├── presentable-effects.types.ts
│   ├── presentable-effects.test.ts
│   ├── encounter-view.types.ts          (new)
│   ├── combat-log.types.ts              (new)
│   └── combat-log.ts                    (new)
├── components/
│   ├── index.ts
│   ├── CombatantPreviewCard.tsx          (new - base)
│   ├── CombatantActiveCard.tsx           (new - base, if shared)
│   ├── PresentableEffectsList.tsx
│   ├── EncounterView.tsx                 (new)
│   ├── EncounterSetupView.tsx            (new)
│   ├── EncounterActiveView.tsx           (new)
│   ├── EncounterSetupHeader.tsx          (new)
│   ├── EncounterActiveHeader.tsx         (new)
│   ├── EncounterActiveFooter.tsx         (new)
│   ├── EncounterEnvironmentSetup.tsx     (new)
│   ├── EncounterEnvironmentSummary.tsx   (new)
│   ├── AllyRosterLane.tsx                (refactored)
│   ├── OpponentRosterLane.tsx            (refactored)
│   ├── AllyCombatantSetupPreviewCard.tsx  (new)
│   ├── OpponentCombatantSetupPreviewCard.tsx (new)
│   ├── AllyCombatantActivePreviewCard.tsx    (new)
│   ├── OpponentCombatantActivePreviewCard.tsx (new)
│   ├── AllyCombatantActiveCard.tsx        (new)
│   ├── OpponentCombatantActiveCard.tsx    (new)
│   ├── CombatActionPreviewCard.tsx        (new)
│   ├── CombatTargetPreviewCard.tsx        (new)
│   ├── CombatLogPanel.tsx                 (refactored)
│   ├── CombatLogEntry.tsx                 (new)
│   ├── TurnOrderList.tsx                  (new)
│   └── modals/
│       ├── index.ts
│       ├── EncounterEditModal.tsx
│       ├── CombatTargetSelectModal.tsx
│       ├── CombatLogModal.tsx
│       ├── CombatTurnOrderModal.tsx
│       ├── SelectEncounterCombatantModal.tsx
│       ├── SelectEncounterAllyModal.tsx
│       └── SelectEncounterOpponentModal.tsx
├── helpers/
│   ├── index.ts
│   ├── encounter-helpers.ts              (renamed)
│   └── encounter-helpers.test.ts         (renamed)
├── hooks/
│   ├── index.ts
│   ├── useEncounterState.ts              (renamed)
│   ├── useEncounterOptions.ts            (renamed)
│   └── useEncounterRoster.ts             (renamed)
└── routes/
    ├── index.ts
    ├── EncounterRoute.tsx                (renamed)
    └── EncounterGuard.tsx                (renamed)
```

---

## DRY Rules

- Types defined once in `domain/` files — components import, never duplicate.
- `PreviewTone` → `AppBadgeTone` mapping lives in one utility (extend from `PresentableEffectsList` pattern).
- Badge tone derivation uses `COMBAT_STATE_UI_MAP` as the single source of truth.
- Ally/Opponent setup and active preview cards wrap the same `CombatantPreviewCard` base.
- `AllyCombatantActiveCard` and `OpponentCombatantActiveCard` wrap a shared `CombatantActiveCard` base if >70% of layout is shared.
- All modals wrap `AppModal` — no direct MUI Dialog usage.
- Environment select options derive from `environment.constants.ts` — no hardcoded option arrays in components.

