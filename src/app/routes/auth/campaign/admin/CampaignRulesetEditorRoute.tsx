import { useCallback, useEffect, useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { JsonPreviewField } from '@/ui/patterns';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import {
  getCampaignRulesetPatch,
  saveCampaignRulesetPatch,
  createDefaultCampaignRulesetPatch,
  USE_DB_RULESET_PATCHES,
} from '@/features/mechanics/domain/core/rules/campaignRulesetRepo';
import { getSystemRuleset, systemCatalog } from '@/features/mechanics/domain/core/rules/systemCatalog';
import { resolveCampaignRuleset } from '@/features/mechanics/domain/core/rules/resolveCampaignRuleset';
import { normalizeCampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/normalizeCampaignRulesetPatch';
import type { CampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/ruleset.types';
import type { ContentPolicy, MulticlassingRuleSet } from '@/shared/types';
import type { ValidationError } from '@/features/mechanics/domain/core/rules/validateCampaignRulesetPatch';
import { AppAlert } from '@/ui/primitives';

// ---------------------------------------------------------------------------
// Catalog data for content editing
// ---------------------------------------------------------------------------

type CatalogItem = { id: string; name: string };

const CLASS_ITEMS: CatalogItem[] = Object.values(systemCatalog.classesById)
  .map(c => ({ id: c.id, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const RACE_ITEMS: CatalogItem[] = Object.values(systemCatalog.racesById)
  .map(r => ({ id: r.id, name: r.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ContentFields = {
  classesPolicy: ContentPolicy;
  classesIds: string[];
  racesPolicy: ContentPolicy;
  racesIds: string[];
};

type McFields = {
  enabled: boolean;
  minLevelToMulticlass: number;
  maxClasses: string;
  xpMode: 'shared' | 'per_class';
};

const ENTRY_REQ_EXAMPLE = JSON.stringify(
  {
    wizard: { anyOf: [{ all: [{ ability: 'intelligence', min: 13 }] }] },
  },
  null,
  2,
);

function getContentDefaults(patch: CampaignRulesetPatch): ContentFields {
  const c = patch.content as Record<string, { policy?: string; ids?: string[] }> | undefined;
  return {
    classesPolicy: (c?.classes?.policy as ContentPolicy) ?? 'all_except',
    classesIds: c?.classes?.ids ?? [],
    racesPolicy: (c?.races?.policy as ContentPolicy) ?? 'all_except',
    racesIds: c?.races?.ids ?? [],
  };
}

function getMcDefaults(patch: CampaignRulesetPatch): McFields {
  const d = patch.mechanics?.progression?.multiclassing?.default as
    | Partial<MulticlassingRuleSet>
    | undefined;
  return {
    enabled: d?.enabled ?? true,
    minLevelToMulticlass: d?.minLevelToMulticlass ?? 2,
    maxClasses: d?.maxClasses != null ? String(d.maxClasses) : '',
    xpMode: d?.xpMode ?? 'shared',
  };
}

function getEntryReqsJson(patch: CampaignRulesetPatch): string {
  const map = (patch.mechanics?.progression?.multiclassing?.default as
    | Partial<MulticlassingRuleSet>
    | undefined)?.entryRequirementsByTargetClass;
  return map && Object.keys(map).length > 0
    ? JSON.stringify(map, null, 2)
    : '';
}

function buildContentPatch(
  cf: ContentFields,
): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  let hasKeys = false;

  if (cf.classesPolicy === 'only' || cf.classesIds.length > 0) {
    result.classes = { policy: cf.classesPolicy, ids: cf.classesIds };
    hasKeys = true;
  }
  if (cf.racesPolicy === 'only' || cf.racesIds.length > 0) {
    result.races = { policy: cf.racesPolicy, ids: cf.racesIds };
    hasKeys = true;
  }

  return hasKeys ? result : undefined;
}

function buildPatchFromForm(
  base: CampaignRulesetPatch,
  fields: McFields,
  contentFields: ContentFields,
  entryReqsJson: string,
): CampaignRulesetPatch {
  let entryReqs: Record<string, unknown> | undefined;
  if (entryReqsJson.trim().length > 0) {
    entryReqs = JSON.parse(entryReqsJson);
  }

  const contentPatch = buildContentPatch(contentFields);

  return {
    ...base,
    ...(contentPatch ? { content: { ...base.content, ...contentPatch } } : {}),
    mechanics: {
      ...base.mechanics,
      progression: {
        ...(base.mechanics?.progression ?? {}),
        multiclassing: {
          ...(base.mechanics?.progression?.multiclassing ?? {}),
          default: {
            enabled: fields.enabled,
            minLevelToMulticlass: fields.minLevelToMulticlass,
            ...(fields.maxClasses !== '' ? { maxClasses: Number(fields.maxClasses) } : {}),
            xpMode: fields.xpMode,
            ...(entryReqs ? { entryRequirementsByTargetClass: entryReqs } : {}),
          },
        },
      },
    },
  } as CampaignRulesetPatch;
}

// ---------------------------------------------------------------------------
// Content rule editor sub-component
// ---------------------------------------------------------------------------

function ContentRuleEditor({
  label,
  items,
  policy,
  selectedIds,
  onPolicyChange,
  onToggleId,
  onSelectAll,
  onClear,
}: {
  label: string;
  items: CatalogItem[];
  policy: ContentPolicy;
  selectedIds: string[];
  onPolicyChange: (p: ContentPolicy) => void;
  onToggleId: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const policyLabel = policy === 'all_except'
    ? 'Allow all except checked'
    : 'Allow only checked';

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>

      <TextField
        select
        size="small"
        value={policy}
        onChange={e => onPolicyChange(e.target.value as ContentPolicy)}
        sx={{ mb: 1.5, minWidth: 240 }}
        label="Policy"
        helperText={policyLabel}
      >
        <MenuItem value="all_except">Allow all except…</MenuItem>
        <MenuItem value="only">Allow only…</MenuItem>
      </TextField>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button size="small" variant="text" onClick={onSelectAll}>Select all</Button>
        <Button size="small" variant="text" onClick={onClear}>Clear</Button>
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {items.map(item => (
          <FormControlLabel
            key={item.id}
            sx={{ minWidth: 160 }}
            control={
              <Checkbox
                size="small"
                checked={selectedSet.has(item.id)}
                onChange={() => onToggleId(item.id)}
              />
            }
            label={<Typography variant="body2">{item.name}</Typography>}
          />
        ))}
      </Box>

      {policy === 'only' && selectedIds.length === 0 && (
        <AppAlert tone="warning" sx={{ mt: 1 }}>
          No items selected — nothing will be allowed.
        </AppAlert>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CampaignRulesetEditorRoute() {
  const { campaignId } = useActiveCampaign();

  const [patch, setPatch] = useState<CampaignRulesetPatch | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [contentFields, setContentFields] = useState<ContentFields>({
    classesPolicy: 'all_except',
    classesIds: [],
    racesPolicy: 'all_except',
    racesIds: [],
  });

  const [fields, setFields] = useState<McFields>({
    enabled: true,
    minLevelToMulticlass: 2,
    maxClasses: '',
    xpMode: 'shared',
  });
  const [entryReqsJson, setEntryReqsJson] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ---- Load patch on mount ----
  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    setLoadError(null);
    getCampaignRulesetPatch(campaignId)
      .then(loaded => {
        if (loaded) {
          setPatch(loaded);
          setIsNew(false);
          setContentFields(getContentDefaults(loaded));
          setFields(getMcDefaults(loaded));
          setEntryReqsJson(getEntryReqsJson(loaded));
        } else {
          const draft = createDefaultCampaignRulesetPatch(campaignId);
          setPatch(draft);
          setIsNew(true);
          setContentFields(getContentDefaults(draft));
          setFields(getMcDefaults(draft));
          setEntryReqsJson('');
        }
      })
      .catch(err => {
        setLoadError((err as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [campaignId]);

  // ---- Resolved preview ----
  const resolved = useMemo(() => {
    if (!patch) return null;
    try {
      const draft = buildPatchFromForm(patch, fields, contentFields, entryReqsJson || '{}');
      const normalized = normalizeCampaignRulesetPatch(draft);
      const system = getSystemRuleset(normalized.systemId);
      const full = resolveCampaignRuleset(system, normalized);
      return full.mechanics.progression.multiclassing.default;
    } catch {
      return null;
    }
  }, [patch, fields, contentFields, entryReqsJson]);

  const hasJsonError = useMemo(() => {
    const trimmed = entryReqsJson.trim();
    if (trimmed.length === 0) return false;
    try { JSON.parse(trimmed); return false; } catch { return true; }
  }, [entryReqsJson]);

  // ---- Content field change ----
  const updateContentField = useCallback(<K extends keyof ContentFields>(key: K, value: ContentFields[K]) => {
    setContentFields(prev => ({ ...prev, [key]: value }));
    setSuccess(false);
    setValidationErrors([]);
  }, []);

  const toggleContentId = useCallback((
    idsKey: 'classesIds' | 'racesIds',
    id: string,
  ) => {
    setContentFields(prev => {
      const current = prev[idsKey];
      const next = current.includes(id)
        ? current.filter(v => v !== id)
        : [...current, id];
      return { ...prev, [idsKey]: next };
    });
    setSuccess(false);
    setValidationErrors([]);
  }, []);

  // ---- Field change ----
  const updateField = useCallback(<K extends keyof McFields>(key: K, value: McFields[K]) => {
    setFields(prev => ({ ...prev, [key]: value }));
    setSuccess(false);
    setValidationErrors([]);
  }, []);

  // ---- Save ----
  const handleSave = useCallback(async () => {
    if (!patch) return;
    if (hasJsonError) return;

    setSaving(true);
    setSuccess(false);
    setValidationErrors([]);

    try {
      const draft = buildPatchFromForm(patch, fields, contentFields, entryReqsJson || '{}');
      const result = await saveCampaignRulesetPatch(draft);

      if (!result.validation.ok) {
        setValidationErrors(result.validation.errors);
      } else {
        setPatch(result.patch);
        setIsNew(false);
        setContentFields(getContentDefaults(result.patch));
        setFields(getMcDefaults(result.patch));
        setEntryReqsJson(getEntryReqsJson(result.patch));
        setSuccess(true);
      }
    } catch (e) {
      setValidationErrors([{
        path: '',
        code: 'UNKNOWN',
        message: (e as Error).message,
      }]);
    } finally {
      setSaving(false);
    }
  }, [patch, fields, contentFields, entryReqsJson, hasJsonError]);

  // ---- Render ----

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError || !patch) {
    return (
      <Box>
        <AppAlert tone="danger">{loadError ?? 'Could not load campaign ruleset.'}</AppAlert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Ruleset Editor
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Editing campaign patch <strong>{patch._id}</strong> (system: {patch.systemId})
      </Typography>

      {isNew && (
        <AppAlert tone="info" sx={{ mb: 2 }}>
          No ruleset patch exists yet for this campaign. Changes will be saved when you click Save.
        </AppAlert>
      )}

      {!USE_DB_RULESET_PATCHES && (
        <AppAlert tone="warning" sx={{ mb: 2 }}>
          In-memory mode — changes won't survive a full page reload.
        </AppAlert>
      )}

      {success && <AppAlert tone="success" sx={{ mb: 2 }}>Patch saved and validated.</AppAlert>}

      {validationErrors.length > 0 && (
        <AppAlert tone="danger" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Validation errors:</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.map((e, i) => (
              <li key={i}>
                <code>{e.path || '(root)'}</code>: {e.message}
                <Chip label={e.code} size="small" variant="outlined" sx={{ ml: 1 }} />
              </li>
            ))}
          </ul>
        </AppAlert>
      )}

      {/* ---- Content Restrictions ---- */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Content Restrictions</Typography>

          {/* Classes */}
          <ContentRuleEditor
            label="Classes"
            items={CLASS_ITEMS}
            policy={contentFields.classesPolicy}
            selectedIds={contentFields.classesIds}
            onPolicyChange={p => updateContentField('classesPolicy', p)}
            onToggleId={id => toggleContentId('classesIds', id)}
            onSelectAll={() => updateContentField('classesIds', CLASS_ITEMS.map(c => c.id))}
            onClear={() => updateContentField('classesIds', [])}
          />

          <Divider sx={{ my: 2.5 }} />

          {/* Races */}
          <ContentRuleEditor
            label="Races"
            items={RACE_ITEMS}
            policy={contentFields.racesPolicy}
            selectedIds={contentFields.racesIds}
            onPolicyChange={p => updateContentField('racesPolicy', p)}
            onToggleId={id => toggleContentId('racesIds', id)}
            onSelectAll={() => updateContentField('racesIds', RACE_ITEMS.map(r => r.id))}
            onClear={() => updateContentField('racesIds', [])}
          />
        </CardContent>
      </Card>

      {/* ---- Multiclassing ---- */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Multiclassing Rules</Typography>

          <Stack spacing={2.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={fields.enabled}
                  onChange={e => updateField('enabled', e.target.checked)}
                />
              }
              label="Multiclassing enabled"
            />

            <TextField
              label="Min level to multiclass"
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 1, max: 20 } }}
              value={fields.minLevelToMulticlass}
              onChange={e => updateField('minLevelToMulticlass', Number(e.target.value))}
              sx={{ maxWidth: 220 }}
            />

            <TextField
              label="Max classes (blank = unlimited)"
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 2, max: 20 } }}
              value={fields.maxClasses}
              onChange={e => updateField('maxClasses', e.target.value)}
              sx={{ maxWidth: 220 }}
            />

            <TextField
              label="XP mode"
              select
              size="small"
              value={fields.xpMode}
              onChange={e => updateField('xpMode', e.target.value as 'shared' | 'per_class')}
              sx={{ maxWidth: 220 }}
            >
              <MenuItem value="shared">Shared</MenuItem>
              <MenuItem value="per_class">Per Class</MenuItem>
            </TextField>

            <Divider />

            <JsonPreviewField
              label="Entry Requirements by Target Class (JSON)"
              value={entryReqsJson}
              onChange={(next) => { setEntryReqsJson(next); setSuccess(false); setValidationErrors([]); }}
              placeholder={ENTRY_REQ_EXAMPLE}
              helperText="OR-of-AND structure: { classId: { anyOf: [{ all: [{ ability, min }] }] } }"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* ---- Save ---- */}
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving || hasJsonError}
        sx={{ mb: 4 }}
      >
        {saving ? 'Saving...' : 'Save Patch'}
      </Button>

      {/* ---- Resolved Preview ---- */}
      {resolved && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Resolved Preview</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Final multiclassing config after merging system defaults + campaign patch.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              <Chip
                label={resolved.enabled ? 'Enabled' : 'Disabled'}
                color={resolved.enabled ? 'success' : 'default'}
                size="small"
              />
              <Chip label={`Min Level: ${resolved.minLevelToMulticlass ?? '—'}`} size="small" variant="outlined" />
              <Chip label={`Max Classes: ${resolved.maxClasses ?? '∞'}`} size="small" variant="outlined" />
              <Chip label={`XP: ${resolved.xpMode ?? 'shared'}`} size="small" variant="outlined" />
            </Stack>
            {resolved.entryRequirementsByTargetClass && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Entry requirements ({Object.keys(resolved.entryRequirementsByTargetClass).length} class{Object.keys(resolved.entryRequirementsByTargetClass).length !== 1 ? 'es' : ''}):
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    mt: 0.5,
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  {JSON.stringify(resolved.entryRequirementsByTargetClass, null, 2)}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
