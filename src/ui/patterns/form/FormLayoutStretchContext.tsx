import { createContext, useContext, type ReactNode } from 'react';

/** When true, fields in a horizontal `Grid` row stretch to match the tallest control in that row. */
const FormLayoutStretchContext = createContext(false);

/**
 * Applied to outlined `TextField` / `FormControl` so shorter controls (e.g. `Select`) grow to match
 * taller neighbors in the same row (e.g. `type="number"` inputs).
 *
 * For `Select`, vertically center the displayed value when the outlined root is stretched tall
 * (avoids placeholder / value sitting at the top of the value area).
 */
export const formGridStretchOutlinedSx = {
  flex: 1,
  minHeight: 0,
  alignSelf: 'stretch',
  width: '100%',
  '& .MuiOutlinedInput-root': {
    height: '100%',
  },
  '& .MuiOutlinedInput-root .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    minHeight: 0,
    boxSizing: 'border-box',
  },
} as const;

export function FormLayoutStretchProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return <FormLayoutStretchContext.Provider value={value}>{children}</FormLayoutStretchContext.Provider>;
}

export function useFormLayoutStretch(): boolean {
  return useContext(FormLayoutStretchContext);
}
