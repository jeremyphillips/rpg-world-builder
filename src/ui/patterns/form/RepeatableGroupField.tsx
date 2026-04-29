import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { FieldConfig, FormLayoutNode, RepeatableGroupLayoutConfig } from './form.types';
import DynamicField from './DynamicField';
import DriverField from './DriverField';
import type { PatchDriver } from './DriverField';
import { FormLayoutStretchProvider } from './FormLayoutStretchContext';
import { chunkFormLayoutNodes, getAutoGroupWidth } from './formLayoutChunking';

function joinFieldPrefix(rowPrefix: string, fieldName: string): string {
  return `${rowPrefix}.${fieldName}`;
}

function prefixFieldConfig(field: FieldConfig, rowPrefix: string): FieldConfig {
  return { ...field, name: joinFieldPrefix(rowPrefix, field.name) } as FieldConfig;
}

/** Build one empty row object from layout defaults (nested repeatables → []). */
export function buildDefaultRowFromLayout(children: FormLayoutNode[]): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const child of children) {
    if ('type' in child && child.type === 'custom') {
      continue;
    }
    if ('type' in child && child.type === 'repeatable-group') {
      row[child.name] = [];
      continue;
    }
    const f = child as FieldConfig;
    if (f.type === 'hidden') continue;
    setAtRelativePath(row, f.name, defaultValueForFieldConfig(f));
  }
  return row;
}

function setAtRelativePath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = cur[p];
    if (next == null || typeof next !== 'object' || Array.isArray(next)) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function defaultValueForFieldConfig(f: FieldConfig): unknown {
  if (f.defaultValue !== undefined) return f.defaultValue;
  if (
    'defaultFromOptions' in f &&
    f.defaultFromOptions === 'first' &&
    'options' in f &&
    f.options &&
    f.options.length > 0
  ) {
    return f.options[0].value;
  }
  if (f.type === 'checkbox') return false;
  if (f.type === 'checkboxGroup' || f.type === 'optionPicker') return [];
  return '';
}

type RepeatableGroupFieldProps = {
  config: RepeatableGroupLayoutConfig;
  /** RHF / patch array path (e.g. `effectGroups`, `effectGroups.0.effects`). */
  arrayPath: string;
  usePatchDriver: boolean;
  patchDriver: PatchDriver | null;
};

function RepeatableGroupFieldRHF({ config, arrayPath }: Omit<RepeatableGroupFieldProps, 'usePatchDriver' | 'patchDriver'>) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: arrayPath as never,
  });

  const defaultRow = config.defaultItem ?? buildDefaultRowFromLayout(config.children);

  return (
    <Stack spacing={2}>
      {config.label ? (
        <Typography variant="subtitle2" color="text.secondary">
          {config.label}
        </Typography>
      ) : null}
      {fields.map((row, index) => {
        const rowPrefix = joinFieldPrefix(arrayPath, String(index));
        return (
          <Box
            key={row.id}
            sx={(theme) => ({
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            })}
          >
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight={600}>
                  {config.itemLabel} {index + 1}
                </Typography>
                <Button type="button" size="small" color="error" variant="outlined" onClick={() => remove(index)}>
                  Remove
                </Button>
              </Stack>
              <FormLayoutRow
                childrenNodes={config.children}
                rowPrefix={rowPrefix}
                usePatchDriver={false}
                patchDriver={null}
              />
            </Stack>
          </Box>
        );
      })}
      <Button type="button" size="small" variant="outlined" onClick={() => append(defaultRow)}>
        Add {config.itemLabel}
      </Button>
    </Stack>
  );
}

