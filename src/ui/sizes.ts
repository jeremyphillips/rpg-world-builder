import type { ButtonProps } from '@mui/material/Button'
import type { ChipProps } from '@mui/material/Chip'
import type { TextFieldProps } from '@mui/material/TextField'

/**
 * MUI text field / outlined input `size` after `src/types/mui-size-large.d.ts` augmentation.
 */
export type MuiTextFieldSize = NonNullable<TextFieldProps['size']>

/** MUI `Button` `size`. */
export type MuiButtonSize = NonNullable<ButtonProps['size']>

/**
 * Dense inputs: `large` is reserved for full-width form fields, not compact toolbars.
 * Use {@link ChipBadgeSize} for chips/badges — do not use this for decorative labels.
 */
export type MuiDenseInputSize = Extract<MuiTextFieldSize, 'small' | 'medium'>

/** Per-row MUI `size` for {@link AppDataGrid} toolbar (secondary row has no `large`). */
export type AppDataGridToolbarFieldSizes = {
  primary?: MuiTextFieldSize
  secondary?: MuiDenseInputSize
}

/** `AppMultiSelect` (Autocomplete) — only dense MUI sizes. */
export type AppMultiSelectSize = MuiDenseInputSize

/**
 * Chip and badge decorative labels — distinct from form input {@link MuiTextFieldSize}.
 * Sourced from MUI `Chip` so chip/badge sizing stays aligned with MUI, separate from inputs.
 */
export type ChipBadgeSize = NonNullable<ChipProps['size']>
