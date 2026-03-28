# Encounter environment (layered model)

Domain contract for **baseline** encounter defaults, **localized environment zones**, **resolved world state per grid cell**, and **viewer perception** (derived). UI rendering is still a separate layer.

## Layers

1. **Baseline — `EncounterEnvironmentBaseline`**  
   Global default for the encounter: edited in setup before combat, then stored on `EncounterState.environmentBaseline` as **live runtime state** (weather, time of day, DM adjustments). Update at runtime with `updateEncounterEnvironmentBaseline` / `applyEnvironmentBaselinePatch` (partial merge; see type docs for `atmosphereTags`). Fields:
   - `setting` — indoors / outdoors / mixed / other  
   - `lightingLevel` — bright / dim / darkness (illumination)  
   - `terrainMovement` — default movement cost class for the encounter  
   - `visibilityObscured` — none / light / heavy (obscurement from fog, foliage, etc.)  
   - `terrainCover` (optional) — none / half / three-quarters / full — **cell-local** cover grade for rules such as hide eligibility (not ray-traced cover from a specific observer; see [Stealth](./stealth.md)). Omitted baseline values resolve to **none** in `resolveWorldEnvironmentForCell`.
   - `atmosphereTags` — **additive** tags from `ATMOSPHERE_TAGS` (wind, underwater, anti-magic, …)

   **Lighting and visibility stay separate.** Valid combinations include bright light + heavy obscurement, darkness + clear visibility, dim + light obscurement.

2. **Localized zones — `EncounterEnvironmentZone[]`**  
   Patches, emanations, hazards (see `kind`). Each zone has `id`, optional `priority`, `sourceKind` / `sourceId`, `area` (`EncounterEnvironmentAreaLink`), partial `overrides` (including optional `setting`), and optional `magical` flags (`magical`, `magicalDarkness`, `blocksDarkvision`).  
   **`sourceKind: 'attached-aura'`** — rows **reconciled** from `BattlefieldEffectInstance` when `environmentZoneProfile` is set (see Phase 4 below). Other kinds include `manual`, `spell`, `terrain-feature`, `battlefield-effect`.

3. **Encounter state**  
   `EncounterState.environmentBaseline` and `EncounterState.environmentZones` (optional on older snapshots; `createEncounterState` sets defaults). Baseline is initialized from setup when the encounter starts and **may change during play**; it is not an immutable snapshot.

4. **Resolved world cell — `EncounterWorldCellEnvironment`**  
   Pure **world/environment** state at a cell — not viewer perception, not render state. Produced by `resolveWorldEnvironmentForCell` / `buildResolvedWorldEnvironmentCellMap` / `resolveWorldEnvironmentFromEncounterState`.

5. **Viewer perception — `EncounterViewerPerceptionCell` / `EncounterViewerBattlefieldPerception`**  
   Derived from world state at viewer + target cells, viewer role, and optional `EncounterViewerPerceptionCapabilities`. Magical darkness is **viewer-dependent** (bypass senses, DM view). Not React/UI types — see `perception.types.ts` / `perception.resolve.ts`.

## Area linkage (`EncounterEnvironmentAreaLink`)

- **`grid-cell-ids`** — explicit membership.  
- **`sphere-ft`** — preferred; matches battlefield AoE: Chebyshev distance in feet vs `originCellId` (`gridDistanceFt` ≤ `radiusFt`).  
- **`unattached`** — covers no cells.

The old **`grid-cell-radius`** variant has been removed; use **`sphere-ft`** with an explicit radius in feet.

Use `cellIdInEnvironmentArea(space, area, cellId)` for membership (requires `EncounterSpace` for sphere-like shapes).

## Merge and precedence

1. **Applicable zones** — zones whose area contains `cellId`.  
2. **Sort** — `sortZonesForMerge`: ascending `priority` (default `0`), then ascending `id` (stable tie-break).  
3. **Scalars** (`setting`, `lightingLevel`, `terrainMovement`, `visibilityObscured`, `terrainCover`) — start from baseline; each sorted applicable zone may override; **last in sorted order wins** (higher numeric `priority` wins when both set a field).  
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

`DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE` matches the runtime default (outdoors, bright, normal terrain, no obscurement, `terrainCover: 'none'`, no atmosphere tags).

## Viewer perception API (see `perception.resolve.ts`)

| Function | Purpose |
|----------|---------|
| `resolveViewerPerceptionForCell(...)` | Per target cell, given viewer/target world state |
| `resolveViewerBattlefieldPerception(...)` | Veil + boundary flags from viewer’s cell |
| `resolveViewerPerceptionForCellFromState` / `resolveViewerBattlefieldPerceptionFromState` | Convenience when using `EncounterState` + placements |
| `effectiveMagicalDarknessBypass(capabilities)` | Devil’s Sight / truesight / explicit bypass (not darkvision alone) |

