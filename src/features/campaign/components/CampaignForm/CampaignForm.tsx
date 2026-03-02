import { useMemo } from 'react'

import {
  AppForm,
  DynamicFormRenderer,
  FormActions,
  type FieldConfig,
} from '@/ui/patterns'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

export interface CampaignFormData {
  name: string
  edition: string
  setting: string
}

// ---------------------------------------------------------------------------
// Inner component — watches edition and renders dynamic fields
// ---------------------------------------------------------------------------

function CampaignFields({ canEdit }: { canEdit: boolean }) {

  const fields: FieldConfig[] = useMemo(() => [
    {
      type: 'text' as const,
      name: 'name',
      label: 'Name',
      placeholder: 'Campaign name',
      required: true,
      disabled: !canEdit,
    },
  ], [canEdit])

  return <DynamicFormRenderer fields={fields} />
}

// ---------------------------------------------------------------------------
// CampaignForm
// ---------------------------------------------------------------------------

export default function CampaignForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  canEdit = true,
}: {
  initial: CampaignFormData
  onSubmit: (data: CampaignFormData) => Promise<void>
  onCancel: () => void
  submitLabel: string
  /** @deprecated Handled automatically by FormActions via react-hook-form isSubmitting state */
  submittingLabel?: string
  canEdit?: boolean
}) {
  return (
    <AppForm<CampaignFormData>
      defaultValues={initial}
      onSubmit={onSubmit}
    >
      <CampaignFields canEdit={canEdit} />

      {canEdit && (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <FormActions submitLabel={submitLabel} />
        </Stack>
      )}
    </AppForm>
  )
}
