/**
 * Cross-domain material identifiers, display labels, and optional **reaction** hints for future
 * environment/spell interaction. Domain features (e.g. locations) should take **subsets** of
 * {@link MaterialId} rather than redefining material spellings locally.
 */

import type { ElementId } from '../elements/elements';

/** Canonical material ids — single vocabulary for stone/wood/tile across domains. */
export const MATERIAL_IDS = ['stone', 'wood', 'tile'] as const;

export type MaterialId = (typeof MATERIAL_IDS)[number];

/**
 * Optional future-facing hints for how a material interacts with elements (fire, …) and ignition.
 *
 * @remarks **TODO:** spell systems, environmental hazards, and combat do **not** consistently
 * consume these fields yet. No ignition propagation, burn duration, or damage scaling is implied
 * here — only a place to hang simple flags and element references for later wiring.
 */
export type MaterialReactionProfile = {
  /**
   * Whether this material can ignite and sustain combustion in future fire simulation.
   * @remarks **TODO:** not evaluated by gameplay loops in this pass.
   */
  flammable?: boolean;
  /**
   * Elements that can plausibly ignite this material (e.g. `fire` for dry wood).
   * @remarks **TODO:** reserved for spell/environment hooks; unused in runtime today.
   */
  ignitedBy?: readonly ElementId[];
  /**
   * Elements this material is treated as resistant to in future interaction rules.
   * @remarks **TODO:** not applied to damage or saves yet.
   */
  resistantTo?: readonly ElementId[];
  /**
   * Elements this material is treated as vulnerable to in future interaction rules.
   * @remarks **TODO:** not applied to damage or saves yet.
   */
  vulnerableTo?: readonly ElementId[];
};

type MaterialEntry = {
  id: MaterialId;
  label: string;
  /**
   * Future-facing interaction hints (flammability, element ties).
   * @remarks **TODO:** see {@link MaterialReactionProfile}; gameplay may ignore until systems land.
   */
  reactionProfile?: MaterialReactionProfile;
};

/**
 * Human-readable labels and optional {@link MaterialReactionProfile} per {@link MaterialId}.
 * Ids are listed explicitly so they stay aligned with {@link MATERIAL_IDS}.
 */
export const MATERIAL_META = {
  stone: {
    id: 'stone',
    label: 'Stone',
    reactionProfile: {
      flammable: false,
    },
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    reactionProfile: {
      flammable: true,
      ignitedBy: ['fire'] as const,
    },
  },
  tile: {
    id: 'tile',
    label: 'Tile',
    reactionProfile: {
      flammable: false,
    },
  },
} as const satisfies Record<MaterialId, MaterialEntry>;
