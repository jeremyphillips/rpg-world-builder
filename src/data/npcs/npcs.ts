import { npcsLankhmar } from "./npcs.lankhmar"
import { npcs5eBase } from "./npcs.npcs5eBase"

type LegacyNpcCharacter = Record<string, unknown> & { id: string }

export const npcs: readonly LegacyNpcCharacter[] = [
  ...npcsLankhmar,
  ...npcs5eBase
] as const