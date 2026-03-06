export function filterAllowedIds(
  ids: string[] | undefined,
  allowedById: Record<string, unknown>
): string[] | undefined {
  if (!ids) return undefined;
  return ids.filter(id => id in allowedById);
}
