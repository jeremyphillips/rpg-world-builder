type LoreBase = {
  alignment?: string
  xpValue?: number
}

export interface LoreD20 extends LoreBase {
  challengeRating: number
  organization?: string
  environment?: string
  intelligence?: string
  // TODO: advancement?: string              — e.g. "4-6 HD (Large); 7-9 HD (Huge)"
  // TODO: levelAdjustment?: number | null   — LA for playable races
  // TODO: treasure?: string                 — e.g. "Standard", "Double standard"
}