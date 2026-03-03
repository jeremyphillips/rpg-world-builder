export const DIE_FACES = [4, 6, 8, 10, 12, 20] as const;

export const DIE_FACE_OPTIONS = DIE_FACES.map((n) => ({
  value: n,
  label: `d${n}`,
})) as ReadonlyArray<{ value: (typeof DIE_FACES)[number]; label: string }>;