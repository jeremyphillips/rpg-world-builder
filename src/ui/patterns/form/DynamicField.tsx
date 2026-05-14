import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FieldConfig } from './form.types';
import { useFormLayoutStretch } from './FormLayoutStretchContext';
import AppFormTextField from './AppFormTextField';
import AppFormSelect from './AppFormSelect'
import AppFormRadioGroup from './AppFormRadioGroup'
import AppFormCheckbox from './AppFormCheckbox'
import AppFormImageUploadField from './AppFormImageUploadField'
import AppFormDateTimePicker from './AppFormDateTimePicker'
import FormVisibilityField from './FormVisibilityField'
import AppFormJsonPreviewField from './AppFormJsonPreviewField'
import FormOptionPickerField from './FormOptionPickerField'

type DynamicFieldProps = {
  field: FieldConfig;
};

function StaticLabelValueField({
  field,
}: {
  field: Extract<FieldConfig, { type: 'staticLabelValue' }>;
}) {
  const raw = useWatch({ name: field.name });
  const text = typeof raw === 'string' ? raw : raw != null ? String(raw) : '';
  const shown = field.formatDisplay ? field.formatDisplay(text) : text;
  return (
    <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
      <Typography component="span" variant="body2" fontWeight={600}>
        {field.label}:
      </Typography>
      <Typography component="span" variant="body2" color="text.primary">
        {shown || '—'}
      </Typography>
    </Stack>
  );
}

function FieldWithDescription({
  field,
  children,
}: {
  field: FieldConfig;
  children: React.ReactNode;
}) {
  const stretch = useFormLayoutStretch();
  return (
    <Box
      sx={
        stretch
          ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
          : undefined
      }
    >
      {children}
      {field.fieldDescription && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {field.fieldDescription}
        </Typography>
      )}
    </Box>
  );
}

export default function DynamicField({ field }: DynamicFieldProps) {
  const { register } = useFormContext();

  switch (field.type) {
    case 'text':
      return (
        <FieldWithDescription field={field}>
          <AppFormTextField
          name={field.name}
          label={field.label}
          required={field.required}
          disabled={field.disabled}
          placeholder={field.placeholder}
          type={field.inputType}
          rules={field.rules}
        />
        </FieldWithDescription>
      );

    case 'textarea':
      return (
        <FieldWithDescription field={field}>
          <AppFormTextField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={field.disabled}
            placeholder={field.placeholder}
            multiline
            rows={field.rows}
            rules={field.rules}
          />
        </FieldWithDescription>
      );

    case 'select':
      return (
        <FieldWithDescription field={field}>
          <AppFormSelect
            name={field.name}
            label={field.label}
            options={field.options}
            required={field.required}
            disabled={field.disabled}
            placeholder={field.placeholder}
          />
        </FieldWithDescription>
      );

    case 'radio':
      return (
        <FieldWithDescription field={field}>
          <AppFormRadioGroup
            name={field.name}
            label={field.label}
            options={field.options}
            required={field.required}
            disabled={field.disabled}
            row={field.row}
          />
        </FieldWithDescription>
      );

    case 'checkbox':
      return (
        <FieldWithDescription field={field}>
          <AppFormCheckbox
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={field.disabled}
            helperText={field.helperText}
          />
        </FieldWithDescription>
      );

    case 'checkboxGroup':
      return (
        <FieldWithDescription field={field}>
          <AppFormCheckbox
            name={field.name}
            label={field.label}
            options={field.options}
            required={field.required}
            disabled={field.disabled}
            row={field.row}
            helperText={field.helperText}
          />
        </FieldWithDescription>
      );

    case 'imageUpload':
      return (
        <FieldWithDescription field={field}>
          <AppFormImageUploadField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={field.disabled}
            maxHeight={field.maxHeight}
          />
        </FieldWithDescription>
      );

    case 'datetime':
      return (
        <FieldWithDescription field={field}>
          <AppFormDateTimePicker
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={field.disabled}
          />
        </FieldWithDescription>
      );

    case 'visibility':
      return (
        <FieldWithDescription field={field}>
          <FormVisibilityField
            name={field.name}
            required={field.required}
            disabled={field.disabled}
            characters={field.characters}
            allowHidden={field.allowHidden}
          />
        </FieldWithDescription>
      );

    case 'json':
      return (
        <FieldWithDescription field={field}>
          <AppFormJsonPreviewField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={field.disabled}
            placeholder={field.placeholder}
            helperText={field.helperText}
            minRows={field.minRows}
            maxRows={field.maxRows}
          />
        </FieldWithDescription>
      );

    case 'optionPicker':
      return (
        <FieldWithDescription field={field}>
          <FormOptionPickerField
            name={field.name}
            label={field.label}
            options={field.options}
            valueMode={field.valueMode}
            maxItems={field.maxItems}
            placeholder={field.placeholder}
            disabled={field.disabled}
            emptyMessage={field.emptyMessage}
            noResultsMessage={field.noResultsMessage}
            renderSelectedAs={field.renderSelectedAs}
            helperText={field.helperText}
            rules={field.rules}
          />
        </FieldWithDescription>
      );

    case 'staticLabelValue':
      return (
        <FieldWithDescription field={field}>
          <StaticLabelValueField field={field as Extract<FieldConfig, { type: 'staticLabelValue' }>} />
        </FieldWithDescription>
      );

    case 'hidden':
      return <input type="hidden" {...register(field.name)} />;
  }
}
