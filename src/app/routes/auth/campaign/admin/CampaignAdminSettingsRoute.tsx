import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import {
  useCampaignSettings,
  useUpdateCampaignSettings,
  type CampaignSettings
} from '@/features/campaign/hooks'
import {
  AppForm,
  TabbedFormLayout,
  FormActions,
  type FieldConfig,
  type FormSection
} from '@/ui/patterns'
import { AppAlert } from '@/ui/primitives'

const sections: FormSection[] = [
  { id: 'general', label: 'General' },
  { id: 'advanced', label: 'Advanced' }
]

const buildFields = (): FieldConfig[] => [
  {
    type: 'text',
    name: 'name',
    label: 'Campaign Name',
    required: true,
    placeholder: 'Enter campaign name',
    section: 'general'
  },
  {
    type: 'textarea',
    name: 'description',
    label: 'Description',
    rows: 4,
    placeholder: 'A brief summary of the campaign',
    section: 'general'
  },
  {
    type: 'imageUpload',
    name: 'imageKey',
    label: 'Campaign Image',
    section: 'general'
  },
]

export default function CampaignAdminSettingsRoute() {
  const { campaignId: activeCampaignId } = useActiveCampaign()

  const { data, loading, error: fetchError } =
    useCampaignSettings(activeCampaignId)

  const { update, success, error: submitError } =
    useUpdateCampaignSettings(activeCampaignId)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return (
      <Box>
        <AppAlert tone="danger">{fetchError ?? 'Campaign not found'}</AppAlert>
      </Box>
    )
  }

  const fields = buildFields()
  const error = fetchError ?? submitError

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Campaign Settings
      </Typography>

      {success && <AppAlert tone="success" sx={{ mb: 2 }}>Settings saved.</AppAlert>}
      {error && <AppAlert tone="danger" sx={{ mb: 2 }}>{error}</AppAlert>}

      <AppForm<CampaignSettings> defaultValues={data} onSubmit={update}>
        <TabbedFormLayout sections={sections} fields={fields} />
        <FormActions submitLabel="Save" showReset />
      </AppForm>
    </Box>
  )
}
