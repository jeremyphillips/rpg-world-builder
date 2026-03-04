/**
 * Reusable scaffold for a content entry editor (create / edit).
 *
 * Provides a save bar, dirty guard, validation summary, optional delete
 * with pre-delete validation, and a slot for the form fields.
 */
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import MuiLink from '@mui/material/Link';
import DeleteIcon from '@mui/icons-material/Delete';

import type { Visibility } from '@/shared/types/visibility';
import { AppAlert } from '@/ui/primitives';
import { AppPageHeader, AppModal, ConfirmModal, VisibilityField } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';


// ---------------------------------------------------------------------------
// Delete validation types (generic across all content types)
// ---------------------------------------------------------------------------

export type DeleteBlockReason = 'IN_USE' | 'LOCKED' | 'UNKNOWN';

export interface BlockingEntity {
  id: string;
  label: string;
  /** If provided, entity label renders as a router Link. */
  to?: string;
}

export type DeleteValidationResult =
  | { allowed: true }
  | {
      allowed: false;
      message: string;
      reason?: DeleteBlockReason;
      blockingEntities?: BlockingEntity[];
    };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ValidationError {
  path: string;
  code: string;
  message: string;
}

interface EntryEditorLayoutProps {
  typeLabel: string;
  isNew: boolean;
  saving: boolean;
  dirty: boolean;
  success: boolean;
  errors: ValidationError[];
  /**
   * Legacy/non-form save handler invoked on click.
   * Ignored when `formId` is provided.
   */
  onSave?: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  /**
   * HTML form id used for RHF / AppForm submission.
   * When provided the Save button renders as `type="submit" form={formId}`
   * instead of using `onClick`. Preferred for new editor routes.
   */
  formId?: string;

  /** When true, renders a Delete button. Caller determines permission. */
  canDelete?: boolean;
  /** Performs the actual deletion. Called only after validation + confirmation. */
  onDelete?: () => Promise<void> | void;
  /**
   * Async pre-delete check. Return `{ allowed: true }` to proceed to
   * confirmation, or `{ allowed: false, message, ... }` to show a
   * "blocked" modal explaining why deletion is not possible.
   */
  validateDelete?: () => Promise<DeleteValidationResult>;
  /** Override the default "Delete {typeLabel}" button label. */
  deleteLabel?: string;

  /** When true, renders the access policy (VisibilityField) section. */
  showPolicyField?: boolean;
  /** Current access policy value. */
  policyValue?: Visibility;
  /** Called when the user changes the access policy. */
  onPolicyChange?: (next: Visibility) => void;
  /** Disable the policy field (read-only display). */
  policyDisabled?: boolean;
  /** Characters available for the "restricted" scope selector. */
  policyCharacters?: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MAX_BLOCKING_ENTITIES = 5;

export default function EntryEditorLayout({
  typeLabel,
  isNew,
  saving,
  dirty,
  success,
  errors,
  onSave,
  onBack,
  children,
  formId,
  canDelete = false,
  onDelete,
  validateDelete,
  deleteLabel,
  showPolicyField = false,
  policyValue,
  onPolicyChange,
  policyDisabled = false,
  policyCharacters,
}: EntryEditorLayoutProps) {
  const breadcrumbs = useBreadcrumbs();

  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedResult, setBlockedResult] = useState<
    Extract<DeleteValidationResult, { allowed: false }> | null
  >(null);

  const busy = saving || validating || deleting;
  const showDelete = canDelete && onDelete && !isNew;
  const resolvedDeleteLabel = deleteLabel ?? `Delete ${typeLabel}`;

  const handleDeleteClick = useCallback(async () => {
    setDeleteError(null);

    if (validateDelete) {
      setValidating(true);
      try {
        const result = await validateDelete();
        if (!result.allowed) {
          setBlockedResult(result);
          setBlockedOpen(true);
          return;
        }
      } catch (err) {
        setDeleteError((err as Error).message);
        return;
      } finally {
        setValidating(false);
      }
    }

    setConfirmOpen(true);
  }, [validateDelete]);

  const handleConfirmDelete = useCallback(async () => {
    if (!onDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }, [onDelete]);

  return (
    <Box>
      <AppPageHeader
        headline={isNew ? `New ${typeLabel}` : `Edit ${typeLabel}`}
        breadcrumbData={breadcrumbs}
        actions={[
          <Button variant="text" size="small" onClick={onBack}>
            Back to list
          </Button>
        ]}
      />

      {success && (
        <AppAlert tone="success" sx={{ mb: 2 }}>
          {typeLabel} saved successfully.
        </AppAlert>
      )}

      {errors.length > 0 && (
        <AppAlert tone="danger" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Validation errors:</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {errors.map((e, i) => (
              <li key={i}>
                <code>{e.path || '(root)'}</code>: {e.message}
              </li>
            ))}
          </ul>
        </AppAlert>
      )}

      {deleteError && (
        <AppAlert tone="danger" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
          {deleteError}
        </AppAlert>
      )}

      {showPolicyField && policyValue && onPolicyChange && (
        <Box sx={{ mb: 3 }}>
          <VisibilityField
            value={policyValue}
            onChange={onPolicyChange}
            disabled={policyDisabled}
            characters={policyCharacters}
          />
        </Box>
      )}

      {children}

      <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            disabled={busy || (!dirty && !isNew)}
            {...(formId
              ? { type: 'submit', form: formId }
              : { onClick: onSave })}
          >
            {saving ? 'Saving…' : isNew ? `Create ${typeLabel}` : `Save ${typeLabel}`}
          </Button>
          {onBack && (
            <Button variant="outlined" onClick={onBack} disabled={busy}>
              Cancel
            </Button>
          )}
        </Stack>

        {showDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            disabled={busy}
          >
            {validating ? 'Checking…' : resolvedDeleteLabel}
          </Button>
        )}
      </Stack>

      {/* Destructive confirmation */}
      <ConfirmModal
        open={confirmOpen}
        headline={resolvedDeleteLabel}
        description={`Are you sure you want to delete this ${typeLabel.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Blocked — validation failed */}
      <AppModal
        open={blockedOpen}
        onClose={() => setBlockedOpen(false)}
        size="compact"
        headline="Cannot Delete"
        description={blockedResult?.message}
        primaryAction={{
          label: 'Close',
          onClick: () => setBlockedOpen(false),
        }}
      >
        {blockedResult?.blockingEntities && blockedResult.blockingEntities.length > 0 && (
          <List dense disablePadding>
            {blockedResult.blockingEntities.slice(0, MAX_BLOCKING_ENTITIES).map((entity) => (
              <ListItem key={entity.id} disableGutters>
                <ListItemText
                  primary={
                    entity.to ? (
                      <MuiLink component={Link} to={entity.to} underline="hover">
                        {entity.label}
                      </MuiLink>
                    ) : (
                      entity.label
                    )
                  }
                />
              </ListItem>
            ))}
            {blockedResult.blockingEntities.length > MAX_BLOCKING_ENTITIES && (
              <ListItem disableGutters>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary">
                      …and {blockedResult.blockingEntities.length - MAX_BLOCKING_ENTITIES} more
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        )}
      </AppModal>
    </Box>
  );
}
