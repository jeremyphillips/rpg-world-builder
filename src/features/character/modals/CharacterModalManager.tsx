import type { CharacterDoc } from '@/shared'
import type { EditionId } from '@/data'
import type { LevelUpResult } from '@/features/character/levelUp'
import { AwardXpModal } from '@/features/character/modals'
import { LevelUpWizard } from '@/features/character/levelUp'
import CancelLevelUpModal from './CancelLevelUpModal'
import CharacterDeleteModal from './CharacterDeleteModal'
import CharacterStatusChangeModal from './CharacterStatusChangeModal'
import EditWealthModal from './EditWealthModal'

type CharacterModalManagerProps = {
  character: CharacterDoc
  currentLevel: number
  maxLevel: number
  primaryClassId: string | undefined
  activeCampaignCount: number
  isOwner: boolean
  isAdmin: boolean

  awardXpOpen: boolean
  onAwardXpClose: () => void
  onAwardXp: (params: { newXp: number; triggersLevelUp: boolean; pendingLevel?: number }) => Promise<void>

  levelUpOpen: boolean
  onLevelUpClose: () => void
  onLevelUpComplete: (result: LevelUpResult) => Promise<void>

  cancelLevelUpOpen: boolean
  onCancelLevelUpClose: () => void
  onCancelLevelUp: () => Promise<void>

  deleteOpen: boolean
  onDeleteClose: () => void
  onDeleteConfirm: () => Promise<void>

  statusAction: {
    campaignMemberId: string
    campaignName: string
    newStatus: 'inactive' | 'deceased'
  } | null
  onStatusActionClose: () => void
  onStatusActionConfirm: () => Promise<void>

  editWealthOpen: boolean
  onEditWealthClose: () => void
  onEditWealthSave: (wealth: { gp: number; sp: number; cp: number }) => Promise<void>
}

export default function CharacterModalManager({
  character,
  currentLevel,
  maxLevel,
  primaryClassId,
  activeCampaignCount,
  isOwner,
  isAdmin,
  awardXpOpen,
  onAwardXpClose,
  onAwardXp,
  levelUpOpen,
  onLevelUpClose,
  onLevelUpComplete,
  cancelLevelUpOpen,
  onCancelLevelUpClose,
  onCancelLevelUp,
  deleteOpen,
  onDeleteClose,
  onDeleteConfirm,
  statusAction,
  onStatusActionClose,
  onStatusActionConfirm,
  editWealthOpen,
  onEditWealthClose,
  onEditWealthSave,
}: CharacterModalManagerProps) {
  return (
    <>
      {/* Award XP modal */}
      <AwardXpModal
        open={awardXpOpen}
        onClose={onAwardXpClose}
        characterName={character.name}
        currentXp={character.xp ?? 0}
        currentLevel={currentLevel}
        editionId={character.edition as EditionId}
        primaryClassId={primaryClassId}
        maxLevel={maxLevel}
        onAward={onAwardXp}
      />

      {/* Level-up wizard */}
      {character.levelUpPending && character.pendingLevel && (
        <LevelUpWizard
          open={levelUpOpen}
          onClose={onLevelUpClose}
          character={character}
          onComplete={onLevelUpComplete}
        />
      )}

      {/* Cancel level-up confirmation */}
      <CancelLevelUpModal
        open={cancelLevelUpOpen}
        characterName={character.name}
        currentLevel={currentLevel}
        pendingLevel={character.pendingLevel}
        onCancel={onCancelLevelUpClose}
        onConfirm={onCancelLevelUp}
      />

      {/* Delete character confirmation */}
      <CharacterDeleteModal
        open={deleteOpen}
        characterName={character.name}
        activeCampaignCount={activeCampaignCount}
        onCancel={onDeleteClose}
        onConfirm={onDeleteConfirm}
      />

      {/* Character status change confirmation */}
      <CharacterStatusChangeModal
        statusAction={statusAction}
        characterName={character.name}
        isOwner={isOwner}
        isAdmin={isAdmin}
        onCancel={onStatusActionClose}
        onConfirm={onStatusActionConfirm}
      />

      {/* Edit wealth */}
      <EditWealthModal
        open={editWealthOpen}
        onClose={onEditWealthClose}
        currentWealth={character.wealth ?? {}}
        onSave={onEditWealthSave}
      />
    </>
  )
}
