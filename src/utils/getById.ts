export const getById = <T extends { id: string }>(
  array: readonly T[] | undefined | null,
  id: string
): T | undefined => {
  if (!id || !array) return undefined

  return array.find(item => item.id === id)
}
