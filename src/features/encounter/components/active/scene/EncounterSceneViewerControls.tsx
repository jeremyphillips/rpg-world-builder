import { useMemo, type Dispatch, type SetStateAction } from 'react'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppSelect } from '@/ui/primitives'

import type { EncounterState } from '@/features/mechanics/domain/combat'
import {
  getSpacesRegistry,
  resolvePlacementEncounterSpaceId,
} from '@/features/mechanics/domain/combat/space/encounter-spaces'

import type { SceneFocus } from '@/features/encounter/domain/sceneFocus.types'
import type { SceneViewerFollowMode } from '@/features/encounter/domain/sceneViewer.types'

export type EncounterSceneViewerControlsProps = {
  encounterState: EncounterState | null
  sceneFocus: SceneFocus
  setSceneFocus: Dispatch<SetStateAction<SceneFocus>>
  followMode: SceneViewerFollowMode
  setFollowMode: Dispatch<SetStateAction<SceneViewerFollowMode>>
}

const FOLLOW_LABEL: Record<SceneViewerFollowMode, string> = {
  manual: 'Manual scene',
  followSelectedCombatant: 'Follow selection / active',
  followControlledCombatant: 'Follow your characters',
}

/**
 * Phase C: local scene picker + follow mode. Does not mutate encounter state.
 *
 * TODO: multi-pane viewing; DM scene overview; pinned watchlists; toasts for off-screen events;
 * persisted per-user defaults; richer split-party roster hints.
 */
export function EncounterSceneViewerControls({
  encounterState,
  sceneFocus,
  setSceneFocus,
  followMode,
  setFollowMode,
}: EncounterSceneViewerControlsProps) {
  const registry = useMemo(() => (encounterState ? getSpacesRegistry(encounterState) : {}), [encounterState])
  const scenes = useMemo(() => Object.values(registry), [registry])

  const focusedSpaceId =
    sceneFocus.kind === 'pinnedScene'
      ? sceneFocus.encounterSpaceId
      : (encounterState?.space?.id ?? '')

  const focusedLabel = useMemo(() => {
    const s = scenes.find((x) => x.id === focusedSpaceId)
    return s?.name ?? 'Tactical scene'
  }, [scenes, focusedSpaceId])

  const { tokensHere, tokensElsewhere } = useMemo(() => {
    if (!encounterState?.placements?.length) return { tokensHere: 0, tokensElsewhere: 0 }
    let here = 0
    let elsewhere = 0
    for (const p of encounterState.placements) {
      const sid = resolvePlacementEncounterSpaceId(encounterState, p)
      if (sid === focusedSpaceId) here++
      else elsewhere++
    }
    return { tokensHere: here, tokensElsewhere: elsewhere }
  }, [encounterState, focusedSpaceId])

  const multiSpace = scenes.length > 1
  const splitParty = multiSpace && tokensElsewhere > 0 && tokensHere > 0

  if (!encounterState?.space) return null

  return (
    <Box
      sx={{
        width: '100%',
        py: 0.75,
        px: { xs: 1, sm: 2 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Viewing (local)
          </Typography>
          <Chip size="small" label={focusedLabel} variant="outlined" color="primary" />
          {multiSpace ? (
            <AppSelect
              label="Scene"
              value={focusedSpaceId}
              onChange={(id) => {
                const sp = registry[id]
                setFollowMode('manual')
                setSceneFocus({
                  kind: 'pinnedScene',
                  encounterSpaceId: id,
                  sceneLocationId: sp?.locationId ?? null,
                })
              }}
              options={scenes.map((s) => ({ value: s.id, label: s.name }))}
              size="small"
              fullWidth={false}
              sx={{ minWidth: 200 }}
            />
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <AppSelect
            label="Camera"
            value={followMode}
            onChange={(v) => setFollowMode(v as SceneViewerFollowMode)}
            options={(Object.keys(FOLLOW_LABEL) as SceneViewerFollowMode[]).map((k) => ({
              value: k,
              label: FOLLOW_LABEL[k],
            }))}
            size="small"
            fullWidth={false}
            sx={{ minWidth: 220 }}
          />
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        Only you see this view — authoritative positions may span multiple scenes.
        {splitParty
          ? ` ${tokensHere} token(s) on this scene, ${tokensElsewhere} elsewhere.`
          : multiSpace
            ? ' Other combatants may be on another scene.'
            : null}
      </Typography>
    </Box>
  )
}