function RepeatableGroupFieldPatch({
  config,
  arrayPath,
  patchDriver,
}: Omit<RepeatableGroupFieldProps, 'usePatchDriver'> & { patchDriver: PatchDriver }) {
  const getRows = (): unknown[] => {
    if (config.patchBinding) {
      const domainVal = patchDriver.getValue(config.patchBinding.domainPath);
      const parsed = config.patchBinding.parse(domainVal);
      return Array.isArray(parsed) ? parsed : [];
    }
    const raw = patchDriver.getValue(arrayPath);
    return Array.isArray(raw) ? raw : [];
  };

  const rows = getRows();

  const defaultRow = config.defaultItem ?? buildDefaultRowFromLayout(config.children);

  const setRows = (next: unknown[]) => {
    if (config.patchBinding) {
      const cur = patchDriver.getValue(config.patchBinding.domainPath);
      const serialized = config.patchBinding.serialize(next, cur);
      if (serialized === undefined && patchDriver.unsetValue) {
        patchDriver.unsetValue(config.patchBinding.domainPath);
      } else {
        patchDriver.setValue(config.patchBinding.domainPath, serialized);
      }
    } else {
      patchDriver.setValue(arrayPath, next);
    }
  };

  return (
    <Stack spacing={2}>
      {config.label ? (
        <Typography variant="subtitle2" color="text.secondary">
          {config.label}
        </Typography>
      ) : null}
      {rows.map((_row, index) => {
        const rowPrefix = joinFieldPrefix(arrayPath, String(index));
        return (
          <Box
            key={`${arrayPath}-${index}`}
            sx={(theme) => ({
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            })}
          >
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight={600}>
                  {config.itemLabel} {index + 1}
                </Typography>
                <Button
                  type="button"
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    const next = rows.filter((_, i) => i !== index);
                    setRows(next);
                  }}
                >
                  Remove
                </Button>
              </Stack>
              <FormLayoutRow
                childrenNodes={config.children}
                rowPrefix={rowPrefix}
                usePatchDriver
                patchDriver={patchDriver}
              />
            </Stack>
          </Box>
        );
      })}
      <Button
        type="button"
        size="small"
        variant="outlined"
        onClick={() => setRows([...rows, defaultRow])}
      >
        Add {config.itemLabel}
      </Button>
    </Stack>
  );
}

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

function renderLeafField(
  field: FieldConfig,
  usePatchDriver: boolean,
  patchDriver: PatchDriver | null,
): ReactNode {
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

function FormLayoutRow({
  childrenNodes,
  rowPrefix,
  usePatchDriver,
  patchDriver,
}: {
  childrenNodes: FormLayoutNode[];
  rowPrefix: string;
  usePatchDriver: boolean;
  patchDriver: PatchDriver | null;
}) {
  const chunks = chunkFormLayoutNodes(childrenNodes);

  return (
    <Stack spacing={2}>
      {chunks.map((chunk, chunkIdx) => {
        if (chunk.type === 'custom') {
          return (
            <Box key={`${chunk.node.key}-${chunkIdx}`}>
              {chunk.node.render({
                rowPrefix,
                usePatchDriver,
                patchDriver,
              })}
            </Box>
          );
        }
        if (chunk.type === 'repeatable') {
          const nestedPath = joinFieldPrefix(rowPrefix, chunk.group.name);
          return (
            <RepeatableGroupField
              key={`${nestedPath}-rg-${chunkIdx}`}
              config={chunk.group}
              arrayPath={nestedPath}
              usePatchDriver={usePatchDriver}
              patchDriver={patchDriver}
            />
          );
        }
        if (chunk.type === 'single') {
          const field = prefixFieldConfig(chunk.field, rowPrefix);
          return renderLeafField(field, usePatchDriver, patchDriver);
        }
        const { fields: groupFields, direction, label, helperText, spacing: groupSpacing } = chunk;
        const groupKey = groupFields[0].group!.id;
        const spacingVal = groupSpacing ?? 2;
        const prefixed = groupFields.map((f) => prefixFieldConfig(f, rowPrefix));
        const groupContent =
          direction === 'column' ? (
            <Stack direction="column" spacing={spacingVal}>
              {prefixed.map((f) => renderLeafField(f, usePatchDriver, patchDriver))}
            </Stack>
          ) : (
            <FormLayoutStretchProvider value>
              <Grid container spacing={spacingVal} sx={{ alignItems: 'stretch' }}>
                {prefixed.map((f) => {
                  const width = f.width ?? getAutoGroupWidth(prefixed.length);
                  return (
                    <Grid
                      key={f.name}
                      size={{ xs: width }}
                      sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
                    >
                      <GridFieldCell field={f} usePatchDriver={usePatchDriver} patchDriver={patchDriver} />
                    </Grid>
                  );
                })}
              </Grid>
            </FormLayoutStretchProvider>
          );
        const hasHeader = (label != null && label !== '') || (helperText != null && helperText !== '');
        const hasGroupHelper = helperText != null && helperText !== '';
        return (
          <Box key={`${groupKey}-${chunkIdx}`}>
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

export default function RepeatableGroupField({
  config,
  arrayPath,
  usePatchDriver,
  patchDriver,
}: RepeatableGroupFieldProps) {
  if (usePatchDriver && patchDriver) {
    return <RepeatableGroupFieldPatch config={config} arrayPath={arrayPath} patchDriver={patchDriver} />;
  }
  return <RepeatableGroupFieldRHF config={config} arrayPath={arrayPath} />;
}
