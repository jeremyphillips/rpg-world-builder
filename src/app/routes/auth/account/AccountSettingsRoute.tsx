import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import {
  useAccountSettings,
  useUpdateAccountSettings,
  type AccountSettings
} from '@/features/account/hooks'
import {
  AppForm,
  TabbedFormLayout,
  FormActions,
  type FieldConfig,
  type FormSection
} from '@/ui/patterns'
import { AppAlert } from '@/ui/primitives'

const sections: FormSection[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'preferences', label: 'Preferences' }
]

const fields: FieldConfig[] = [
  // ── Profile ──
  {
    type: 'text',
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter your first name',
    section: 'profile'
  },
  {
    type: 'text',
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Enter your last name',
    section: 'profile'
  },
  {
    type: 'text',
    name: 'username',
    label: 'Username',
    required: true,
    placeholder: 'Choose a username',
    section: 'profile'
  },
  {
    type: 'imageUpload',
    name: 'avatarKey',
    label: 'Avatar',
    section: 'profile'
  },
  {
    type: 'textarea',
    name: 'bio',
    label: 'Bio',
    rows: 3,
    placeholder: 'Tell us about yourself',
    section: 'profile'
  },
  {
    type: 'text',
    name: 'website',
    label: 'Website',
    placeholder: 'https://example.com',
    section: 'profile'
  },

  // ── Security ──
  {
    type: 'text',
    name: 'email',
    label: 'Email Address',
    required: true,
    inputType: 'email',
    placeholder: 'you@example.com',
    section: 'security'
  },
  {
    type: 'text',
    name: '_passwordPlaceholder',
    label: 'Change Password',
    disabled: true,
    placeholder: 'Coming soon',
    helperText: 'Password change is not yet available.',
    section: 'security'
  },
  // TODO: 2FA
  // TODO: Connected login providers (Google, etc.)
  // TODO: Active sessions (log out other devices)

  // ── Notifications ──
  {
    type: 'checkbox',
    name: 'notificationPreferences.sessionScheduled',
    label: 'Session scheduled',
    helperText: 'Receive an email when a new session is scheduled.',
    section: 'notifications'
  },
  {
    type: 'checkbox',
    name: 'notificationPreferences.inviteReceived',
    label: 'Invite received',
    helperText: 'Receive an email when you get a campaign invite.',
    section: 'notifications'
  },
  {
    type: 'checkbox',
    name: 'notificationPreferences.mentionedInChat',
    label: 'Mentioned in chat',
    helperText: 'Receive an email when someone mentions you in chat.',
    section: 'notifications'
  },

  // ── Preferences ──
  // No fields yet — placeholder tab
]

export default function AccountSettingsRoute() {
  const { data, loading, error: fetchError } = useAccountSettings()
  const { update, success, error: submitError } = useUpdateAccountSettings()

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
        <AppAlert tone="danger">{fetchError ?? 'Unable to load account'}</AppAlert>
      </Box>
    )
  }

  const error = fetchError ?? submitError

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Account Settings
      </Typography>

      {success && <AppAlert tone="success" sx={{ mb: 2 }}>Settings saved.</AppAlert>}
      {error && <AppAlert tone="danger" sx={{ mb: 2 }}>{error}</AppAlert>}

      <AppForm<AccountSettings> defaultValues={data} onSubmit={update}>
        <TabbedFormLayout sections={sections} fields={fields} />
        <FormActions submitLabel="Save" showReset />
      </AppForm>
    </Box>
  )
}