Baseline rules: no special senses unless `EncounterViewerPerceptionCapabilities` sets flags; DM role skips restrictions.

## Simulator viewer POV (active combatant)

The encounter simulator uses **`GridPerceptionInput`** with **`viewerCombatantId`** = the **active combatant** and **`viewerRole`** = **`pc`** (rules apply) by default. **`EncounterViewerContext.simulatorViewerMode`** (`active-combatant` | `dm`) maps to that: `active-combatant` → PC POV; `dm` → omniscient grid (debug). Session **`viewerRole`** on the same context remains for DM tools / capabilities, separate from grid perception.

**No active combatant:** when `activeCombatantId` is null, **perception is omitted** from `selectGridViewModel` — the grid renders without viewer-relative masking (safest fallback until turn order resumes).

**Debug:** optional **`debugPerceptionOverrides`** on viewer context merges into perception capabilities in `mergeGridPerceptionInputCapabilities` (e.g. `ignoreMagicalDarkness` / `forceMagicalDarknessBypass` as temporary bypass flags).

## Render projection (Phase 3)

**Rules stay in perception; UI consumes projection only.**

| Module | Role |
|--------|------|
| `perception.render.projection.ts` | Maps `EncounterViewerPerceptionCell` + `EncounterViewerBattlefieldPerception` → `EncounterGridCellRenderState` / `EncounterBattlefieldRenderState` (presentation flags, not domain merge). |
| [`selectors/space.selectors.ts`](../../src/features/encounter/space/selectors/space.selectors.ts) (`selectGridViewModel`) | When `perception` input is passed, attaches per-cell render state and battlefield veil flags to the grid view model. |
| `cellVisualState.ts` / `cellVisualStyles.ts` | Maps `VisibilityFillKind` → `CellBaseFillKind` and `baseFillSx` — **presentation only**; not a rules source. |
| `EncounterGrid.tsx` | Applies merged cell visuals, blind veil overlay (viewer cell lifted above veil), token visibility from `occupantTokenVisibility`, obstacle glyphs from `showObstacleGlyph`. |

DM role continues to bypass veils and masking in projection (`viewerRole: 'dm'`).

## Source-driven environment zones (Phase 4)

**Gameplay sources** (attached battlefield effects, concentration, obstacle moves) own lifecycle; **`environmentZones`** are a **derived world-state layer**, not authored independently for those sources.

| Piece | Role |
|--------|------|
| `BattlefieldEffectInstance.environmentZoneProfile` | Optional profile (e.g. `magical-darkness`, `fog`) copied from spell `emanation.environmentZoneProfile` → `CombatActionDefinition.attachedEmanation` → persisted instance on cast. |
| `environmentZoneIdForAttachedAuraInstance(instanceId)` | Stable zone id: `attached-aura-env:${instanceId}` — upsert replaces the row; no duplicate zones per aura. |
| `reconcileEnvironmentZonesFromAttachedAuras(state)` | Rebuilds **only** `sourceKind === 'attached-aura'` zones from current `attachedAuraInstances` + `resolveBattlefieldEffectOriginCellId`; preserves unrelated zones (`manual`, etc.). |
| `reconcileBattlefieldEffectAnchors` | Ends with environment zone reconciliation so anchor moves (creature, place, object) and removals stay in sync with coverage. |
| `addAttachedAuraInstance` / `removeAttachedAurasForSource` | Run anchor reconciliation so new/removals immediately refresh zones. |

**Why reconciliation:** concentration drop, invalid anchors, obstacle deletion, and spell end all remove or move the **source** row first; zones must follow or stale magical darkness would remain in world state without touching perception/render directly.

**Current authored profile:** *Darkness* sets `environmentZoneProfile: 'magical-darkness'` on its `emanation` effect (`level2-a-f.ts`). Additional spells/traits add new profile literals and `buildZoneForProfile` cases as needed.

## Non-goals

- Domain modules do not own React types; projection bridges to grid-facing flags.  
- **Deferred:** wiring setup/edit UI (`environmentSetup` in React) to call `updateEncounterEnvironmentBaseline` when the encounter is already active — not implemented here.

## Related types

- **`EncounterEnvironmentExtended`** — optional narrative/campaign schema; not the tactical baseline.

## Remaining integration TODOs

- **More `AttachedEnvironmentZoneProfile` values** — e.g. non-magical heavily obscured areas, spell-specific light patches; extend `EmanationEffect.environmentZoneProfile` + `buildZoneForProfile`.  
- **Combatant capabilities** — wire `EncounterViewerPerceptionCapabilities` from combatant stats (darkvision range, blindsight, Devil’s Sight, etc.) into `selectGridViewModel`’s perception input.  
- **Richer sense-specific perception** — blindsight/truesight range, stealth/invisibility (out of scope for current projection).
