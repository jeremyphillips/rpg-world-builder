import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { FieldConfig } from './form.types';
import DynamicField from './DynamicField';
import DriverField from './DriverField';
import type { PatchDriver } from './DriverField';

export type FormDriver =
  | { kind: 'rhf' }
  | {
      kind: 'patch';
      getValue: (path: string) => unknown;
      setValue: (path: string, value: unknown) => void;
      unsetValue?: (path: string) => void;
    };

type DynamicFormRendererProps = {
  fields: FieldConfig[];
  spacing?: number;
  /**
   * When omitted or kind: 'rhf', uses react-hook-form (FormProvider must wrap).
   * When kind: 'patch', uses driver.getValue/setValue instead.
   */
  driver?: FormDriver;
};

function getAutoGroupWidth(count: number): number {
  if (count <= 1) return 12;
  return Math.floor(12 / count);
}

type Chunk =
  | { type: 'single'; field: FieldConfig }
  | {
      type: 'group';
      fields: FieldConfig[];
      direction: 'row' | 'column';
      label?: string;
      helperText?: string;
      spacing?: number;
    };

function chunkFields(fields: FieldConfig[]): Chunk[] {
  const chunks: Chunk[] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.type === 'hidden' || !f.group) {
      chunks.push({ type: 'single', field: f });
      i++;
      continue;
    }
    const groupId = f.group.id;
    const groupFields: FieldConfig[] = [];
    const direction = f.group.direction ?? 'row';
    const label = f.group.label;
    const helperText = f.group.helperText;
    const spacing = f.group.spacing;
    while (i < fields.length && fields[i].group?.id === groupId) {
      groupFields.push(fields[i]);
      i++;
    }
    chunks.push({ type: 'group', fields: groupFields, direction, label, helperText, spacing });
  }
  return chunks;
}

function renderField(
  field: FieldConfig,
  usePatchDriver: boolean,
  patchDriver: PatchDriver | null
): React.ReactNode {
  if (field.type === 'hidden') {
    return usePatchDriver && patchDriver ? (
      <DriverField key={field.name} field={field} driver={patchDriver} />
    ) : (
      <DynamicField key={field.name} field={field} />
    );
  }
  const content =
    usePatchDriver && patchDriver ? (
      <DriverField field={field} driver={patchDriver} />
    ) : (
      <DynamicField field={field} />
    );
  return (
    <Box key={field.name}>
      {content}
    </Box>
  );
}

/**
 * Pure rendering layer: takes a FieldConfig[] and renders the
 * correct field primitive for each entry. No business logic,
 * no fetching, no validation rules beyond what FieldConfig carries.
 */
export default function DynamicFormRenderer({
  fields,
  spacing = 3,
  driver,
}: DynamicFormRendererProps) {
  const usePatchDriver = driver?.kind === 'patch';
  const patchDriver = usePatchDriver ? (driver as PatchDriver) : null;
  const chunks = chunkFields(fields);

  return (
    <Stack spacing={spacing}>
      {chunks.map((chunk) => {
        if (chunk.type === 'single') {
          const field = chunk.field;
          if (field.type === 'hidden') {
            return renderField(field, !!usePatchDriver, patchDriver);
          }
          return renderField(field, !!usePatchDriver, patchDriver);
        }
        const { fields: groupFields, direction, label, helperText, spacing: groupSpacing } = chunk;
        const groupKey = groupFields[0].group!.id;
        const spacingVal = groupSpacing ?? 2;
        const groupContent =
          direction === 'column' ? (
            <Stack direction="column" spacing={spacingVal}>
              {groupFields.map((f) => renderField(f, !!usePatchDriver, patchDriver))}
            </Stack>
          ) : (
            <Grid container spacing={spacingVal}>
              {groupFields.map((f) => {
                const width = f.width ?? getAutoGroupWidth(groupFields.length);
                return (
                  <Grid key={f.name} size={{ xs: width }}>
                    {renderField(f, !!usePatchDriver, patchDriver)}
                  </Grid>
                );
              })}
            </Grid>
          );
        const hasHeader = (label != null && label !== '') || (helperText != null && helperText !== '');
        return (
          <Box key={groupKey}>
            {hasHeader && (
              <Box sx={{ mb: 1 }}>
                {label != null && label !== '' && (
                  <Typography variant="subtitle2" color="text.secondary">
                    {label}
                  </Typography>
                )}
                {helperText != null && helperText !== '' && (
                  <FormHelperText sx={{ mt: 0 }}>{helperText}</FormHelperText>
                )}
              </Box>
            )}
            {groupContent}
          </Box>
        );
      })}
    </Stack>
  );
}
