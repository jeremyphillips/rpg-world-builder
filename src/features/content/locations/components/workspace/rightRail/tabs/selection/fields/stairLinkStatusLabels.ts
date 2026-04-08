import type { LocationMapStairEndpointLinkStatus } from '@/shared/domain/locations';

export const STAIR_LINK_STATUS_LABEL: Record<LocationMapStairEndpointLinkStatus, string> = {
  unlinked: 'Unlinked',
  incomplete: 'Incomplete',
  linked: 'Linked',
  invalid: 'Invalid',
};
