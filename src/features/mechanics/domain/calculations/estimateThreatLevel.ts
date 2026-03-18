// ---------------------------------------------------------------------------
// CR estimation from core stats (rough heuristic)
// ---------------------------------------------------------------------------

export function estimateThreatLevel(hp: number): number {
  // const hp = core.hpAverage
  if (hp <= 6) return 0
  if (hp <= 35) return 0.25
  if (hp <= 49) return 0.5
  if (hp <= 70) return 1
  if (hp <= 85) return 2
  if (hp <= 100) return 3
  if (hp <= 115) return 4
  if (hp <= 130) return 5
  if (hp <= 145) return 6
  if (hp <= 160) return 7
  if (hp <= 175) return 8
  if (hp <= 190) return 9
  return 10
}