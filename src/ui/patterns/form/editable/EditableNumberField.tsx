import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import EditableField from './EditableField'

export type EditableNumberFieldProps = {
  label: string
  value: number
  onSave: (newValue: number) => Promise<void> | void
  disabled?: boolean
  className?: string
  /** How to format the value in display mode (e.g. toLocaleString for XP) */
  formatDisplay?: (n: number) => string
  /** Optional helper text shown below the display value */
  description?: string
}

export default function EditableNumberField({
  label,
  value,
  onSave,
  disabled = false,
  className,
  formatDisplay = (n) => String(n),
  description,
}: EditableNumberFieldProps) {
  const [local, setLocal] = useState(String(value))

  useEffect(() => {
    setLocal(String(value))
  }, [value])

  const num = Number(local)
  const isValid = !Number.isNaN(num) && num >= 0

  return (
    <EditableField<number>
      label={label}
      value={value}
      onSave={onSave}
      renderDisplay={(v) => (
        <>
          {formatDisplay(v)}
          {description && (
            <Typography variant="caption" color="text.secondary" display="block">
              {description}
            </Typography>
          )}
        </>
      )}
      renderEdit={({ onSave: save, onClose, saving }) => (
        <>
          <TextField
            type="number"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            size="small"
            inputProps={{ min: 0 }}
            error={!isValid}
            sx={{ minWidth: 100, flex: 1 }}
          />
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => save(isValid ? num : value)}
            disabled={saving || !isValid}
          >
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
