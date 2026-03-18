export function resolveCharacterLevel(classEntries: Array<{ level: number }>): number {
  return classEntries.reduce((sum, entry) => sum + Math.max(0, entry.level), 0)
}
