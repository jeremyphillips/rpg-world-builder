import { useState } from 'react'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'

export type EditableFieldProps<T> = {
  label: string
  value: T
  onSave: (newValue: T) => Promise<void> | void
  /** How to render the value in display mode */
  renderDisplay: (value: T) => ReactNode
  /** Content when editing; receives save handler, close handler, and saving state. Include a Save button that calls onSave(editedValue). */
  renderEdit: (props: {
    value: T
    onSave: (v: T) => void
    onClose: () => void
    saving: boolean
  }) => ReactNode
  disabled?: boolean
  className?: string
}

/**
 * Core wrapper: shows label + value + edit icon. When edit is clicked,
 * shows renderEdit content with a small Save button; on save, calls onSave then reverts to text view.
 */
export default function EditableField<T>({
  label,
  value,
  onSave,
  renderDisplay,
  renderEdit,
  disabled = false,
  className,
}: EditableFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleClose = () => setIsEditing(false)

  const handleSaveClick = async (newValue: T) => {
    setSaving(true)
    try {
      await Promise.resolve(onSave(newValue))
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (isEditing) {
    return (
      <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexWrap: 'wrap' }}>
          {renderEdit({
            value,
            onSave: handleSaveClick,
            onClose: handleClose,
            saving,
          })}
        </Box>
      </Box>
    )
  }

  return (
    <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Typography variant="body1">{renderDisplay(value)}</Typography>
      </Box>
      {!disabled && (
        <IconButton
          size="small"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${label}`}
          sx={{ mt: 0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  )
}
