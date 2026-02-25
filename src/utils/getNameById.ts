export const getNameById = <T extends { id: string; name: string }>(
  collection: T[],
  id?: string
): string | undefined =>
  collection.find(item => item.id === id)?.name
