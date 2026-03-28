# Encounter environment (layered model)

Domain contract for **baseline** encounter defaults, **localized environment zones**, **resolved world state per grid cell**, and **viewer perception** (derived). UI rendering is still a separate layer.

## Layers

1. **Baseline — `EncounterEnvironmentBaseline`**  
   Global default for the encounter: edited in setup before combat, then stored on `EncounterState.environmentBaseline` as **live runtime state** (weather, time of day, DM adjustments). Update at runtime with `updateEncounterEnvironmentBaseline` / `applyEnvironmentBaselinePatch` (partial merge; see type docs for `atmosphereTags`). Fields:
   - `setting` — indoors / outdoors / mixed / other  
   - `lightingLevel` — bright / dim / darkness (illumination)  
   - `terrainMovement` — default movement cost class for the encounter  
   - `visibilityObscured` — none / light / heavy (obscurement from fog, foliage, etc.)  
   - `atmosphereTags` — **additive** tags from `ATMOSPHERE_TAGS` (wind, underwater, anti-magic, …)

   **Lighting and visibility stay separate.** Valid combinations include bright light + heavy obscurement, darkness + clear visibility, dim + light obscurement.

2. **Localized zones — `EncounterEnvironmentZone[]`**  
   Patches, emanations, hazards (see `kind`). Each zone has `id`, optional `priority`, `sourceKind` / `sourceId`, `area` (`EncounterEnvironmentAreaLink`), partial `overrides` (including optional `setting`), and optional `magical` flags (`magical`, `magicalDarkness`, `blocksDarkvision`).

3. **Encounter state**  
   `EncounterState.environmentBaseline` and `EncounterState.environmentZones` (optional on older snapshots; `createEncounterState` sets defaults). Baseline is initialized from setup when the encounter starts and **may change during play**; it is not an immutable snapshot.

4. **Resolved world cell — `EncounterWorldCellEnvironment`**  
   Pure **world/environment** state at a cell — not viewer perception, not render state. Produced by `resolveWorldEnvironmentForCell` / `buildResolvedWorldEnvironmentCellMap` / `resolveWorldEnvironmentFromEncounterState`.

5. **Viewer perception — `EncounterViewerPerceptionCell` / `EncounterViewerBattlefieldPerception`**  
   Derived from world state at viewer + target cells, viewer role, and optional `EncounterViewerPerceptionCapabilities`. Magical darkness is **viewer-dependent** (bypass senses, DM view). Not React/UI types — see `perception.types.ts` / `perception.resolve.ts`.

## Area linkage (`EncounterEnvironmentAreaLink`)

- **`grid-cell-ids`** — explicit membership.  
- **`sphere-ft`** — preferred; matches battlefield AoE: Chebyshev distance in feet vs `originCellId` (`gridDistanceFt` ≤ `radiusFt`).  
- **`grid-cell-radius`** — deprecated; converted to feet via `radiusCells × cellFeet` when `space` is provided.  
- **`unattached`** — covers no cells.

Use `cellIdInEnvironmentArea(space, area, cellId)` for membership (requires `EncounterSpace` for sphere-like shapes).

## Merge and precedence

1. **Applicable zones** — zones whose area contains `cellId`.  
2. **Sort** — `sortZonesForMerge`: ascending `priority` (default `0`), then ascending `id` (stable tie-break).  
3. **Scalars** (`setting`, `lightingLevel`, `terrainMovement`, `visibilityObscured`) — start from baseline; each sorted applicable zone may override; **last in sorted order wins** (higher numeric `priority` wins when both set a field).  
4. **`atmosphereTags`** — start from baseline; for each zone in sorted order: **replace** (if set) → **remove** → **add**.  
5. **Magical flags** — `magicalDarkness`, `blocksDarkvision`, `magical`: **OR** across applicable zones (any zone sets true → true).

## Runtime baseline mutation

| Function | Purpose |
|----------|---------|
| `applyEnvironmentBaselinePatch(baseline, patch)` | Pure merge (`EncounterEnvironmentBaselinePatch` = partial fields) |
| `updateEncounterEnvironmentBaseline(state, patch)` | Returns new `EncounterState` with updated `environmentBaseline` |

No event log, history, or undo — callers append combat log notes if needed.

## API (see `environment.resolve.ts`)

| Function | Purpose |
|----------|---------|
| `resolveWorldEnvironmentForCell(baseline, zones, space, cellId)` | Resolve one cell |
| `buildResolvedWorldEnvironmentCellMap(baseline, zones, space)` | Map every `space.cells` id → resolved |
| `resolveWorldEnvironmentFromEncounterState(state, cellId)` | Uses `state.environmentBaseline` / `environmentZones` with defaults |
| `resolveCellEnvironment(baseline, zones, cellId, space?)` | Legacy; without `space`, only `grid-cell-ids` areas match |

## Defaults

`DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE` matches the runtime default (outdoors, bright, normal terrain, no obscurement, no atmosphere tags).

## Viewer perception API (see `perception.resolve.ts`)

| Function | Purpose |
|----------|---------|
| `resolveViewerPerceptionForCell(...)` | Per target cell, given viewer/target world state |
| `resolveViewerBattlefieldPerception(...)` | Veil + boundary flags from viewer’s cell |
| `resolveViewerPerceptionForCellFromState` / `resolveViewerBattlefieldPerceptionFromState` | Convenience when using `EncounterState` + placements |
| `effectiveMagicalDarknessBypass(capabilities)` | Devil’s Sight / truesight / explicit bypass (not darkvision alone) |

Baseline rules: no special senses unless `EncounterViewerPerceptionCapabilities` sets flags; DM role skips restrictions.

## Non-goals

- No token hiding or grid rendering in these modules — consume perception types in UI later.  
- Grid UI (`EncounterGrid`) must not define perception rules ad hoc; use resolvers.  
- Spell/action resolution does not yet create `environmentZones` rows (see TODO in `attached-aura-mutations.ts`).  
- **Deferred:** wiring setup/edit UI (`environmentSetup` in React) to call `updateEncounterEnvironmentBaseline` when the encounter is already active — not implemented here.

## Related types

- **`EncounterEnvironmentExtended`** — optional narrative/campaign schema; not the tactical baseline.

## Next phases (rendering / integration)

- **Grid / veil / token visibility** — map `EncounterViewerPerceptionCell` + `EncounterViewerBattlefieldPerception` to presentation; do not use `CellBaseFillKind` as the perception source of truth.  
- **Spell integration** — spawn `EncounterEnvironmentZone` with `sphere-ft` from cast placement / `resolveBattlefieldEffectOriginCellId` patterns where appropriate.  
- **Senses** — wire `EncounterViewerPerceptionCapabilities` from combatant stats (darkvision range, blindsight, etc.).
