export const CANTRIP_PROGRESSION_PROFILES = {
  standard2: [
    { level: 1, known: 2 },
    { level: 4, known: 3 },
    { level: 10, known: 4 },
  ],
  standard3: [
    { level: 1, known: 3 },
    { level: 4, known: 4 },
    { level: 10, known: 5 },
  ],
  standard4: [
    { level: 1, known: 4 },
    { level: 4, known: 5 },
    { level: 10, known: 6 },
  ],
} as const;

export type CantripProgressionProfileId = keyof typeof CANTRIP_PROGRESSION_PROFILES;

/** Resolve cantrips known at a given class level from a profile. */
export function getCantripsFromProfile(
  profileId: CantripProgressionProfileId,
  classLevel: number,
): number {
  const profile = CANTRIP_PROGRESSION_PROFILES[profileId]
  let result = 0
  for (const entry of profile) {
    if (entry.level <= classLevel) result = entry.known
  }
  return result
}