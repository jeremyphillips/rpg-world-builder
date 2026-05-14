import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import type { ImageContentType } from '@/shared/lib/media';
import { resolveContentImageUrl } from '@/shared/lib/media';

export type ContentDetailImageKeyValueGridProps = {
  imageContentType: ImageContentType;
  imageKey?: string | null;
  alt: string;
  /** Max height for the detail image in px (default 500). */
  maxHeight?: number;
  children: ReactNode;
};

/**
 * Shared 12-column layout: key/value block (md:8) + image (md:4), with image first on xs.
 */
export default function ContentDetailImageKeyValueGrid({
  imageContentType,
  imageKey,
  alt,
  maxHeight = 500,
  children,
}: ContentDetailImageKeyValueGridProps) {
  const src = resolveContentImageUrl(imageContentType, imageKey);

  return (
    <Grid container columns={12} spacing={2} sx={{ mt: 2 }}>
      <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 } }}>
        {children}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src={src}
            alt={alt}
            style={{ maxHeight, width: '100%', objectFit: 'contain' }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
