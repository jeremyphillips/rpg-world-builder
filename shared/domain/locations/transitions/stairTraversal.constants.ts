/**
 * First-pass stair traversal cost for play/combat (feet). Not multiplied by difficult terrain.
 *
 * TODO: Tie to ruleset / space {@link EncounterSpace} `cellFeet` or allow authored per-building overrides.
 */
export const STAIR_TRAVERSAL_MOVEMENT_COST_FT = 5 as const;
