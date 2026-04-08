---
name: Pick Lock Combat Action
overview: "Add Phase 1 Pick Lock as a real `resolve-action` combat path. Gates (all required): thieves' tools proficiency, thieves' tools gear, adjacent locked door (not barred), and ability to spend the action. Check: d20 + Dex mod + PB vs DC 15 default or per-edge lockPickDc. Success unlocks and leaves door closed; failure unchanged. Implementation: tool-proficiency module, combatant snapshots, resolvePickLockAvailability (including action budget), resolver + UI wiring, tests + log/toast pipelines."
todos:
  - id: phase-a-tool-repo
    content: Add toolProficiencies.ts + collectGrantedToolProficienciesFromClassLevels; export from ruleset barrel
    status: pending
  - id: phase-a-combatant
    content: Extend CombatantEquipmentSnapshot + optional grantedToolProficiencies; populate in buildCharacterCombatantInstance / buildCharacterCombatantForGameSession
    status: pending
  - id: phase-b-availability
    content: Implement resolvePickLockAvailability (proficiency + gear + adjacent locked door + canSpendAction); optional EncounterEdge.lockPickDc + DEFAULT 15
    status: pending
  - id: phase-c-action-def-ui
    content: Add DEFAULT_PICK_LOCK_COMBAT_ACTION; wire selection + interactionMode + grid click/hover; extend selectValidActionIdsForTarget + deriveRecommended + readiness
    status: pending
  - id: phase-d-resolver
    content: Add pick-lock branch in resolveCombatAction; d20+Dex+PB vs DC; unlock-on-success; structured log
    status: pending
  - id: phase-e-toast
    content: Ensure action-resolved copy triggers existing toast pipeline; tweak isMechanicsLine if needed
    status: pending
  - id: phase-f-tests
    content: Add mechanics + selector + resolver tests per matrix above
    status: pending
isProject: false
---

# Phase 1: Pick Lock as a combat action

## Phase 1 pick-lock rule (authoritative)

A combatant may attempt Pick Lock **only if all** of the following are true:

