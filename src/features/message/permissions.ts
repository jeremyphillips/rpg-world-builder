export const canMessageUser = (
  currentUserId: string,
  targetUserId: string,
  campaignMembers: string[]
): boolean =>
  campaignMembers.includes(currentUserId) && campaignMembers.includes(targetUserId)

/** All target user IDs must be campaign members; current user must be a member. */
export const canMessageUsers = (
  currentUserId: string,
  targetUserIds: string[],
  campaignMembers: string[]
): boolean =>
  campaignMembers.includes(currentUserId) &&
  targetUserIds.length > 0 &&
  targetUserIds.every((id) => campaignMembers.includes(id))
  