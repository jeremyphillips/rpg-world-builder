/**
 * Building edit workspace: floor child locations (first pass — positive floors only).
 */
import type { Location } from '@/features/content/locations/domain/types';

export type BuildingWorkspaceFloorItem = {
  id: string;
  name: string;
  sortOrder: number;
};

export function listFloorChildren(
  locations: Location[],
  buildingId: string,
): BuildingWorkspaceFloorItem[] {
  const rows = locations.filter(
    (l) => l.parentId === buildingId && l.scale === 'floor',
  );
  return rows
    .map((l) => ({
      id: l.id,
      name: l.name,
      sortOrder: l.sortOrder ?? 0,
    }))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
}

/** Next sortOrder for a new floor child (1-based sequence when starting empty). */
export function nextSortOrder(floors: BuildingWorkspaceFloorItem[]): number {
  if (floors.length === 0) return 1;
  return Math.max(...floors.map((f) => f.sortOrder)) + 1;
}

/** Display label from position in the sorted floor list (Floor 1, Floor 2, …). */
export function floorTabLabelFromIndex(indexZeroBased: number): string {
  return `Floor ${indexZeroBased + 1}`;
}
