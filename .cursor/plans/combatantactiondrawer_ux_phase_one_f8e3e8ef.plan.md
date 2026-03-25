---
name: CombatantActionDrawer UX Phase One
overview: "Phase-one UX cleanup of CombatantActionDrawer: relocate target preview to top, improve workflow state clarity, upgrade main CTA, comment out End Turn, and add visible disabled-action explanations -- all scoped to the drawer and its direct wrapper components."
todos:
  - id: target-preview-top
    content: Add showChips prop to AllyCombatantActivePreviewCard / OpponentCombatantActivePreviewCard; thread targetCombatant + allCombatants through route -> wrapper drawers -> CombatantActionDrawer as targetPreview ReactNode; render at top of drawer body
    status: completed
  - id: drawer-workflow-states
    content: Add DrawerTargetSection with no-target / target-selected states; add workflow status line for action-selection state; handle exhausted state
    status: completed
  - id: cta-improvements
    content: Make Resolve Action button full-width primary CTA; implement state-aware button copy helper; restructure footer after End Turn removal
    status: completed
  - id: comment-out-end-turn
    content: Comment out End Turn button in CombatantActionDrawer footer with explanatory comment; keep prop threading intact
    status: completed
  - id: disabled-explanations
    content: Create deriveActionUnavailableHint helper; build ActionItemWithHint wrapper in CombatantActionDrawer; render muted caption line for unavailable actions
    status: completed
  - id: route-prop-threading
    content: Update EncounterActiveRoute drawerProps to include targetCombatant and combatantRoster
    status: completed
isProject: false
---

# CombatantActionDrawer UX Phase One

## Current State

The drawer today is a flat stack: collapsible action/bonus/effects sections, with a sticky footer containing a one-line target label (`Target: None selected`), a `Resolve Action` button, and an `End Turn` button side-by-side. Disabled actions are visually dimmed (opacity only) with no explanation text. There is no per-action "reason" infrastructure -- just two boolean sets (`availableActionIds` for resources, `validActionIdsForTarget` for targeting).

## Approach

### 1. Move target context to top of drawer

**Data flow change:**

- [EncounterActiveRoute.tsx](src/features/encounter/routes/EncounterActiveRoute.tsx) already computes `targetCombatant` (a `CombatantInstance | null`). Add `targetCombatant` and `allCombatants` (the full `combatantRoster`) to `drawerProps`.
- Thread through [AllyActionDrawer.tsx](src/features/encounter/components/active/drawers/AllyActionDrawer.tsx) and [OpponentActionDrawer.tsx](src/features/encounter/components/active/drawers/OpponentActionDrawer.tsx) as new optional props.
- Each wrapper drawer builds a `targetPreview: ReactNode | null` using the existing [AllyCombatantActivePreviewCard](src/features/encounter/components/active/cards/AllyCombatantActivePreviewCard.tsx) / [OpponentCombatantActivePreviewCard](src/features/encounter/components/active/cards/OpponentCombatantActivePreviewCard.tsx), choosing by `targetCombatant.side`. Pass with chips omitted and no onClick (read-only context).
- Add `targetPreview?: ReactNode` to `CombatantActionDrawerProps`. Render it at the top of the drawer body (above the collapsible sections, below any AoE panel).

**Chips omission strategy:** Add an optional `showChips?: boolean` prop (default `true`) to `AllyCombatantActivePreviewCard` and `OpponentCombatantActivePreviewCard`. When false, pass `chips={undefined}` to `CombatantPreviewCard`. This is a single-line prop addition, keeps the shared card untouched.

**Remove the old target label** from the sticky footer.

### 2. Improve drawer workflow state clarity

Add a `DrawerTargetSection` local component at the top of the drawer body that shows one of:

- **No target selected:** Muted guidance text ("Select a target on the map or sidebar") with no preview card.
- **Target selected:** The `targetPreview` card (from step 1).

Below the target section, add a subtle workflow status line:

- **No action selected (target present):** "Choose an action below"
- **Action selected + can resolve:** Show selected action name as confirmation
- **Actions exhausted (both buckets spent):** "All actions spent this turn"

These are lightweight `Typography` elements, not new components.

### 3. Improve main action CTA

Current footer renders two buttons side-by-side in a row Stack. Changes:

- Comment out `End Turn` (see step 4), leaving `Resolve Action` alone.
- Change Stack direction from `row` to `column` (or remove the inner Stack since only one button remains).
- Ensure button is `variant="contained"`, `color="primary"`, `fullWidth`.
- Make button copy **state-aware** using a local helper:


| State                               | Button label            | Enabled?    |
| ----------------------------------- | ----------------------- | ----------- |
| No target selected                  | "Select a Target"       | disabled    |
| Target selected, no action          | "Choose an Action"      | disabled    |
| AoE flow active, awaiting placement | "Place Area"            | disabled    |
| Action + target ready               | "Resolve [Action Name]" | **enabled** |


Derive this from existing props: `selectedActionId`, `targetLabel` (or new `targetPreview`), `canResolveAction`, `selectedActionDefinition` (already computed in the drawer), and `inAoeFlow`.

### 4. Comment out End Turn button

In [CombatantActionDrawer.tsx](src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx), comment out the End Turn `Button` element (lines ~541-543) with a block comment explaining the intent:

```tsx
{/* Phase-one: End Turn temporarily removed from drawer to reduce footer competition.
    Reintroduce when header/End Turn flow is redesigned. */}
```

Keep the `onEndTurn` prop in the type and threading -- no changes to AllyActionDrawer, OpponentActionDrawer, or the route.

### 5. Visible disabled-action explanations

**Reason derivation -- new drawer-local helper:**

Create `deriveActionUnavailableHint(action, availableActionIds, validActionIdsForTarget): string | null` in a small helper file at `src/features/encounter/components/active/drawers/helpers/derive-action-unavailable-hint.ts`.

Logic (heuristic, using data on `CombatActionDefinition`):

- If action is **resource-unavailable** (not in `availableActionIds`):
  - `action.usage?.uses?.remaining <= 0` --> "No uses remaining"
  - `action.usage?.recharge?.ready === false` --> "Recharge not ready"
  - Fallback based on `action.cost` --> "Action spent this turn" / "Bonus action spent this turn"
- If action is **target-invalid** (in `availableActionIds` but not in `validActionIdsForTarget`):
  - `validActionIdsForTarget === undefined` --> "No target selected"
  - `action.targeting?.kind === 'self'` --> "Self-only ability"
  - `action.targeting?.requiresWilling` --> "Requires willing ally"
  - `isHostileAction(action)` and target is same side hint --> "Requires enemy target"
  - `action.targeting?.rangeFt != null` --> "Target out of range"
  - `action.areaTemplate != null` --> "Requires area placement"
  - Fallback --> "Not valid for this target"
- If action **is** available --> `null`

**Rendering -- drawer-local wrapper:**

Replace the `ActionItem` component in CombatantActionDrawer with `ActionItemWithHint`. This wrapper:

- Renders `ActionRow` as before
- When the action is unavailable, appends a `Typography variant="caption"` line below in `color="text.secondary"` (muted) with the hint string.
- This is purely a CombatantActionDrawer-local component. `ActionRow`, `ActionRowBase`, and `HorizontalCompactActionCard` are untouched.

### 6. Files changed (summary)

**Modified files:**

- `[CombatantActionDrawer.tsx](src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx)` -- target section at top, workflow states, CTA improvements, End Turn comment-out, `ActionItemWithHint`
- `[AllyActionDrawer.tsx](src/features/encounter/components/active/drawers/AllyActionDrawer.tsx)` -- accept `targetCombatant`, `allCombatants`; build `targetPreview`; pass to drawer
- `[OpponentActionDrawer.tsx](src/features/encounter/components/active/drawers/OpponentActionDrawer.tsx)` -- same
- `[EncounterActiveRoute.tsx](src/features/encounter/routes/EncounterActiveRoute.tsx)` -- add `targetCombatant` and `combatantRoster` to `drawerProps`
- `[AllyCombatantActivePreviewCard.tsx](src/features/encounter/components/active/cards/AllyCombatantActivePreviewCard.tsx)` -- add optional `showChips` prop
- `[OpponentCombatantActivePreviewCard.tsx](src/features/encounter/components/active/cards/OpponentCombatantActivePreviewCard.tsx)` -- same

**New file:**

- `src/features/encounter/components/active/drawers/helpers/derive-action-unavailable-hint.ts` -- small pure function for heuristic disabled reasons

**Not changed (per constraints):**

- `ActionRow`, `ActionRowBase`, `HorizontalCompactActionCard`, `CombatantPreviewCard`, `EntitySummaryCard`, `AppDrawer`
- Encounter header / End Turn flow (prop kept, button commented out)
- Global card patterns, encounter layout

