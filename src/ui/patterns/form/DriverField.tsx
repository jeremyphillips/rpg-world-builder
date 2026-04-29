/**
 * Renders a single field using a patch driver (getValue/setValue).
 * Used when DynamicFormRenderer is in patch mode.
 */
import { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { AppSelect, AppTextField } from '@/ui/primitives';
import type { FieldConfig } from './form.types';
import type { Visibility } from '@/shared/types/visibility';
import { formGridStretchOutlinedSx, useFormLayoutStretch } from './FormLayoutStretchContext';
import { usePatchValidation } from './validation/PatchValidationContext';
import { AppImageUploadField } from '@/ui/primitives';
import { AppJsonPreviewField } from '@/ui/primitives';
import VisibilityField from './VisibilityField';
import OptionPickerField from './OptionPickerField';
import { pickerArrayToFormValue, pickerValueToArray } from './optionPickerBridge';
import type { PatchDriver } from './patchDriver.types';

export type { PatchDriver } from './patchDriver.types';

type DriverFieldProps = {
  field: FieldConfig;
  driver: PatchDriver;
};

/** Resolve patch path: prefer field.path ?? field.name when path exists (e.g. json). */
const getPath = (field: FieldConfig): string =>
  'path' in field ? (field.path ?? field.name) : field.name;

/** When patchBinding exists, use it for get/set; otherwise use direct path lookup. */
function usePatchValue(
  field: FieldConfig,
  driver: PatchDriver
): { value: unknown; onChange: (v: unknown) => void } {
  const path = getPath(field);
  const binding = field.patchBinding;

  if (binding) {
    const value = binding.parse(driver.getValue(binding.domainPath));
    const onChange = (v: unknown) => {
      const current = driver.getValue(binding.domainPath);
      const next = binding.serialize(v, current);
      if (next === undefined && driver.unsetValue) {
        driver.unsetValue(binding.domainPath);
      } else {
        driver.setValue(binding.domainPath, next);
      }
    };
    return { value, onChange };
  }

  const value = driver.getValue(path);
  const onChange = (v: unknown) => {
    if (v === undefined && driver.unsetValue) {
      driver.unsetValue(path);
    } else {
      driver.setValue(path, v);
    }
  };
  return { value, onChange };
}

export default function DriverField({ field, driver }: DriverFieldProps) {
  const stretch = useFormLayoutStretch();
  const stretchColumnSx = stretch
    ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' as const }
    : undefined;
  const path = getPath(field);
  const patchValidation = usePatchValidation();
  const errorMessage = patchValidation?.getError(field.name);
  const { value: boundValue, onChange: boundOnChange } = usePatchValue(field, driver);

  const handleChange = useCallback(
    (value: unknown) => {
      if (field.patchBinding) {
        boundOnChange(value);
      } else {
        driver.setValue(path, value);
      }
      patchValidation?.clearError(field.name);
    },
    [field.patchBinding, field.name, boundOnChange, driver, path, patchValidation],
  );

  const getValueForField = useCallback(
    (p: string) => (field.patchBinding ? boundValue : driver.getValue(p)),
    [field.patchBinding, boundValue, driver],
  );

  const handleBlur = useCallback(() => {
    if (!patchValidation) return;
    patchValidation.validateOne(field, (p) => getValueForField(p));
  }, [patchValidation, field, getValueForField]);

  const displayValue = field.patchBinding ? boundValue : driver.getValue(path);
  const helperText = errorMessage ?? field.helperText;
  const hasError = Boolean(errorMessage);

  const FieldDescription = field.fieldDescription ? (
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
      {field.fieldDescription}
    </Typography>
  ) : null;

  switch (field.type) {
    case 'text':
      return (
        <Box sx={stretchColumnSx}>
          <AppTextField
          label={field.label}
          fullWidth
          sx={stretch && !field.multiline ? formGridStretchOutlinedSx : undefined}
          value={String(displayValue ?? '')}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          required={field.required}
          disabled={field.disabled}
          placeholder={field.placeholder}
          type={field.inputType ?? 'text'}
          helperText={helperText}
          error={hasError}
          multiline={field.multiline}
          rows={field.multiline ? field.rows : undefined}
        />
          {FieldDescription}
        </Box>
      );

    case 'textarea':
      return (
        <Box>
          <AppTextField
            label={field.label}
            fullWidth
            multiline
            rows={field.rows ?? 4}
            value={String(displayValue ?? '')}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            required={field.required}
            disabled={field.disabled}
            placeholder={field.placeholder}
            helperText={helperText}
            error={hasError}
          />
          {FieldDescription}
        </Box>
      );

    case 'select':
      return (
        <Box sx={stretchColumnSx}>
          <AppSelect
            label={field.label}
            options={field.options}
            value={String(displayValue ?? '')}
            onChange={(v) => handleChange(v)}
            onBlur={handleBlur}
            disabled={field.disabled}
            required={field.required}
            placeholder={field.placeholder}
            emptyMenuItemDisabled={Boolean(field.placeholder)}
            error={hasError}
            helperText={helperText || undefined}
            size="medium"
            sx={stretch ? formGridStretchOutlinedSx : undefined}
          />
          {FieldDescription}
        </Box>
      );

    case 'radio':
      return (
        <Box>
          <FormControl disabled={field.disabled} required={field.required} error={hasError}>
            <FormLabel required={field.required}>{field.label}</FormLabel>
            <RadioGroup
              row={field.row}
              value={String(displayValue ?? '')}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
            >
              {field.options.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
            {(helperText || hasError) && (
              <FormHelperText error={hasError}>{helperText}</FormHelperText>
            )}
          </FormControl>
          {FieldDescription}
        </Box>
      );

    case 'checkbox':
      return (
        <Box>
          <FormControl disabled={field.disabled} required={field.required} error={hasError}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(displayValue)}
                  onChange={(e) => handleChange(e.target.checked)}
                />
              }
              label={field.label}
            />
            {(helperText || hasError) && (
              <FormHelperText error={hasError}>{helperText}</FormHelperText>
            )}
          </FormControl>
          {FieldDescription}
        </Box>
      );

    case 'checkboxGroup':
      return (
        <Box>
          <FormControl disabled={field.disabled} required={field.required} error={hasError}>
            <FormLabel required={field.required}>{field.label}</FormLabel>
            <FormGroup row={field.row}>
              {(field.options ?? []).map((opt) => {
                const selected: string[] = Array.isArray(displayValue)
                  ? (displayValue as string[])
                  : [];
                const handleToggle = () => {
                  const next = selected.includes(opt.value)
                    ? selected.filter((v) => v !== opt.value)
                    : [...selected, opt.value];
                  handleChange(next);
                };
                return (
                  <FormControlLabel
                    key={opt.value}
                    control={
                      <Checkbox
                        checked={selected.includes(opt.value)}
                        onChange={handleToggle}
                      />
                    }
                    label={opt.label}
                  />
                );
              })}
            </FormGroup>
            {(helperText || hasError) && (
              <FormHelperText error={hasError}>{helperText}</FormHelperText>
            )}
          </FormControl>
          {FieldDescription}
        </Box>
      );

    case 'imageUpload':
      return (
        <Box>
          <AppImageUploadField
            value={displayValue as string | null | undefined}
            onChange={(v) => handleChange(v)}
            label={field.label}
            disabled={field.disabled}
            maxHeight={field.maxHeight}
            required={field.required}
          />
          {FieldDescription}
        </Box>
      );

    case 'datetime':
      return (
        <Box>
          <AppTextField
            label={field.label}
            fullWidth
            type="datetime-local"
            value={
              (() => {
                const v = displayValue;
                if (!v) return '';
                const d = new Date(v as string);
                return isNaN(d.getTime())
                  ? ''
                  : d.toISOString().slice(0, 16);
              })()
            }
            onChange={(e) =>
              handleChange(e.target.value ? new Date(e.target.value).toISOString() : null)
            }
            onBlur={handleBlur}
            required={field.required}
            disabled={field.disabled}
            helperText={helperText}
            error={hasError}
            InputLabelProps={{ shrink: true }}
          />
          {FieldDescription}
        </Box>
      );

    case 'visibility':
      return (
        <Box>
          <VisibilityField
            value={
              (displayValue as Visibility | undefined) ?? {
                scope: 'public',
                allowCharacterIds: [],
              }
            }
            onChange={(v) => handleChange(v)}
            disabled={field.disabled}
            required={field.required}
            characters={field.characters}
          />
          {FieldDescription}
        </Box>
      );

    case 'json':
      return (
        <Box>
          <DriverJsonField
            field={field}
            path={path}
            driver={driver}
            errorMessage={errorMessage}
            onClearError={() => patchValidation?.clearError(field.name)}
          />
          {FieldDescription}
        </Box>
      );

    case 'staticLabelValue': {
      const staticField = field as Extract<FieldConfig, { type: 'staticLabelValue' }>;
      const raw = String(displayValue ?? '');
      const shown = staticField.formatDisplay ? staticField.formatDisplay(raw) : raw;
      return (
        <Box>
          <Typography variant="body2" component="div">
            <Box component="span" fontWeight={600}>
              {staticField.label}:
            </Box>{' '}
            {shown || '—'}
          </Typography>
          {FieldDescription}
        </Box>
      );
    }

    case 'optionPicker': {
      const fieldTyped = field as Extract<FieldConfig, { type: 'optionPicker' }>;
      const mode = fieldTyped.valueMode ?? 'array';
      const pickerValue = pickerValueToArray(displayValue, mode);
      return (
        <Box>
          <OptionPickerField
            label={field.label}
            options={fieldTyped.options}
            value={pickerValue}
            onChange={(next) => {
              handleChange(pickerArrayToFormValue(next, mode));
            }}
            onBlur={handleBlur}
            maxItems={fieldTyped.maxItems}
            placeholder={field.placeholder}
            disabled={field.disabled}
            emptyMessage={fieldTyped.emptyMessage}
            noResultsMessage={fieldTyped.noResultsMessage}
            renderSelectedAs={fieldTyped.renderSelectedAs}
            helperText={helperText}
            error={hasError}
          />
          {FieldDescription}
        </Box>
      );
    }

    case 'hidden': {
      const value = displayValue;
      if (value == null) return null;
      return (
        <input type="hidden" name={path} value={String(value)} />
      );
    }

    default:
      return null;
  }
}

