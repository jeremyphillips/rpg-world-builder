import { forwardRef } from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';

export type AppTextFieldProps = TextFieldProps;

/**
 * App-level text field: outlined MUI `TextField` with shared defaults.
 * Use anywhere (local state, controlled props). For react-hook-form, see {@link AppFormTextField}.
 */
export const AppTextField = forwardRef<HTMLDivElement, AppTextFieldProps>(
  function AppTextField(props, ref) {
    return <TextField ref={ref} variant="outlined" {...props} />;
  },
);
