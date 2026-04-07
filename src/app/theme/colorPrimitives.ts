/**
 * Raw color scales — design-token source of truth for the app theme.
 * Semantic palette (`palette.ts`) maps MUI roles to these primitives; do not
 * reference primitives directly from feature code unless adding new theme wiring.
 *
 * Numbering: lower = lighter, higher = darker (100–500 compact scale).
 */

export const colorPrimitives = {
  /** Parchment-to-dungeon neutrals: warm surfaces, ink, and dark UI chrome. */
  gray: {
    100: '#F5F0E8',
    200: '#4A4A4A',
    300: '#1E1E1E',
    400: '#1A1A1A',
    500: '#121212',
  },

  /** Primary fantasy accent — ember, war banners, deep crimson. */
  red: {
    100: '#E06060',
    200: '#C04040',
    300: '#B33030',
    400: '#8B0000',
    500: '#5C0000',
  },

  /** Treasure / divine metallics — secondary accent golds. */
  gold: {
    100: '#E0C566',
    200: '#D4AF37',
    300: '#A68A2B',
    400: '#8B6F1F', // placeholder — scrutinize (palette uses 100–300 only today)
    500: '#6E5A18', // placeholder — scrutinize
  },

  /** Cool slate for map stone surfaces and rocky terrain (not UI warm gray). */
  mapSlate: {
    100: '#9CA3AF',
    200: '#8B95A4', // placeholder — scrutinize (map uses 100 & 300 only today)
    300: '#6B7280',
    400: '#5B6570', // placeholder — scrutinize
    500: '#4B5563', // placeholder — scrutinize
  },

  /** Map vegetation: plains through deep forest / swamp. */
  mapGreen: {
    100: '#86A35C',
    200: '#5A9A5E',
    300: '#5C6B55',
    400: '#456A48', // placeholder — scrutinize (bridge step; not in swatch keys yet)
    500: '#2D4A32',
  },

  /** Map water — mid tone is canonical swatch; lighter/darker hold depth variants. */
  mapBlue: {
    100: '#A8D4F0', // placeholder — scrutinize (map uses 300 only today)
    200: '#6BAFDB', // placeholder — scrutinize
    300: '#3B82C4',
    400: '#2E6BA8', // placeholder — scrutinize
    500: '#1F4A73', // placeholder — scrutinize
  },

  /** Map arid / sand — mid tone is desert cell fill; steps support dunes/shadows later. */
  mapSand: {
    100: '#F0E4D0', // placeholder — scrutinize (map uses 300 only today)
    200: '#E2C99A', // placeholder — scrutinize
    300: '#D4A574',
    400: '#B88858', // placeholder — scrutinize
    500: '#9A6B45', // placeholder — scrutinize
  },

  /** Map soil / dirt / clay — warmer and redder than `mapSand`; mid tone for canonical cell fill. */
  mapEarth: {
    100: '#EFEBE3',
    200: '#D7C4A8',
    300: '#B0895A',
    400: '#8B5E3C',
    500: '#5C3D28',
  },

  /**
   * Map interior wood flooring — warm honey / oak brown (distinct from `mapSlate` stone and `mapEarth` soil).
   * Mid tone is the canonical wood cell-fill swatch.
   */
  mapWood: {
    100: '#E5D4BC',
    200: '#D4B896',
    300: '#B8956A',
    400: '#8F6A47',
    500: '#5C4030',
  },

  /**
   * Overlay / chroma accents (region presets, UI hints). Not terrain — use `mapGreen` /
   * `mapBlue` etc. for cell-fill geography.
   */
  blue: {
    100: '#93C5FD', // placeholder — scrutinize (region presets use 300 only today)
    200: '#60A5FA', // placeholder — scrutinize
    300: '#2563EB',
    400: '#1D4ED8', // placeholder — scrutinize
    500: '#1E40AF', // placeholder — scrutinize
  },

  green: {
    100: '#86EFAC', // placeholder — scrutinize (region presets use 300 only today)
    200: '#4ADE80', // placeholder — scrutinize
    300: '#22C55E',
    400: '#16A34A', // placeholder — scrutinize
    500: '#15803D', // placeholder — scrutinize
  },

  purple: {
    100: '#E9D5FF', // placeholder — scrutinize (region presets use 300 only today)
    200: '#C084FC', // placeholder — scrutinize
    300: '#A855F7',
    400: '#9333EA', // placeholder — scrutinize
    500: '#7E22CE', // placeholder — scrutinize
  },

  teal: {
    100: '#99F6E4', // placeholder — scrutinize (region presets use 300 only today)
    200: '#2DD4BF', // placeholder — scrutinize
    300: '#14B8A6',
    400: '#0D9488', // placeholder — scrutinize
    500: '#0F766E', // placeholder — scrutinize
  },

  orange: {
    100: '#FED7AA', // placeholder — scrutinize (region presets use 300 only today)
    200: '#FB923C', // placeholder — scrutinize
    300: '#F97316',
    400: '#EA580C', // placeholder — scrutinize
    500: '#C2410C', // placeholder — scrutinize
  },

  white: '#FFFFFF',
  black: '#000000',
} as const
