import { useState, useCallback, useRef, useMemo, type ChangeEvent, type DragEvent } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';

import Lightbox from '@/ui/patterns/Lightbox/Lightbox';
import { resolveImageUrl } from '@/shared/lib/media';
import { AppAlert } from '../AppAlert/AppAlert';

export type AppImageUploadFieldProps = {
  /** Current storage key or legacy URL */
  value?: string | null;
  /** Called with the storage key from the upload endpoint (or null on remove) */
  onChange: (key: string | null) => void;
  /** Label shown above the field */
  label?: string;
  /** Whether the user can interact with the field */
  disabled?: boolean;
  /** Max height for the image preview */
  maxHeight?: number;
  /** Show required indicator on label */
  required?: boolean;
};

/**
 * Drag-and-drop image upload with replace/remove and lightbox preview.
 * Stores the raw storage key via `onChange`; resolves display URL internally.
 * For react-hook-form, see `AppFormImageUploadField`.
 */
export function AppImageUploadField({
  value,
  onChange,
  label = 'Image',
  disabled = false,
  maxHeight = 280,
  required = false,
}: AppImageUploadFieldProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = useMemo(() => resolveImageUrl(value), [value]);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        const res = await fetch('/api/uploads', {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          credentials: 'include',
          body: file,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const message = body.error ?? `Upload failed (${res.status})`;
          setUploadError(message);
          return;
        }
        const data = await res.json();
        onChange(data.key);
      } catch {
        setUploadError('Upload failed. Please check your connection and try again.');
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      const file = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith('image/'),
      );
      if (file) uploadFile(file);
    },
    [disabled, uploadFile],
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = '';
    },
    [uploadFile],
  );

  if (displayUrl) {
    return (
      <Box>
        {label && (
          <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            {label}
            {required && ' *'}
          </Typography>
        )}

        {uploadError && (
          <AppAlert tone="danger" onClose={() => setUploadError(null)} sx={{ mb: 1 }}>
            {uploadError}
          </AppAlert>
        )}

        <Box
          component="img"
          src={displayUrl}
          alt={label}
          onClick={() => setLightboxOpen(true)}
          sx={{
            width: '100%',
            maxHeight,
            objectFit: 'contain',
            borderRadius: 1,
            border: '1px solid var(--mui-palette-divider)',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            '&:hover': { opacity: 0.85 },
          }}
        />

        {!disabled && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Box>
        )}

        <Lightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          src={displayUrl}
          alt={label}
        />
      </Box>
    );
  }

  return (
    <Box>
      {label && (
        <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {label}
          {required && ' *'}
        </Typography>
      )}
      {uploadError && (
        <AppAlert tone="danger" onClose={() => setUploadError(null)} sx={{ mb: 1 }}>
          {uploadError}
        </AppAlert>
      )}
      <Card
        variant="outlined"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={disabled ? undefined : () => fileInputRef.current?.click()}
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          cursor: disabled ? 'default' : 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragActive
            ? 'var(--mui-palette-primary-main)'
            : 'var(--mui-palette-divider)',
          bgcolor: dragActive
            ? 'var(--mui-palette-primary-main)14'
            : 'transparent',
          transition: 'border-color 0.2s, background-color 0.2s',
          ...(!disabled && {
            '&:hover': {
              borderColor: 'var(--mui-palette-primary-light)',
              bgcolor: 'var(--mui-palette-action-hover)',
            },
          }),
        }}
      >
        {uploading ? (
          <CircularProgress size={36} />
        ) : (
          <>
            {dragActive ? (
              <CloudUploadIcon sx={{ fontSize: 40, color: 'var(--mui-palette-primary-main)' }} />
            ) : (
              <ImageIcon sx={{ fontSize: 40, color: 'var(--mui-palette-text-secondary)' }} />
            )}
            {!disabled ? (
              <>
                <Typography variant="body2" fontWeight={600}>
                  {dragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PNG, JPG, WEBP supported
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No image uploaded.
              </Typography>
            )}
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Card>
    </Box>
  );
}
