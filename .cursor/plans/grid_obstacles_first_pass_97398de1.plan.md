# Battlefield obstructions (first pass) — scope

## In scope

- Domain types `GridObstacle` / `GridObstacleKind` on `EncounterSpace`, `placeRandomGridObstacle` after `createSquareGridSpace`, wire in `EncounterRuntimeContext`.
- View model + grid rendering (marker + **MUI `Tooltip` with obstruction display name** on cell hover).
- **`docs/reference/space.md`**: directory entry, obstacle behavior, environment mapping (`mixed` / `other` → pillar), limitation (placement vs combatants timing).

## Out of scope

- Full LoS, pathfinding, obstacle editing UI, multiple obstacles beyond one random.
