import { useState, useEffect, useCallback, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { AppModal, ConfirmModal } from '@/ui/patterns';
import type { ContentTypeKey } from '@/features/content/domain/patches/contentPatch.types';
import {
  getContentPatch,
  getEntryPatch,
  upsertEntryPatch,
  removeEntryPatch,
} from '@/features/content/domain/contentPatchRepo';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SystemContentPatchModalProps {
  open: boolean;
  onClose: (changed?: boolean) => void;
  campaignId: string;
  contentTypeKey: ContentTypeKey;
  entryId: string;
  entryName: string;
  examplePatch?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tryParseJson(text: string): { valid: true; value: unknown } | { valid: false; error: string } {
  const trimmed = text.trim();
  if (trimmed === '') return { valid: true, value: {} };
  try {
    return { valid: true, value: JSON.parse(trimmed) };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// TODO: reuse this modal for other system content detail routes (equipment, spells, etc.)

const SystemContentPatchModal = ({
  open,
  onClose,
  campaignId,
  contentTypeKey,
  entryId,
  entryName,
  examplePatch,
}: SystemContentPatchModalProps) => {
  const [editorText, setEditorText] = useState('');
  const [initialText, setInitialText] = useState('');
  const [hasExistingPatch, setHasExistingPatch] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const didFetchRef = useRef(false);

  // -----------------------------------
  // Load existing patch on open
  // -----------------------------------

  useEffect(() => {
    if (!open) {
      didFetchRef.current = false;
      return;
    }
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    let cancelled = false;
    setFetchLoading(true);

    getContentPatch(campaignId)
      .then((doc) => {
        if (cancelled) return;
        const existing = getEntryPatch(doc, contentTypeKey, entryId);
        if (existing) {
          const text = JSON.stringify(existing, null, 2);
          setEditorText(text);
          setInitialText(text);
          setHasExistingPatch(true);
        } else {
          setEditorText('');
          setInitialText('');
          setHasExistingPatch(false);
        }
        setJsonError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setEditorText('');
        setInitialText('');
        setHasExistingPatch(false);
      })
      .finally(() => {
        if (!cancelled) setFetchLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, campaignId, contentTypeKey, entryId]);

  // -----------------------------------
  // Editor change
  // -----------------------------------

  const handleTextChange = useCallback((text: string) => {
    setEditorText(text);
    const result = tryParseJson(text);
    setJsonError(result.valid ? null : result.error);
  }, []);

  // -----------------------------------
  // Derived state
  // -----------------------------------

  const dirty = editorText !== initialText;
  const parsed = tryParseJson(editorText);
  const isValid = parsed.valid;
  const busy = saving || removing;

  // -----------------------------------
  // Save
  // -----------------------------------

  const handleSave = useCallback(async () => {
    if (!isValid || !parsed.valid) return;
    setSaving(true);
    try {
      await upsertEntryPatch(campaignId, contentTypeKey, entryId, parsed.value);
      onClose(true);
    } catch {
      setJsonError('Failed to save patch. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [campaignId, contentTypeKey, entryId, isValid, parsed, onClose]);

  // -----------------------------------
  // Remove
  // -----------------------------------

  const handleRemoveConfirm = useCallback(async () => {
    setRemoving(true);
    try {
      await removeEntryPatch(campaignId, contentTypeKey, entryId);
      setConfirmRemoveOpen(false);
      onClose(true);
    } catch {
      setJsonError('Failed to remove patch. Please try again.');
      setConfirmRemoveOpen(false);
    } finally {
      setRemoving(false);
    }
  }, [campaignId, contentTypeKey, entryId, onClose]);

  // -----------------------------------
  // Dirty guard via onBeforeClose
  // -----------------------------------

  const handleBeforeClose = useCallback(() => {
    if (dirty && !busy) return false;
    return true;
  }, [dirty, busy]);

  // -----------------------------------
  // Render
  // -----------------------------------

  return (
    <>
      <AppModal
        open={open}
        onClose={() => onClose(false)}
        onBeforeClose={handleBeforeClose}
        discardWarning={{
          headline: 'Discard unsaved changes?',
          description: 'Your patch edits will be lost.',
        }}
        size="standard"
        headline={`Patch: ${entryName}`}
        description="This patch applies on top of system content for this campaign. Objects are deep-merged; arrays are replaced entirely."
        loading={fetchLoading}
        primaryAction={{
          label: 'Save patch',
          onClick: handleSave,
          disabled: !dirty || !isValid || busy,
          loading: saving,
        }}
        secondaryAction={{
          label: 'Close',
          onClick: () => onClose(false),
        }}
        actions={
          hasExistingPatch ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button
                onClick={() => setConfirmRemoveOpen(true)}
                disabled={busy}
                variant="outlined"
                color="error"
                size="small"
              >
                Remove patch
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => onClose(false)}
                  disabled={busy}
                  variant="outlined"
                  color="secondary"
                >
                  Close
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!dirty || !isValid || busy}
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  Save patch
                </Button>
              </Box>
            </Box>
          ) : undefined
        }
      >
        <TextField
          multiline
          minRows={8}
          maxRows={20}
          fullWidth
          value={editorText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={examplePatch ?? '{\n  "description": "Custom description..."\n}'}
          error={!!jsonError}
          helperText={jsonError ?? 'Enter a JSON object to merge into the system entry.'}
          disabled={fetchLoading || busy}
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
            },
          }}
        />

        {hasExistingPatch && !dirty && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            A patch is currently applied to this entry.
          </Typography>
        )}
      </AppModal>

      <ConfirmModal
        open={confirmRemoveOpen}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmRemoveOpen(false)}
        headline="Remove patch?"
        description="This will revert the entry to its original system content for this campaign."
        confirmLabel="Remove"
        confirmColor="error"
        loading={removing}
      />
    </>
  );
};

export default SystemContentPatchModal;
