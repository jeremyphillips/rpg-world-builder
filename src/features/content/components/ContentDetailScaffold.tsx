import { Link } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';

import type { Visibility } from '@/data/types';
import type { ContentSource } from '@/features/content/domain/types';
import type { BreadcrumbItem } from '@/ui/elements';
import { PageHeader } from '@/ui/elements';
import { VisibilityChip } from '@/ui/components/fields';

interface ContentDetailScaffoldProps {
  title: string;
  breadcrumbData: BreadcrumbItem[];
  listPath: string;
  editPath: string;
  canEdit: boolean;
  source: ContentSource;
  accessPolicy?: Visibility;
  children: React.ReactNode;
}

const ContentDetailScaffold = ({
  title,
  breadcrumbData,
  listPath,
  editPath,
  canEdit,
  source,
  accessPolicy,
  children,
}: ContentDetailScaffoldProps) => {
  const policyScope = accessPolicy?.scope;
  const isRestricted = policyScope === 'restricted' || policyScope === 'dm';

  return (
    <Box>
      <PageHeader
        headline={title}
        breadcrumbData={breadcrumbData}
        actions={[
          <Button
            key="back"
            component={Link}
            to={listPath}
            size="small"
            startIcon={<ArrowBackIcon />}
          >
            Back to list
          </Button>,
        ]}
      />

      {source === 'system' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This is a system entry and is not editable.
        </Alert>
      )}

      {isRestricted && source === 'campaign' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This content has restricted visibility — not all campaign members can see it.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {canEdit && (
            <Button
              component={Link}
              to={editPath}
              variant="contained"
              size="small"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          )}
          {accessPolicy && accessPolicy.scope !== 'public' && (
            <VisibilityChip visibility={accessPolicy} />
          )}
        </Stack>
      </Stack>

      {children}
    </Box>
  );
};

export default ContentDetailScaffold;