1. **Thieves’ tools proficiency** — granted tool proficiency includes `thieves-tools` (from class proficiency resolution and any future grants on the combatant snapshot).
2. **Thieves’ tools gear** — `gearIds` includes `thieves-tools` (per [`gear.ts`](packages/mechanics/src/rulesets/system/gear.ts) id).
3. **At least one adjacent valid door target** — see [Targeting rule](#targeting-rule-phase-1); barred doors do **not** count.
4. **Can spend the required action** — same cost as the action definition (`action: true`); `resolvePickLockAvailability` should incorporate the existing **`canSpendActionCost` / `canUseCombatAction`** helpers used by [`getCombatantAvailableActions`](packages/mechanics/src/combat/resolution/action/action-resolver.ts) so enable/disable stays consistent with the rest of the drawer (single source of truth for “greyed out when no action budget”).

**Valid target door (Phase 1 only):** `lockState === 'locked'` **only**. **`barred` is not a valid pick-lock target** (do not treat like open-door’s locked/barred lump).

**Check (player-facing rule):** `d20 + Dexterity modifier + proficiency bonus`. Compare to DC from [Chosen DC rule](#chosen-dc-rule-phase-1).

**Scoping — availability vs resolution:** **`resolvePickLockAvailability`** is the **proficiency / tool / target** gate (plus **action budget** in the same helper so the drawer stays consistent). It does **not** compute the d20. When Pick Lock **reaches action resolution**, the actor is **assumed eligible** (proficiency, gear, and door legality were already enforced by UI + intent validation). So the Phase 1 **resolver** uses the check formula **verbatim** — **`d20 + Dexterity modifier + proficiency bonus`** — with **no** conditional “add PB only if proficient” branch; proficiency was already required to get here.

**Outcomes:**

- **Success:** door **`lockState: 'unlocked'`**, **`openState: 'closed'`** (unchanged if already closed).
- **Failure:** door state **unchanged**.

## Recommendation summary

- **Model Pick Lock as `resolutionMode: 'pick-lock'`** on [`CombatActionDefinition`](packages/mechanics/src/combat/resolution/combat-action.types.ts), with **`targeting: { kind: 'self' }`** so it does **not** use the creature target picker (same pattern as Hide’s self-targeting, but different resolution).
- **Extend [`ResolveCombatActionSelection`](packages/mechanics/src/combat/resolution/action-resolution.types.ts)** with optional **`doorCellIdA` / `doorCellIdB`** (must match a locked door edge adjacent to the actor). [`ResolveActionIntent`](packages/mechanics/src/combat/intents/combat-intent.types.ts) picks these up automatically via intersection.
- **Source of truth for drawer enable/disable**: implement **`resolvePickLockAvailability`** in mechanics (new module, e.g. `packages/mechanics/src/combat/availability/resolve-pick-lock-availability.ts`) taking **`EncounterState` + `combatantId`** and returning structured **`PickLockAvailability`** (available flag, **`legalTargets: { doorId: string; cellIdA: string; cellIdB: string }[]`**, and a small **`reason`** union for disabled states). Use **`mapEdgeId`** from [`EncounterEdge`](packages/mechanics/src/combat/space/space.types.ts) when present; otherwise a stable derived id from sorted cell pair.
- **Grant tool proficiency**: add **`collectGrantedToolProficienciesFromClassLevels`** (name can vary) in the new **[`packages/mechanics/src/rulesets/system/toolProficiencies.ts`](packages/mechanics/src/rulesets/system/toolProficiencies.ts)** file, mirroring the spirit of [`enchantments.ts`](packages/mechanics/src/rulesets/system/enchantments.ts): thin registry + helpers. Implementation walks the character’s **class entries** with **`getSystemClass(systemId, classId)`** from [`classes.ts`](packages/mechanics/src/rulesets/system/classes.ts), and for each class where **`level >= proficiencies.tools.level`**, merges **`proficiencies.tools.items`** when **`type === 'fixed'`** (same shape as Rogue’s `tools: { type: 'fixed', level: 1, items: ['thieves-tools'] }`).
- **Possession of thieves’ tools**: extend **[`CombatantEquipmentSnapshot`](packages/mechanics/src/combat/state/types/combatant.types.ts)** with optional **`gearIds?: string[]`**. Populate from **`CharacterDetailDto.equipment.gear`** in [`buildCharacterCombatantInstance`](src/features/encounter/helpers/combatants/combatant-builders.ts) (map to ids). Availability requires **`gearIds.includes('thieves-tools')`** (matches [`gear.ts`](packages/mechanics/src/rulesets/system/gear.ts) id).

## Chosen DC rule (Phase 1)

- **If no per-door override exists, default lock-pick DC is 15** for valid locked doors.
- **Optional per-edge override**: add **`lockPickDc?: number`** on **`EncounterEdge`** (next to `doorState`) in [`space.types.ts`](packages/mechanics/src/combat/space/space.types.ts). Resolver uses **`resolveDoorLockPickDc(edge) => edge.lockPickDc ?? DEFAULT_LOCK_PICK_DC`** where **`DEFAULT_LOCK_PICK_DC = 15`**.
- Hydration from map authoring can populate `lockPickDc` later; until then the default applies everywhere.

## Targeting rule (Phase 1)

- **Eligible door**: `edge.kind === 'door'`, **`doorState.openState === 'closed'`** (or missing → closed via existing sanitization), **`doorState.lockState === 'locked'`** exclusively. **`barred` is not a valid target** in Phase 1 (pick lock does not apply to barred doors).
- **Interaction range**: same adjacency semantics as [`applyOpenDoorIntent`](packages/mechanics/src/combat/application/apply-open-door-intent.ts) and [`resolveAdjacentClosedDoorPrompt`](src/features/encounter/combat/resolveEncounterAdjacentDoorPrompt.ts): actor must occupy **`cellIdA` or `cellIdB`** of the edge (king-adjacent neighbor loop is already the right geometric model).
- **Target selection for resolve**: when **multiple** legal doors exist, require an explicit **`doorCellIdA`/`doorCellIdB`** pair that matches one legal target. When **exactly one** legal door exists, **auto-fill** that pair on action select to avoid an extra click (still stored in selection for a target-aware contract).
- **No context-prompt flow**: selection is handled via **`interactionMode`** + cell click (see below), not [`useEncounterContextPrompt`](src/features/encounter/hooks/useEncounterContextPrompt.tsx).

## How `resolvePickLockAvailability` is shaped and used

**Role:** This helper is the **proficiency + thieves’ tools + adjacent locked-door target + can-spend-action** gate. It is **not** responsible for rolling the check — see [Scoping — availability vs resolution](#phase-1-pick-lock-rule-authoritative) above.

```ts
// Illustrative — exact names may vary slightly
type PickLockAvailability =
  | {
      available: true
      legalTargets: Array<{ doorId: string; cellIdA: string; cellIdB: string }>
    }
  | {
      available: false
      legalTargets: []
      reason:
        | 'missing-tool-proficiency'
        | 'missing-thieves-tools'
        | 'no-locked-door-in-range'
        | 'cannot-spend-action'
        | 'action-unavailable'
    }
```

- **Mechanics layer**: [`resolvePickLockAvailability`](packages/mechanics/src/combat/availability/resolve-pick-lock-availability.ts) reads **`combatant.grantedToolProficiencies`**, **`combatant.equipment?.gearIds`**, checks **action budget** via the same primitives as [`getCombatantAvailableActions`](packages/mechanics/src/combat/resolution/action/action-resolver.ts) for the pick-lock **`CombatActionDefinition`**, and scans the active [`EncounterSpace`](packages/mechanics/src/combat/space/space.types.ts) edges for the actor’s cell (reuse neighbor enumeration pattern from [`resolveEncounterAdjacentDoorPrompt.ts`](src/features/encounter/combat/resolveEncounterAdjacentDoorPrompt.ts)).
- **Encounter UI layer**: [`selectValidActionIdsForTarget`](packages/mechanics/src/combat/selectors/interaction/encounter-resolve-selection.ts) — today non-creature actions are always “valid” for target — **special-case** `resolutionMode === 'pick-lock'` like Hide: remove from `validIds` and set **`invalidActionReasons`** when availability is false (mirror `getHideActionUnavailableReason` pattern at lines 60–67).
- **Suggested actions**: extend [`deriveRecommendedActionsForTarget`](packages/mechanics/src/combat/presentation/actions/derive-recommended-actions-for-target.ts) to also include **`pick-lock`** actions when **`validActionIdsForTarget.has(id)`** and **`availableActionIds.has(id)`**, even though **`actionRequiresCreatureTargetForResolve`** is false (small second candidate list merged + sorted by existing category priority).

## Drawer disabled / suggested integration

- **Disabled**: `GroupedActionList` already computes availability as **`resourceAvailable && validForTarget && !invalidActionReasons`** ([`CombatantActionDrawer.tsx`](src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx) ~267–271). Feeding **`invalidActionReasons`** / **`validIds`** from `resolvePickLockAvailability` achieves the required behavior without one-off drawer logic.
- **Hints**: update [`deriveActionUnavailableHint`](packages/mechanics/src/combat/presentation/actions/derive-action-unavailable-hint.ts) to map pick-lock reasons to short strings.
- **Resolve readiness**: extend [`getActionResolutionRequirements`](packages/mechanics/src/combat/resolution/action/action-resolution-requirements.ts) / [`getActionResolutionReadiness`](packages/mechanics/src/combat/resolution/action/action-resolution-requirements.ts) with a **`door-edge`** (or reuse **`single-cell-placement`-style** naming) requirement when **`resolutionMode === 'pick-lock'`**: satisfied when **`doorCellIdA`/`doorCellB`** are set and match a still-legal locked door.
- **New interaction mode**: add **`pick-lock-select`** (name flexible) alongside existing modes in [`useEncounterActivePlaySurface.tsx`](src/features/encounter/hooks/useEncounterActivePlaySurface.tsx). When **`pick-lock`** is selected and multiple legal targets exist, user clicks a **neighbor cell** that forms a locked-door edge with the actor cell; validate via `findEncounterEdgeBetween` + lock state. **Single target** auto-fills in [`handleSelectAction`](src/features/encounter/hooks/useEncounterActivePlaySurface.tsx) / [`useEncounterState`](src/features/encounter/hooks/useEncounterState.ts).
- **State**: add **`selectedDoorEdge: { cellIdA: string; cellIdB: string } | null`** to `useEncounterState`, thread into [`buildResolveActionIntentFromActiveSelection`](src/features/encounter/domain/interaction/build-resolve-action-intent.ts), clear on resolve like other selection fields.
- **Grid UX**: extend [`deriveGridHoverStatusMessage`](src/features/encounter/helpers/ui/deriveGridHoverStatus.ts) for pick-lock mode + wire `handleCellClick` branch before creature targeting (same pattern as AoE placement block ~793–822).

## Action resolution (mechanics)

- In [`resolveCombatAction`](packages/mechanics/src/combat/resolution/action/action-resolver.ts), add a branch **`resolutionMode === 'pick-lock'`** **before** the generic `log-only` fallback (~708+):
  - Validate `doorCellIdA/B`, active actor, adjacency, edge kind, **`lockState === 'locked'`** (reject barred / unlocked / open).
  - **Check formula (Phase 1):** **`d20 + Dexterity modifier + proficiency bonus`** — always add PB here; do **not** branch on proficiency in the resolver (eligibility is already enforced by **`resolvePickLockAvailability`** and by the same validation that keeps the action disabled otherwise). Use existing [`rollD20WithRollMode`](packages/mechanics/src/resolution/engines/dice.engine.ts) for the d20; Dex mod + PB from the actor’s stat block (same style as hide’s structured roll logging).
  - Compare total to **`resolveDoorLockPickDc(edge)`** (default **15** if no `edge.lockPickDc`).
  - **Success**: update space with **`lockState: 'unlocked'`**, **`openState: 'closed'`** (new helper mirroring `withDoorOpenedOnSpace` in [`apply-open-door-intent.ts`](packages/mechanics/src/combat/application/apply-open-door-intent.ts) but only toggling lock).
  - **Failure**: **no** door state change.
  - **Log**: append **`action-resolved`** entries with **`summary` + `details`** (roll math, DC, door id) — same pattern as [`resolutionMode === 'hide'`](packages/mechanics/src/combat/resolution/action/action-resolver.ts) (~393–437).

## Result surfaces (toast + debug)

- **Toast**: [`deriveEncounterToastsFromNewLogSlice`](src/features/encounter/toast/derive-encounter-toast-for-viewer.ts) already consumes **`action-resolved`** events without attacks ([`encounter-action-toast.ts`](src/features/encounter/helpers/actions/encounter-action-toast.ts) ~188–195). Ensure pick-lock **`details`** include **`vs DC`** or **`d20`** so [`isMechanicsLine`](src/features/encounter/helpers/actions/encounter-action-toast.ts) classifies mechanics cleanly; optionally add **`dexterity`** / **`ability check`** to `isMechanicsLine` if needed.
- **No new toast pipeline** — rely on existing log-derived toasts.

## Action definition + wiring

- Add **`DEFAULT_PICK_LOCK_COMBAT_ACTION`** (id e.g. **`pick-lock`**, label **`Pick Lock`**, **`kind: 'combat-effect'`**, **`cost: { action: true }`**, **`resolutionMode: 'pick-lock'`**, **`targeting: { kind: 'self' }`**) next to [`DEFAULT_HIDE_COMBAT_ACTION`](packages/mechanics/src/combat/resolution/combat-action.types.ts).
- Append to **`extraActions`** in [`buildCharacterCombatantForGameSession`](src/features/game-session/combat/buildCharacterCombatantForGameSession.ts) for **PC/NPC from character** (not monsters). Populate **`grantedToolProficiencies`** + **`gearIds`** from character in the same builder path.

## Presentation

- [`deriveActionPresentation`](packages/mechanics/src/combat/presentation/actions/action-presentation.ts): treat **`pick-lock`** as **utility** category (extend `deriveCategory` similarly to hide/log-only utility).

## Tests (Phase F)

- **Mechanics**: `resolvePickLockAvailability` matrix (proficiency, gear, no locked door in range, **cannot spend action**, locked door + all gates pass).
- **Resolver**: success unlocks without opening; failure unchanged; DC respects `edge.lockPickDc` vs default.
- **Integration**: `selectValidActionIdsForTarget` + `deriveRecommendedActionsForTarget` for pick-lock.
- **Optional**: `buildResolveActionIntent` includes door fields.

## Follow-ups (out of scope)

- Key unlock, force door, open+bundle, context-prompt UX, full interaction framework, **barred** vs **locked** rules refinement, authoring **`lockPickDc`** from map UI, and syncing runtime door state back to authored location maps.

## Key files to touch

| Area | Files |
|------|--------|
| Ruleset registry | [`packages/mechanics/src/rulesets/system/toolProficiencies.ts`](packages/mechanics/src/rulesets/system/toolProficiencies.ts) (new), [`packages/mechanics/src/rulesets/system/index` or catalog exports](packages/mechanics/src/rulesets/system/catalog.ts) |
| Availability | `packages/mechanics/src/combat/availability/resolve-pick-lock-availability.ts` (new) |
| Combatant + action types | [`combatant.types.ts`](packages/mechanics/src/combat/state/types/combatant.types.ts), [`combat-action.types.ts`](packages/mechanics/src/combat/resolution/combat-action.types.ts), [`action-resolution.types.ts`](packages/mechanics/src/combat/resolution/action-resolution.types.ts), [`space.types.ts`](packages/mechanics/src/combat/space/space.types.ts) |
| Resolver + selection | [`action-resolver.ts`](packages/mechanics/src/combat/resolution/action/action-resolver.ts), [`action-resolution-requirements.ts`](packages/mechanics/src/combat/resolution/action/action-resolution-requirements.ts), [`encounter-resolve-selection.ts`](packages/mechanics/src/combat/selectors/interaction/encounter-resolve-selection.ts), [`derive-recommended-actions-for-target.ts`](packages/mechanics/src/combat/presentation/actions/derive-recommended-actions-for-target.ts) |
| Character → combatant | [`combatant-builders.ts`](src/features/encounter/helpers/combatants/combatant-builders.ts), [`buildCharacterCombatantForGameSession.ts`](src/features/game-session/combat/buildCharacterCombatantForGameSession.ts) |
| Encounter UI | [`useEncounterState.ts`](src/features/encounter/hooks/useEncounterState.ts), [`useEncounterActivePlaySurface.tsx`](src/features/encounter/hooks/useEncounterActivePlaySurface.tsx), [`build-resolve-action-intent.ts`](src/features/encounter/domain/interaction/build-resolve-action-intent.ts), [`deriveGridHoverStatus.ts`](src/features/encounter/helpers/ui/deriveGridHoverStatus.ts) |
| Toast polish | [`encounter-action-toast.ts`](src/features/encounter/helpers/actions/encounter-action-toast.ts) (optional) |
