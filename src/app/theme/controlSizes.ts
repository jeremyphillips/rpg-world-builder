/**
 * Canonical control sizing: outer box metrics vs control content typography.
 * Use `box` for dimensions / button horizontal padding; use `content` for
 * input value, placeholder, select display text, and button labels — not for
 * floating labels or helper text.
 */
export const CONTROL_SIZES = {
  small: {
    box: {
      height: 32,
      px: 12,
    },
    content: {
      fontSize: '0.8125rem',
      lineHeight: 1.25,
    },
  },
  medium: {
    box: {
      height: 44,
      px: 16,
    },
    content: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
    },
  },
  large: {
    box: {
      height: 52,
      px: 20,
    },
    content: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
} as const;

export type ControlSize = keyof typeof CONTROL_SIZES;
