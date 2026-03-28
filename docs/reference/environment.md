# Environment domain (reference)

This file is a **short index** for the mechanics environment layer. The full layered model (baseline, zones, merge, perception inputs) lives in [Encounter environment (layered model)](./environments.md).

## Types (`environment.types.ts`)

| Type | Role |
|------|------|
| `EncounterEnvironmentBaseline` | Authored global defaults for an encounter (setting, lighting, obscured, terrain, atmosphere). |
| `EncounterEnvironmentZone` | Localized patch/emanation/hazard: `area`, `overrides`, optional `magical` flags, optional `visibilityObscurationCause`. |
| `EncounterEnvironmentAreaLink` | Zone geometry: `grid-cell-ids` \| `sphere-ft` \| `unattached`. Use **`sphere-ft`** for sphere coverage in feet (matches grid/AoE). |
| `EncounterWorldCellEnvironment` | Merged **world** state at one cell after baseline + zones (not viewer perception). Includes `obscurationPresentationCauses` for visibility presentation. |
| `AttachedEnvironmentZoneProfile` | Optional profile on `BattlefieldEffectInstance` when a zone is synced from an attached aura (`magical-darkness`, `fog`). See JSDoc on the type for semantics. |

Use **`EncounterEnvironmentExtended`** for narrative/campaign-style environment shapes (not the tactical baseline).

## Removed aliases (no longer exported)

- **`EncounterEnvironment`** — use `EncounterEnvironmentExtended`.
- **`EncounterEnvironmentZoneOverride`** — use `EncounterEnvironmentZone`.
- **`EncounterCellEnvironmentResolved`** — use `EncounterWorldCellEnvironment`.
- **`EncounterEnvironmentAreaLink`** `kind: 'grid-cell-radius'` — use `sphere-ft` with radius in feet.

## Resolution

- Merge and cell resolution: `environment.resolve.ts` (`resolveWorldEnvironmentForCell`, `resolveWorldEnvironmentFromEncounterState`, …).
- Zone sync from attached auras: `environment-zones-battlefield-sync.ts`.

## Visibility presentation

Source-aware obscuration for the grid flows **world merge → contributors → resolved visibility → `VisibilityFillKind`**, documented in [Perception and visibility](./perception-and-visibility.md).
