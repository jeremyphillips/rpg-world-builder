import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'

import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { CombatLane } from './CombatLane'
import { AllyCombatantSetupPreviewCard } from './AllyCombatantSetupPreviewCard'

type AllyRosterLaneProps = {
  selectedAllyIds: string[]
  onOpenModal: () => void
  onResolvedCombatant: (runtimeId: string, combatant: CombatantInstance | null) => void
  onRemoveAllyCombatant: (characterId: string) => void
}

export function AllyRosterLane({
  selectedAllyIds,
  onOpenModal,
  onResolvedCombatant,
  onRemoveAllyCombatant,
}: AllyRosterLaneProps) {
  return (
    <CombatLane
      title="Allies"
      description="Choose approved allies to include as combatants with initiative, AC, HP, attacks, and surfaced active effects."
    >
      <Button
        variant="outlined"
        fullWidth
        startIcon={<AddIcon />}
        onClick={onOpenModal}
      >
        Add Allies
      </Button>

      <Stack spacing={1.5}>
        {selectedAllyIds.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No ally combatants selected yet.
          </Typography>
        ) : (
          selectedAllyIds.map((characterId) => (
            <AllyCombatantSetupPreviewCard
              key={characterId}
              characterId={characterId}
              runtimeId={characterId}
              side="party"
              sourceKind="pc"
              onResolved={(combatant) => onResolvedCombatant(characterId, combatant)}
              onRemove={() => onRemoveAllyCombatant(characterId)}
            />
          ))
        )}
      </Stack>
    </CombatLane>
  )
}
