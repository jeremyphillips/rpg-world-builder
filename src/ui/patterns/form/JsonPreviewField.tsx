import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { AppTextField } from './AppTextField';

type JsonPreviewFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  minRows?: number;
  maxRows?: number;
  size?: 'small' | 'medium';
  showInsertExample?: boolean;
  insertExampleLabel?: string;
  required?: boolean;
  error?: boolean;
};

const JsonPreviewField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  helperText,
  minRows = 4,
  maxRows = 16,
  size = 'small',
  showInsertExample,
  insertExampleLabel = 'Insert example',
  required = false,
  error = false,
}: JsonPreviewFieldProps) => {
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (value.trim().length === 0) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }, [value]);

  const showButton =
    showInsertExample !== undefined ? showInsertExample && !!placeholder : !!placeholder;

  return (
    <Box>
      <AppTextField
        label={label}
        required={required}
        multiline
        minRows={minRows}
        maxRows={maxRows}
        fullWidth
        size={size}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        error={error || !!jsonError}
        helperText={jsonError ?? helperText}
        slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 13 } } }}
      />
      {showButton && (
        <Button
          size="small"
          variant="text"
          sx={{ mt: 0.5 }}
          disabled={disabled}
          onClick={() => onChange(placeholder!)}
        >
          {insertExampleLabel}
        </Button>
      )}
    </Box>
  );
};

export default JsonPreviewField;
