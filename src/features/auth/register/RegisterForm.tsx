import { AppForm, DynamicFormRenderer, type FieldConfig } from '@/ui/patterns'
import type { RegisterFormData } from './register.types'

interface RegisterFormProps {
  inviteToken?: string
  onSubmit: (data: RegisterFormData) => void
  submitLabel?: string
}

const fields: FieldConfig[] = [
  { type: 'text', name: 'username', label: 'Username', required: true, placeholder: 'Choose a username' },
  { type: 'text', name: 'firstName', label: 'First Name', required: true, placeholder: 'First name' },
  { type: 'text', name: 'lastName', label: 'Last Name', required: true, placeholder: 'Last name' },
  { type: 'text', name: 'password', label: 'Password', inputType: 'password', required: true, placeholder: 'Create a password' },
  { type: 'hidden', name: 'inviteToken' },
]

export default function RegisterForm({ inviteToken = '', onSubmit, submitLabel = 'Create Account' }: RegisterFormProps) {
  const defaultValues: RegisterFormData = {
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    inviteToken,
  }

  return (
    <AppForm<RegisterFormData> defaultValues={defaultValues} onSubmit={onSubmit}>
      <DynamicFormRenderer fields={fields} />
      <FormActions submitLabel={submitLabel} />
    </AppForm>
  )
}
