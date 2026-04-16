import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentSource } from '@/features/content/shared/domain/types';
import { AppPageHeader, VisibilityBadge } from '@/ui/patterns';
import type { BreadcrumbItem } from '@/ui/patterns';
import { AppAlert } from '@/ui/primitives';

interface ContentDetailScaffoldProps {
  title: string;
  breadcrumbData: BreadcrumbItem[];
  editPath: string;
  /** When true, shows the primary Edit action in the page header (e.g. `canManageContent(viewer)`). */
  canManage: boolean;
  source: ContentSource;
  accessPolicy?: Visibility;
  children: React.ReactNode;
}

const ContentDetailScaffold = ({
  title,
  breadcrumbData,
  editPath,
  canManage,
  source,
  accessPolicy,
  children,
}: ContentDetailScaffoldProps) => {
  const policyScope = accessPolicy?.scope;
  const isRestricted = policyScope === 'restricted' || policyScope === 'dm';

  return (
    <Box>
      <AppPageHeader
        headline={title}
        breadcrumbData={breadcrumbData}
        actions={
          canManage
            ? [
                <Button
                  key="edit"
                  component={Link}
                  to={editPath}
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>,
              ]
            : []
        }
      />

      {isRestricted && source === 'campaign' && (
        <AppAlert tone="warning" sx={{ mb: 2 }}>
          This content has restricted visibility — not all campaign members can see it.
        </AppAlert>
      )}

      {accessPolicy && accessPolicy.scope !== 'public' && (
        <Box sx={{ mb: 3 }}>
          <VisibilityBadge visibility={accessPolicy} />
        </Box>
      )}

      {children}
    </Box>
  );
};

export default ContentDetailScaffold;