function initJsonText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  if (typeof value === 'string') return value;
  return '';
}

function DriverJsonField({
  field,
  path,
  driver,
  errorMessage,
  onClearError,
}: {
  field: Extract<FieldConfig, { type: 'json' }>;
  path: string;
  driver: PatchDriver;
  errorMessage?: string;
  onClearError?: () => void;
}) {
  const [text, setText] = useState(() => initJsonText(driver.getValue(path)));

  useEffect(() => {
    setText(initJsonText(driver.getValue(path)));
  }, [path, driver]);

  const handleChange = (next: string) => {
    setText(next);
    onClearError?.();
    if (next.trim().length === 0) {
      if (driver.unsetValue) {
        driver.unsetValue(path);
      } else {
        driver.setValue(path, {});
      }
      return;
    }
    try {
      const parsed = JSON.parse(next);
      driver.setValue(path, parsed);
    } catch {
      // Invalid JSON: do not commit. AppJsonPreviewField shows inline error.
    }
  };

  const helperText = errorMessage ?? field.helperText;

  return (
    <Box>
      <AppJsonPreviewField
        label={field.label}
        value={text}
        onChange={handleChange}
        placeholder={field.placeholder}
        helperText={helperText}
        minRows={field.minRows ?? 4}
        maxRows={field.maxRows ?? 16}
        required={field.required}
        error={Boolean(errorMessage)}
      />
    </Box>
  );
}
