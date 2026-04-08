import TextField from '@mui/material/TextField';

export type EdgeLabelFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function EdgeLabelField({ value, onChange, label = 'Label' }: EdgeLabelFieldProps) {
  return (
    <TextField
      label={label}
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    />
  );
}
