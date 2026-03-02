import { ConfirmModal } from '@/ui/patterns'

type CharacterDeleteModalProps = {
  open: boolean
  characterName: string
  activeCampaignCount: number
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export default function CharacterDeleteModal({
  open,
  characterName,
  activeCampaignCount,
  onCancel,
  onConfirm,
}: CharacterDeleteModalProps) {
  return (
    <ConfirmModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      headline="Delete Character"
      description={
        activeCampaignCount > 0
          ? `This will remove ${characterName} from ${activeCampaignCount} active campaign${activeCampaignCount !== 1 ? 's' : ''} and notify party members. Campaign history will be preserved, but you will no longer be able to access this character.`
          : `This will permanently delete ${characterName}. This action cannot be undone.`
      }
      confirmLabel="Delete Character"
      confirmColor="error"
    />
  )
}
