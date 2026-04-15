import { AppTextField } from '@/ui/patterns/form';

export type EdgeLabelFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function EdgeLabelField({ value, onChange, label = 'Label' }: EdgeLabelFieldProps) {
  return (
    <AppTextField
      label={label}
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    />
  );
}
