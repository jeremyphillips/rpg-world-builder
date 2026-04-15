import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { FieldConfig, FormLayoutNode } from './form.types';
import DynamicField from './DynamicField';
import DriverField from './DriverField';
import type { PatchDriver } from './DriverField';
import { FormLayoutStretchProvider } from './FormLayoutStretchContext';
import RepeatableGroupField from './RepeatableGroupField';

export type FormDriver =
  | { kind: 'rhf' }
  | {
      kind: 'patch';
      getValue: (path: string) => unknown;
      setValue: (path: string, value: unknown) => void;
      unsetValue?: (path: string) => void;
    };

type DynamicFormRendererProps = {
  fields: FormLayoutNode[];
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
    }
  | { type: 'repeatable'; group: Extract<FormLayoutNode, { type: 'repeatable-group' }> };

function chunkFields(fields: FormLayoutNode[]): Chunk[] {
  const chunks: Chunk[] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if ('type' in f && f.type === 'repeatable-group') {
      chunks.push({ type: 'repeatable', group: f });
      i++;
      continue;
    }
    const fc = f as FieldConfig;
    if (fc.type === 'hidden' || !fc.group) {
      chunks.push({ type: 'single', field: fc });
      i++;
      continue;
    }
    const groupId = fc.group!.id;
    const groupFields: FieldConfig[] = [];
    const direction = fc.group.direction ?? 'row';
    const label = fc.group.label;
    const helperText = fc.group.helperText;
    const spacing = fc.group.spacing;
    while (i < fields.length) {
      const g = fields[i] as FieldConfig;
      if ('type' in g && g.type === 'repeatable-group') break;
      if (!g.group || g.group.id !== groupId) break;
      groupFields.push(g);
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

/** Fills the grid cell so nested `FieldWithDescription` + outlined fields can stretch to row height. */
function GridFieldCell({
  field,
  usePatchDriver,
  patchDriver,
}: {
  field: FieldConfig;
  usePatchDriver: boolean;
  patchDriver: PatchDriver | null;
}) {
  const content =
    usePatchDriver && patchDriver ? (
      <DriverField field={field} driver={patchDriver} />
    ) : (
      <DynamicField field={field} />
    );
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{content}</Box>
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
        if (chunk.type === 'repeatable') {
          return (
            <RepeatableGroupField
              key={chunk.group.name}
              config={chunk.group}
              arrayPath={chunk.group.name}
              usePatchDriver={!!usePatchDriver}
              patchDriver={patchDriver}
            />
          );
        }
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
            <FormLayoutStretchProvider value>
              <Grid container spacing={spacingVal} sx={{ alignItems: 'stretch' }}>
                {groupFields.map((f) => {
                  const width = f.width ?? getAutoGroupWidth(groupFields.length);
                  return (
                    <Grid
                      key={f.name}
                      size={{ xs: width }}
                      sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
                    >
                      <GridFieldCell field={f} usePatchDriver={!!usePatchDriver} patchDriver={patchDriver} />
                    </Grid>
                  );
                })}
              </Grid>
            </FormLayoutStretchProvider>
          );
        const hasHeader = (label != null && label !== '') || (helperText != null && helperText !== '');
        const hasGroupHelper = helperText != null && helperText !== '';
        return (
          <Box
            key={groupKey}
            sx={(theme) => ({
              pb: 4,
              borderBottom: `1px solid ${theme.palette.divider}`,
            })}
          >
            {hasHeader && (
              <Box sx={{ mb: 1 }}>
                {label != null && label !== '' && (
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: hasGroupHelper ? 0.5 : 2 }}
                  >
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
