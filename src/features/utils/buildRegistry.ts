export function buildRegistry<
  const T extends readonly { id: string; key?: string }[]
>(items: T) {
  const byId = Object.fromEntries(items.map(i => [i.id, i])) as {
    [K in T[number]['id']]: Extract<T[number], { id: K }>
  };

  const ids = items.map(i => i.id) as readonly T[number]['id'][];

  const byKey = Object.fromEntries(
    items
      .filter((i): i is Extract<T[number], { key: string }> => !!i.key)
      .map(i => [i.key, i])
  ) as Record<string, T[number]>;

  const keys = items
    .map(i => i.key)
    .filter(Boolean) as readonly T[number]['key'][];

  return {
    items,
    byId,
    byKey,
    ids,
    keys,
  };
}