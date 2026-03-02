import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

type JsonPreviewFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  helperText?: string;
  minRows?: number;
  maxRows?: number;
  size?: 'small' | 'medium';
  showInsertExample?: boolean;
  insertExampleLabel?: string;
};

const JsonPreviewField = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  minRows = 4,
  maxRows = 16,
  size = 'small',
  showInsertExample,
  insertExampleLabel = 'Insert example',
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
      <TextField
        label={label}
        multiline
        minRows={minRows}
        maxRows={maxRows}
        fullWidth
        size={size}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        error={!!jsonError}
        helperText={jsonError ?? helperText}
        slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 13 } } }}
      />
      {showButton && (
        <Button
          size="small"
          variant="text"
          sx={{ mt: 0.5 }}
          onClick={() => onChange(placeholder!)}
        >
          {insertExampleLabel}
        </Button>
      )}
    </Box>
  );
};

export default JsonPreviewField;
