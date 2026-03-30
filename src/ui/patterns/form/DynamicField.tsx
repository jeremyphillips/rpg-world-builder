import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FieldConfig } from './form.types';
import FormTextField from './FormTextField';
import FormSelectField from './FormSelectField'
import FormRadioField from './FormRadioField'
import FormCheckboxField from './FormCheckboxField'
import FormImageUploadField from './FormImageUploadField'
import FormDateTimeField from './FormDateTimeField'
import FormVisibilityField from './FormVisibilityField'
import FormJsonField from './FormJsonField'
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
  return (
    <Box>
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
          <FormTextField
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
          <FormTextField
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
          <FormSelectField
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
          <FormRadioField
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
          <FormCheckboxField
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
          <FormCheckboxField
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
          <FormImageUploadField
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
          <FormDateTimeField
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
          <FormJsonField
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
