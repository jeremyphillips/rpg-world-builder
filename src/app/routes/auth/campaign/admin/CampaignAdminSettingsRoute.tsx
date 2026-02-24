import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
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
} from '@/ui/components/form'

const sections: FormSection[] = [
  { id: 'general', label: 'General' },
  { id: 'advanced', label: 'Advanced' }
]

const buildFields = (edition?: string): FieldConfig[] => [
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
  {
    type: 'checkbox',
    name: 'allowLegacyEditionNpcs',
    label: 'Allow legacy edition NPCs?',
    helperText: `Their stats will be converted to ${edition ?? 'the campaign edition'}.`,
    section: 'advanced'
  }
]

export default function CampaignAdminSettingsRoute() {
  const { campaignId: activeCampaignId } = useActiveCampaign()

  const { data, edition, loading, error: fetchError } =
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
        <Alert severity="error">{fetchError ?? 'Campaign not found'}</Alert>
      </Box>
    )
  }

  const fields = buildFields(edition)
  const error = fetchError ?? submitError

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Campaign Settings
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>Settings saved.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <AppForm<CampaignSettings> defaultValues={data} onSubmit={update}>
        <TabbedFormLayout sections={sections} fields={fields} />
        <FormActions submitLabel="Save" showReset />
      </AppForm>
    </Box>
  )
}
