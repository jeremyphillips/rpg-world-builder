import type { Components, Theme } from '@mui/material/styles'

import { CONTROL_SIZES } from './controlSizes'

/** 1px outline border top + bottom (MUI outlined field). */
const OUTLINED_BORDER_Y_PX = 2

/**
 * Match single-line control height to `box.height` by sizing vertical padding; assumes 16px root rem.
 * Does not use minHeight as the primary lever — fixed height on the root + explicit inner padding.
 */
function outlineInputVerticalPaddingPx(size: 'small' | 'medium' | 'large'): number {
  const { box, content } = CONTROL_SIZES[size]
  const rem = parseFloat(content.fontSize)
  const fontPx = rem * 16
  const lineBoxPx = fontPx * content.lineHeight
  const innerPx = box.height - OUTLINED_BORDER_Y_PX
  return Math.max(0, (innerPx - lineBoxPx) / 2)
}

function outlinedInputSizeStyles(size: 'small' | 'medium' | 'large') {
  const { box, content } = CONTROL_SIZES[size]
  const padY = outlineInputVerticalPaddingPx(size)
  /** Vertical only — keep MUI horizontal padding (Select needs extra end padding for the icon). */
  const inputSlot = {
    fontSize: content.fontSize,
    lineHeight: content.lineHeight,
    paddingTop: padY,
    paddingBottom: padY,
    minHeight: 0,
  }

  return {
    height: box.height,
    boxSizing: 'border-box' as const,
    '& .MuiOutlinedInput-input': inputSlot,
    '& .MuiSelect-select': {
      ...inputSlot,
      display: 'flex',
      alignItems: 'center',
    },
  }
}

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxSizing: 'border-box',
        textTransform: 'none',
      },
      sizeSmall: {
        minHeight: CONTROL_SIZES.small.box.height,
        padding: `0 ${CONTROL_SIZES.small.box.px}px`,
        fontSize: CONTROL_SIZES.small.content.fontSize,
        lineHeight: CONTROL_SIZES.small.content.lineHeight,
      },
      sizeMedium: {
        minHeight: CONTROL_SIZES.medium.box.height,
        padding: `0 ${CONTROL_SIZES.medium.box.px}px`,
        fontSize: CONTROL_SIZES.medium.content.fontSize,
        lineHeight: CONTROL_SIZES.medium.content.lineHeight,
      },
      sizeLarge: {
        minHeight: CONTROL_SIZES.large.box.height,
        padding: `0 ${CONTROL_SIZES.large.box.px}px`,
        fontSize: CONTROL_SIZES.large.content.fontSize,
        lineHeight: CONTROL_SIZES.large.content.lineHeight,
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'medium',
    },
  },
  MuiSelect: {
    defaultProps: {
      size: 'medium',
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ ownerState }) => {
        if (ownerState.multiline) {
          return {}
        }
        const size = ownerState.size ?? 'medium'
        if (size === 'small' || size === 'medium' || size === 'large') {
          return outlinedInputSizeStyles(size)
        }
        return {}
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: 'none',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },
}
