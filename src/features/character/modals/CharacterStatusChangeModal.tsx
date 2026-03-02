import { ConfirmModal } from '@/ui/patterns'

type CharacterStatusChangeModalProps = {
  statusAction: {
    campaignMemberId: string
    campaignName: string
    newStatus: 'inactive' | 'deceased'
  } | null
  characterName: string
  isOwner: boolean
  isAdmin: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export default function CharacterStatusChangeModal({
  statusAction,
  characterName,
  isOwner,
  isAdmin,
  onCancel,
  onConfirm,
}: CharacterStatusChangeModalProps) {
  const campaignName = statusAction?.campaignName ?? 'the campaign'

  let headline: string
  let description: string
  let confirmLabel: string

  if (statusAction?.newStatus === 'deceased') {
    headline = 'Mark Character as Deceased'
    description = `This will mark ${characterName} as deceased in ${campaignName}. All party members will be notified.`
    confirmLabel = 'Mark Deceased'
  } else if (isOwner && !isAdmin) {
    headline = 'Leave Campaign'
    description = `This will remove ${characterName} from ${campaignName}. All party members will be notified.`
    confirmLabel = 'Leave Campaign'
  } else {
    headline = 'Set Character Inactive'
    description = `This will set ${characterName} as inactive in ${campaignName}. All party members will be notified.`
    confirmLabel = 'Set Inactive'
  }

  return (
    <ConfirmModal
      open={!!statusAction}
      onCancel={onCancel}
      onConfirm={onConfirm}
      headline={headline}
      description={description}
      confirmLabel={confirmLabel}
      confirmColor={statusAction?.newStatus === 'deceased' ? 'error' : 'warning'}
    />
  )
}
