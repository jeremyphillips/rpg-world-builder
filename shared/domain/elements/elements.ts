/**
 * Cross-domain **element** identifiers for future spell, hazard, and environment interactions.
 *
 * This module is intentionally minimal: canonical ids + labels only. It does **not** implement
 * damage pipelines, propagation, status effects, or combat rules.
 *
 * @remarks **TODO (broader consumption):** combat resolution, spell execution, ignition systems,
 * burning ticks, and resistance/vulnerability checks do **not** read these values yet. This is
 * groundwork for flammability, `fireball`-style interactions, and material/element coupling —
 * not dead code.
 */

/** Canonical element ids — extend when new elemental primitives are needed (e.g. `cold`). */
export const ELEMENT_IDS = ['fire'] as const;

export type ElementId = (typeof ELEMENT_IDS)[number];

/**
 * Display metadata per {@link ElementId}.
 * Ids stay aligned with {@link ELEMENT_IDS}.
 */
export const ELEMENT_META = {
  fire: { id: 'fire', label: 'Fire' },
} as const satisfies Record<ElementId, { id: ElementId; label: string }>;
