/**
 * Bridges react-hook-form / patch-driver values to OptionPickerField's string[] API.
 */
export function pickerValueToArray(
  value: unknown,
  valueMode: 'scalar' | 'array' | undefined,
): string[] {
  const mode = valueMode ?? 'array'
  if (mode === 'scalar') {
    if (value === '' || value == null) return []
    return [String(value)]
  }
  return Array.isArray(value) ? (value as string[]) : []
}

export function pickerArrayToFormValue(
  next: string[],
  valueMode: 'scalar' | 'array' | undefined,
): string | string[] {
  const mode = valueMode ?? 'array'
  if (mode === 'scalar') {
    if (next.length === 0) return ''
    return next[0] ?? ''
  }
  return next
}
