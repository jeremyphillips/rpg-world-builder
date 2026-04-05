import {
  useCallback,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import type { UseFormGetValues, UseFormHandleSubmit, UseFormReset } from 'react-hook-form';

import {
  locationRepo,
  type LocationFormValues,
  type LocationInput,
  LOCATION_FORM_DEFAULTS,
  locationToFormValues,
  bootstrapDefaultLocationMap,
  pickMapGridFormValues,
  getDefaultCellUnitForScale,
  getDefaultGeometryForScale,
  nextSortOrder,
} from '@/features/content/locations/domain';
import type { BuildingWorkspaceFloorItem } from '@/features/content/locations/domain/model/building/buildingWorkspaceFloors';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import { INITIAL_LOCATION_GRID_DRAFT } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import { getHomebrewWorkspaceSaveBlockReason } from '@/features/content/locations/routes/locationEdit/homebrewWorkspaceSaveGate';
import {
  buildHomebrewWorkspacePersistableParts,
  serializeLocationWorkspacePersistableSnapshot,
} from '@/features/content/locations/routes/locationEdit/workspacePersistableSnapshot';
import { useSystemPatchActions } from '@/features/content/shared/hooks/useSystemPatchActions';
import type { PatchDriver } from '@/features/content/shared/editor/patchDriver';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationScaleId, LocationVerticalStairConnection } from '@/shared/domain/locations';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';

type Feedback = {
  setSaving: (v: boolean) => void;
  setSuccess: (v: boolean) => void;
  setErrors: (v: ValidationError[]) => void;
};

type UseLocationEditSaveActionsParams = {
  campaignId: string | null | undefined;
  locationId: string | null | undefined;
  loc: LocationContentItem | null;
  activeFloorId: string | null;
  locations: Location[];
  gridDraftRef: RefObject<LocationGridDraftState>;
  setGridDraftBaseline: Dispatch<SetStateAction<LocationGridDraftState>>;
  reset: UseFormReset<LocationFormValues>;
  getValues: UseFormGetValues<LocationFormValues>;
  handleSubmit: UseFormHandleSubmit<LocationFormValues>;
  feedback: Feedback;
  driver: PatchDriver | null;
  setInitialPatch: (patch: Record<string, unknown>) => void;
  validationApiRef: RefObject<{ validateAll: () => boolean } | null>;
  floorChildren: BuildingWorkspaceFloorItem[];
  onFloorCreated: () => void;
  setActiveFloorId: (id: string | null) => void;
  /** Canonical stair pairings for building saves; merged into `buildingProfile.stairConnections`. */
  buildingStairConnectionsRef: RefObject<LocationVerticalStairConnection[]>;
  setBuildingStairConnections: Dispatch<SetStateAction<LocationVerticalStairConnection[]>>;
  setWorkspacePersistBaseline: (snapshot: string) => void;
};

