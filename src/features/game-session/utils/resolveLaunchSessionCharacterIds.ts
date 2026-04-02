/**
 * Maps lobby **presence** (user ids currently connected to the game session lobby over Socket.IO)
 * onto **campaign roster characters** using each character’s `ownerUserId`.
 *
 * ## Current rule
 * **Launched character ids** = `expectedCharacterIds` ∩ { characters whose `ownerUserId` is in
 * `presentUserIds` }, preserving roster order.
 *
 * ## Future evolution (intentional seam — do not inline this policy in routes/services)
 * This helper is the home for later rules such as:
 * - DM override to include absent PCs
 * - ready-state requirement before launch
 * - minimum participant count
 * - manual launch participant selection
 * - hot-join into active play
 * - stricter “PC only” vs party-NPC handling
 */
export type RosterCharacterForLaunch = {
  id: string
  /** Account that owns the character; aligns with lobby `presentUserIds` (user ids). */
  ownerUserId: string
}

export function resolveLaunchSessionCharacterIds(options: {
  expectedCharacterIds: readonly string[]
  rosterCharacters: readonly RosterCharacterForLaunch[]
  presentUserIds: readonly string[]
}): string[] {
  const expected = new Set(options.expectedCharacterIds)
  const present = new Set(options.presentUserIds)
  const launched: string[] = []
  for (const row of options.rosterCharacters) {
    if (!expected.has(row.id)) continue
    if (present.has(row.ownerUserId)) launched.push(row.id)
  }
  return launched
}
