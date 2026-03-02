import { ConfirmModal } from '@/ui/patterns'

type CancelLevelUpModalProps = {
  open: boolean
  characterName: string
  currentLevel: number
  pendingLevel: number | undefined
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export default function CancelLevelUpModal({
  open,
  characterName,
  currentLevel,
  pendingLevel,
  onCancel,
  onConfirm,
}: CancelLevelUpModalProps) {
  return (
    <ConfirmModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      headline="Cancel Level-Up"
      description={`This will cancel the pending advancement to level ${pendingLevel} and revert ${characterName}'s XP to the level ${currentLevel} threshold. You can re-award XP afterward.`}
      confirmLabel="Cancel Level-Up"
      confirmColor="error"
    />
  )
}