export function useLocationEditSaveActions({
  campaignId,
  locationId,
  loc,
  activeFloorId,
  locations,
  gridDraftRef,
  setGridDraftBaseline,
  reset,
  getValues,
  handleSubmit,
  feedback: { setSaving, setSuccess, setErrors },
  driver,
  setInitialPatch,
  validationApiRef,
  floorChildren,
  onFloorCreated,
  setActiveFloorId,
  buildingStairConnectionsRef,
  setBuildingStairConnections,
  setWorkspacePersistBaseline,
}: UseLocationEditSaveActionsParams) {
  const [addingFloor, setAddingFloor] = useState(false);

  const handleHomebrewSubmit = useCallback(
    async (values: LocationFormValues) => {
      if (!campaignId || !locationId || !loc) return;
      const blockReason = getHomebrewWorkspaceSaveBlockReason(loc, activeFloorId, values);
      if (blockReason) {
        setErrors([{ path: '', code: 'VALIDATION', message: blockReason }]);
        return;
      }
      const isBuilding = loc.source === 'campaign' && loc.scale === 'building';
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      try {
        const draft = gridDraftRef.current;
        const { locationInput, mapBootstrapPayload } = buildHomebrewWorkspacePersistableParts(
          values,
          draft,
          buildingStairConnectionsRef.current,
          loc,
        );
        const updated = await locationRepo.updateEntry(campaignId, locationId, locationInput);
        if (isBuilding) {
          setBuildingStairConnections(updated.buildingProfile?.stairConnections ?? []);
        }
        const mapLocationId = isBuilding ? activeFloorId! : locationId;
        const mapBootstrapName = isBuilding
          ? locations.find((l) => l.id === activeFloorId)?.name ?? 'Floor'
          : updated.name;
        const mapBootstrapScale = isBuilding
          ? ('floor' as const)
          : (updated.scale as LocationScaleId);
        await bootstrapDefaultLocationMap(
          campaignId,
          mapLocationId,
          mapBootstrapName,
          mapBootstrapScale,
          values,
          mapBootstrapPayload,
        );
        reset({
          ...locationToFormValues(updated),
          ...pickMapGridFormValues(values),
        });
        setGridDraftBaseline(structuredClone(gridDraftRef.current));
        const stairConnectionsForSnapshot = isBuilding
          ? (updated.buildingProfile?.stairConnections ?? [])
          : buildingStairConnectionsRef.current;
        setWorkspacePersistBaseline(
          serializeLocationWorkspacePersistableSnapshot(
            getValues(),
            gridDraftRef.current,
            stairConnectionsForSnapshot,
            loc,
          ),
        );
        setSuccess(true);
      } catch (e) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (e as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [
      campaignId,
      locationId,
      loc,
      activeFloorId,
      locations,
      gridDraftRef,
      setGridDraftBaseline,
      getValues,
      reset,
      setSaving,
      setSuccess,
      setErrors,
      buildingStairConnectionsRef,
      setBuildingStairConnections,
      setWorkspacePersistBaseline,
    ],
  );

  const handleHomebrewFormSaveClick = useCallback(() => {
    void handleSubmit(handleHomebrewSubmit)();
  }, [handleSubmit, handleHomebrewSubmit]);

  const handleAddFloor = useCallback(async () => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign' || loc.scale !== 'building') {
      return;
    }
    if (addingFloor) return;
    setAddingFloor(true);
    setErrors([]);
    try {
      const sort = nextSortOrder(floorChildren);
      const floorIndex = floorChildren.length + 1;
      const input: LocationInput = {
        name: `Floor ${floorIndex}`,
        scale: 'floor',
        parentId: locationId,
        category: 'interior',
        sortOrder: sort,
      };
      const created = await locationRepo.createEntry(campaignId, input);
      const v = getValues();
      const hasGrid =
        Number(v.gridColumns) > 0 && Number(v.gridRows) > 0;
      const preset = GRID_SIZE_PRESETS.medium;
      const bootstrapValues: LocationFormValues = {
        ...LOCATION_FORM_DEFAULTS,
        ...v,
        name: created.name,
        scale: 'floor',
        parentId: locationId,
        category: 'interior',
        gridPreset: hasGrid ? v.gridPreset : '',
        gridColumns: hasGrid ? v.gridColumns : String(preset.columns),
        gridRows: hasGrid ? v.gridRows : String(preset.rows),
        gridCellUnit: v.gridCellUnit || getDefaultCellUnitForScale('floor'),
        gridGeometry: getDefaultGeometryForScale('floor'),
      };
      const { mapBootstrapPayload: newFloorMapPayload } = buildHomebrewWorkspacePersistableParts(
        bootstrapValues,
        INITIAL_LOCATION_GRID_DRAFT,
        [],
        null,
      );
      await bootstrapDefaultLocationMap(
        campaignId,
        created.id,
        created.name,
        'floor',
        bootstrapValues,
        newFloorMapPayload,
      );
      onFloorCreated();
      setActiveFloorId(created.id);
    } catch (e) {
      setErrors([
        { path: '', code: 'SAVE_FAILED', message: (e as Error).message },
      ]);
    } finally {
      setAddingFloor(false);
    }
  }, [
    campaignId,
    locationId,
    loc,
    addingFloor,
    floorChildren,
    getValues,
    setErrors,
    onFloorCreated,
    setActiveFloorId,
  ]);

  const { savePatch: handlePatchSave, removePatch: handleRemovePatch } =
    useSystemPatchActions({
      campaignId: campaignId ?? undefined,
      entryId: locationId ?? undefined,
      collectionKey: 'locations',
      driver,
      setInitialPatch,
      validationApiRef,
      feedback: { setSaving, setSuccess, setErrors },
    });

  return {
    addingFloor,
    handleHomebrewSubmit,
    handleHomebrewFormSaveClick,
    handleAddFloor,
    handlePatchSave,
    handleRemovePatch,
  };
}
