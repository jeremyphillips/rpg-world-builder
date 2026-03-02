import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import EditableField from './EditableField'

export type EditableTextFieldProps = {
  label: string
  value: string
  onSave: (newValue: string) => Promise<void> | void
  disabled?: boolean
  className?: string
  multiline?: boolean
  minRows?: number
  helperText?: string
}

export default function EditableTextField({
  label,
  value,
  onSave,
  disabled = false,
  className,
  multiline,
  minRows = 1,
  helperText,
}: EditableTextFieldProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <EditableField<string>
      label={label}
      value={value}
      onSave={onSave}
      renderDisplay={(v) => v || '—'}
      renderEdit={({ onSave: save, onClose, saving }) => (
        <>
          <TextField
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            size="small"
            fullWidth
            multiline={multiline}
            minRows={multiline ? minRows : undefined}
            helperText={helperText}
            sx={{ minWidth: 160, flex: 1 }}
          />
          <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={() => save(local)} disabled={saving}>
            {saving ? '…' : 'Save'}
          </Button>
          <Button size="small" onClick={onClose}>
            Cancel
          </Button>
        </>
      )}
      disabled={disabled}
      className={className}
    />
  )
}
