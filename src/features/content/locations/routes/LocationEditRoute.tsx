import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { locationRepo } from '@/features/content/locations/domain';
import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { VisibilityField } from '@/ui/patterns';
import { AppAlert } from '@/ui/primitives';
import {
  LocationGridAuthoringSection,
  LocationEditHomebrewWorkspace,
  LocationEditSystemPatchWorkspace,
  LocationEditorMapCanvasColumn,
  LocationEditorSelectionPanel,
  selectedCellIdForMapSelection,
  LocationAncestryBreadcrumbs,
  LocationMapEditorPaintMapPanel,
  LocationMapEditorPlacePanel,
  LocationMapEditorDrawPanel,
} from '@/features/content/locations/components';

import {
  floorTabLabelFromIndex,
  listFloorChildren,
  type BuildingWorkspaceFloorItem,
} from '@/features/content/locations/domain/model/building/buildingWorkspaceFloors';

import { useLocationEditWorkspaceModel } from './locationEdit';

const FORM_ID = 'location-edit-form';

function buildStairWorkspaceInspect(args: {
  isBuildingWorkspace: boolean;
  activeFloorId: string | null;
  floorChildren: BuildingWorkspaceFloorItem[];
  loc: LocationContentItem;
  locationId: string | undefined;
  locations: Location[];
  mapHostLocationId: string;
}): { currentFloorLocationId: string; candidateTargetFloors: { id: string; label: string }[] } {
  const {
    isBuildingWorkspace,
    activeFloorId,
    floorChildren,
    loc,
    locationId,
    locations,
    mapHostLocationId,
  } = args;

  if (isBuildingWorkspace && activeFloorId) {
    const sorted = floorChildren;
    return {
      currentFloorLocationId: activeFloorId,
      candidateTargetFloors: sorted
        .filter((f) => f.id !== activeFloorId)
        .map((f) => {
          const idx = sorted.findIndex((x) => x.id === f.id);
          return {
            id: f.id,
            label: f.name?.trim() ? f.name : floorTabLabelFromIndex(idx),
          };
        }),
    };
  }
  if (!isBuildingWorkspace && loc.scale === 'floor' && loc.parentId && locationId) {
    const sorted = listFloorChildren(locations, loc.parentId);
    return {
      currentFloorLocationId: locationId,
      candidateTargetFloors: sorted
        .filter((f) => f.id !== locationId)
        .map((f) => {
          const idx = sorted.findIndex((x) => x.id === f.id);
          return {
            id: f.id,
            label: f.name?.trim() ? f.name : floorTabLabelFromIndex(idx),
          };
        }),
    };
  }
  return {
    currentFloorLocationId: mapHostLocationId,
    candidateTargetFloors: [],
  };
}

