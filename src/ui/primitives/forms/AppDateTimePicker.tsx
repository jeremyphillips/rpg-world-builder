import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export type AppDateTimePickerProps = {
  label: string;
  /** ISO 8601 string, or empty / null when unset */
  value: string | null | undefined;
  onChange: (iso: string | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

/** MUI `DateTimePicker` with Dayjs adapter in a local `LocalizationProvider`. For RHF see `AppFormDateTimePicker`. */
export function AppDateTimePicker({
  label,
  value,
  onChange,
  disabled,
  error,
  helperText,
}: AppDateTimePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(v) => onChange(v?.toISOString() ?? null)}
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth: true,
            size: 'small',
            error: !!error,
            helperText,
          },
        }}
      />
    </LocalizationProvider>
  );
}
