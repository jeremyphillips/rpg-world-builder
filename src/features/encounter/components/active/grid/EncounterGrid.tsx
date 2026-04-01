import {
  CombatGrid,
  type CombatGridProps,
} from '@/features/combat/components/grid/CombatGrid'

/** Encounter feature entry point; delegates to reusable {@link CombatGrid}. */
export type EncounterGridProps = CombatGridProps

export function EncounterGrid(props: EncounterGridProps) {
  return <CombatGrid {...props} />
}