export default function LocationEditRoute() {
  const { campaignId } = useActiveCampaign();
  const { locationId } = useParams<{ locationId: string }>();

  const { entry: loc, loading, error, notFound } = useCampaignContentEntry<LocationContentItem>({
    campaignId: campaignId ?? undefined,
    entryId: locationId,
    fetchEntry: locationRepo.getEntry,
  });

  const model = useLocationEditWorkspaceModel({
    locationId,
    loc: loc ?? null,
  });

  const {
    flushDebouncedPersistableFieldsRef,
    handleHomebrewFormSaveClick,
    handlePatchSave,
  } = model;

  const handleHeaderSaveHomebrew = useCallback(() => {
    flushSync(() => {
      flushDebouncedPersistableFieldsRef.current?.();
    });
    handleHomebrewFormSaveClick();
  }, [handleHomebrewFormSaveClick]);

  const handleHeaderSavePatch = useCallback(() => {
    flushSync(() => {
      flushDebouncedPersistableFieldsRef.current?.();
    });
    handlePatchSave();
  }, [handlePatchSave]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error || notFound || !loc) {
    return <AppAlert tone="danger">{error ?? 'Location not found.'}</AppAlert>;
  }

  const {
    methods,
    saving,
    success,
    errors,
    authoringContract,
    gridDraft,
    setGridDraft,
    railSection,
    setRailSection,
    rightRailOpen,
    setRightRailOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleting,
    setDeleting,
    activeFloorId,
    setActiveFloorId,
    addingFloor,
    canDelete,
    zoom,
    zoomControlProps,
    wheelContainerRef,
    pan,
    isDragging,
    consumeClickSuppressionAfterPan,
    pointerHandlers,
    isSystem,
    isBuildingWorkspace,
    floorChildren,
    scaleForFormRules,
    fieldConfigs,
    showMapGridAuthoring,
    mapEditor,
    handlePaintChange,
    handleUpdateRegionEntry,
    handleCreateRegionPaint,
    handleSelectActiveRegionPaint,
    handleActiveRegionColorKeyChange,
    handleEditRegionInSelection,
    handleMapEditorModeChange,
    focusSelectionRailSection,
    paintPaletteItems,
    placePaletteItems,
    drawPaletteItems,
    mapPlaceSuppressesCanvasPanOnCells,
    mapPlaceObjectDragStrokeEnabled,
    linkModalSelectOptions,
    showMapEditorChrome,
    leftMapChromeWidthPx,
    policyValue,
    handlePolicyChange,
    policyCharacters,
    driver,
    validationApiRef,
    hasExistingPatch,
    handleHomebrewSubmit,
    handleAddFloor,
    handleRemovePatch,
    handleDelete,
    handleValidateDelete,
    handleRequestDelete,
    handleBack,
    handleUpdateLinkedLocation,
    handleUpdateCellObjects,
    handleEraseCell,
    handleRemovePlacedObject,
    handleRemovePathFromMap,
    handleRemoveEdgeFromMap,
    handleRemoveEdgeRunFromMap,
    handleAuthoringCellClick,
    handleEdgeStrokeCommit,
    handleEraseEdge,
    gridColumns,
    gridRows,
    gridGeometry,
    locations,
    buildingStairConnections,
    handleLinkStairPair,
    handleUnlinkStairEndpoint,
  } = model;

  const ancestryBreadcrumbs = (
    <LocationAncestryBreadcrumbs
      locations={locations}
      campaignId={campaignId ?? undefined}
      currentLocationId={locationId}
      parentId={loc.parentId}
    />
  );

  const activeFloorName =
    activeFloorId && locations.find((l) => l.id === activeFloorId)?.name;
  const mapHostLocationId = isBuildingWorkspace ? activeFloorId ?? '' : locationId!;
  const mapHostScale = isBuildingWorkspace ? 'floor' : scaleForFormRules;
  const mapHostName = activeFloorName ?? loc.name;
  const buildingNeedsFloor = isBuildingWorkspace && floorChildren.length === 0;

  const stairWorkspaceInspect = buildStairWorkspaceInspect({
    isBuildingWorkspace,
    activeFloorId,
    floorChildren,
    loc,
    locationId,
    locations,
    mapHostLocationId,
  });

  const stairPairingContext =
    isBuildingWorkspace && activeFloorId && campaignId
      ? {
          connections: buildingStairConnections,
          campaignId,
          locations,
          onLink: handleLinkStairPair,
          onUnlink: handleUnlinkStairEndpoint,
        }
      : undefined;

  const mapAuthoringPanel = (
    <Stack spacing={2}>
      {mapEditor.mode === 'place' ? (
        <LocationMapEditorPlacePanel
          items={placePaletteItems}
          activePlace={mapEditor.activePlace}
          onSelectPlace={mapEditor.setActivePlace}
        />
      ) : mapEditor.mode === 'draw' ? (
        <LocationMapEditorDrawPanel
          items={drawPaletteItems}
          activeDraw={mapEditor.activeDraw}
          onSelectDraw={mapEditor.setActiveDraw}
        />
      ) : mapEditor.mode === 'paint' && mapEditor.activePaint ? (
        <LocationMapEditorPaintMapPanel
          paint={mapEditor.activePaint}
          regionEntries={gridDraft.regionEntries}
          onCreateRegion={handleCreateRegionPaint}
          onSelectActiveRegion={handleSelectActiveRegionPaint}
          onActiveRegionColorKeyChange={handleActiveRegionColorKeyChange}
          onEditRegionInSelection={handleEditRegionInSelection}
        />
      ) : mapEditor.mode === 'erase' ? (
        <Typography variant="body2" color="text.secondary">
          Click a cell to remove the topmost feature (edge, object, path segment, link, or terrain fill). Drag across
          cells to strip terrain fill in bulk.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Use the toolbar to choose a tool. Open Selection to inspect cells, paths, edges, and runs.
        </Typography>
      )}
    </Stack>
  );

  const selectionPanel = (
    <LocationEditorSelectionPanel
      selection={gridDraft.mapSelection}
      stairWorkspaceInspect={stairWorkspaceInspect}
      stairPairingContext={stairPairingContext}
      pathEntries={gridDraft.pathEntries}
      edgeEntries={gridDraft.edgeEntries}
      regionEntries={gridDraft.regionEntries}
      debouncedPersistableFlushRef={flushDebouncedPersistableFieldsRef}
      onUpdateRegionEntry={handleUpdateRegionEntry}
      onRemovePlacedObjectFromMap={handleRemovePlacedObject}
      onRemovePathFromMap={handleRemovePathFromMap}
      onRemoveEdgeFromMap={handleRemoveEdgeFromMap}
      onRemoveEdgeRunFromMap={handleRemoveEdgeRunFromMap}
      cellPanelProps={{
        selectedCellId: selectedCellIdForMapSelection(gridDraft.mapSelection),
        hostLocationId: mapHostLocationId,
        hostScale: mapHostScale,
        hostName: mapHostName,
        campaignId: campaignId ?? undefined,
        locations,
        linkedLocationByCellId: gridDraft.linkedLocationByCellId,
        objectsByCellId: gridDraft.objectsByCellId,
        onUpdateLinkedLocation: handleUpdateLinkedLocation,
        onUpdateCellObjects: handleUpdateCellObjects,
      }}
    />
  );

  const locationMapGrid = showMapGridAuthoring ? (
    <LocationGridAuthoringSection
      gridColumns={gridColumns}
      gridRows={gridRows}
      gridGeometry={gridGeometry}
      draft={gridDraft}
      setDraft={setGridDraft}
      locations={locations}
      campaignId={campaignId ?? undefined}
      hostLocationId={mapHostLocationId}
      hostScale={mapHostScale}
      hostName={mapHostName}
      onCellFocusRail={focusSelectionRailSection}
      mapEditorMode={mapEditor.mode}
      activePaint={mapEditor.activePaint}
      leftChromeWidthPx={leftMapChromeWidthPx}
      onPlaceCellClick={handleAuthoringCellClick}
      onEraseCellClick={handleEraseCell}
      placePathAnchorCellId={mapEditor.pathAnchorCellId}
      activeDraw={mapEditor.activeDraw}
      onEdgeStrokeCommit={handleEdgeStrokeCommit}
      onEraseEdge={handleEraseEdge}
      suppressCanvasPanOnCells={mapPlaceSuppressesCanvasPanOnCells}
      placeObjectDragStrokeEnabled={mapPlaceObjectDragStrokeEnabled}
      consumeClickSuppressionAfterPan={consumeClickSuppressionAfterPan}
    />
  ) : null;

  const mapCanvasInnerChildren =
    isBuildingWorkspace && buildingNeedsFloor ? (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          minHeight: 120,
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No floors yet. Use &quot;Add floor&quot; above to create the first map.
        </Typography>
      </Box>
    ) : (
      locationMapGrid
    );

  const mapCanvasColumn = (
    <LocationEditorMapCanvasColumn
      showMapEditorChrome={showMapEditorChrome}
      mode={mapEditor.mode}
      activePaint={mapEditor.activePaint}
      activeDraw={mapEditor.activeDraw}
      paintPaletteItems={paintPaletteItems}
      drawPaletteItems={drawPaletteItems}
      onPaintChange={handlePaintChange}
      onModeChange={handleMapEditorModeChange}
      onSelectDraw={mapEditor.setActiveDraw}
      zoom={zoom}
      pan={pan}
      panHandlers={pointerHandlers}
      isDragging={isDragging}
      wheelContainerRef={wheelContainerRef}
      zoomControlProps={zoomControlProps}
    >
      {mapCanvasInnerChildren}
    </LocationEditorMapCanvasColumn>
  );

  if (isSystem && driver) {
    return (
      <LocationEditSystemPatchWorkspace
        locationName={loc.name}
        locationPatched={loc.patched}
        ancestryBreadcrumbs={ancestryBreadcrumbs}
        saving={saving}
        dirty={authoringContract?.isDirty ?? false}
        saveDisabled={!authoringContract?.canSave}
        saveDisabledReason={authoringContract?.saveBlockReason ?? null}
        errors={errors}
        success={success}
        rightRailOpen={rightRailOpen}
        onToggleRightRail={() => setRightRailOpen((o) => !o)}
        onSave={handleHeaderSavePatch}
        onBack={handleBack}
        fieldConfigs={fieldConfigs}
        patchDriver={driver}
        validationApiRef={validationApiRef}
        hasExistingPatch={hasExistingPatch}
        onRemovePatch={handleRemovePatch}
        railSection={railSection}
        onRailSectionChange={setRailSection}
        mapCanvasColumn={mapCanvasColumn}
        mapAuthoringPanel={mapAuthoringPanel}
        selectionPanel={selectionPanel}
      />
    );
  }

  return (
    <LocationEditHomebrewWorkspace
      form={methods}
      formId={FORM_ID}
      onHomebrewSubmit={handleHomebrewSubmit}
      headerTitle={loc.name}
      ancestryBreadcrumbs={ancestryBreadcrumbs}
      saving={saving}
      dirty={authoringContract?.isDirty ?? false}
      errors={errors}
      success={success}
      rightRailOpen={rightRailOpen}
      onToggleRightRail={() => setRightRailOpen((o) => !o)}
      onSaveClick={handleHeaderSaveHomebrew}
      onBack={handleBack}
      saveDisabled={!authoringContract?.canSave}
      saveDisabledReason={authoringContract?.saveBlockReason ?? null}
      canDelete={canDelete}
      onRequestDelete={() => void handleRequestDelete()}
      deleteLoading={deleting}
      buildingFloorStrip={
        isBuildingWorkspace
          ? {
              floors: floorChildren,
              activeFloorId,
              onSelectFloor: setActiveFloorId,
              onAddFloor: handleAddFloor,
              adding: addingFloor,
              disabled: saving,
            }
          : null
      }
      mapCanvasColumn={mapCanvasColumn}
      railSection={railSection}
      onRailSectionChange={setRailSection}
      fieldConfigs={fieldConfigs}
      showFloorRailHint={Boolean(isBuildingWorkspace && activeFloorId)}
      floorRailHintLabel={activeFloorName ?? null}
      policyPanel={
        policyValue ? (
          <VisibilityField
            value={policyValue}
            onChange={handlePolicyChange}
            characters={policyCharacters}
          />
        ) : null
      }
      mapAuthoringPanel={mapAuthoringPanel}
      selectionPanel={selectionPanel}
      linkedLocationModal={{
        open: mapEditor.pendingPlacement != null,
        pending: mapEditor.pendingPlacement!,
        options: linkModalSelectOptions,
        onConfirm: (linkedLocationId) => {
          const p = mapEditor.pendingPlacement;
          if (!p || p.type !== 'linked-location') return;
          const cellId = p.targetCellId;
          setGridDraft((prev) => ({
            ...prev,
            linkedLocationByCellId: {
              ...prev.linkedLocationByCellId,
              [cellId]: linkedLocationId,
            },
          }));
          mapEditor.setPendingPlacement(null);
        },
        onCancel: () => mapEditor.setPendingPlacement(null),
      }}
      deleteConfirm={{
        open: deleteConfirmOpen,
        loading: deleting,
        onConfirm: async () => {
          setDeleting(true);
          try {
            await handleDelete();
          } finally {
            setDeleting(false);
            setDeleteConfirmOpen(false);
          }
        },
        onCancel: () => setDeleteConfirmOpen(false),
      }}
    />
  );
}
