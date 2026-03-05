import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useViewerProficiencies } from '@/features/campaign/hooks'
import { skillProficiencyRepo } from '@/features/content/domain/repo'
import type { SkillProficiency } from '@/features/content/domain/types'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'
import type { AbilityId } from '@/features/mechanics/domain/core/character/abilities.types'
import { abilityIdToName } from '@/features/mechanics/domain/core/character/abilities.utils'
import { AppDataGrid } from '@/ui/patterns'
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns'
import { makeOwnedColumn, makeOwnedFilter } from '@/ui/patterns'
import { AppPageHeader } from '@/ui/patterns'
import { useBreadcrumbs } from '@/hooks'
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities'
import { AppAlert, AppBadge } from '@/ui/primitives'

export default function SkillProficiencyListRoute() {
  const { campaign, campaignId } = useActiveCampaign()
  const navigate = useNavigate()
  const breadcrumbs = useBreadcrumbs()
  const basePath = `/campaigns/${campaignId}/world/skill-proficiencies`

  const ctx = toViewerContext(campaign?.viewer)
  const canManage = canManageContent(ctx)

  const { catalog } = useCampaignRules()
  const { skills: ownedIds } = useViewerProficiencies()
  const hasViewer = ownedIds.size > 0

  const [items, setItems] = useState<SkillProficiency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false
    setLoading(true)

    skillProficiencyRepo
      .listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [campaignId])

  const abilityOptions = useMemo(() => {
    const abilities = [...new Set(items.map((i) => i.ability))].sort()
    return [
      { label: 'All', value: '' },
      ...abilities.map((a) => ({ label: abilityIdToName(a), value: a })),
    ]
  }, [items])

  const suggestedClassOptions = useMemo(() => {
    const classIds = [...new Set(items.flatMap((i) => i.suggestedClasses ?? []))].sort()
    return classIds.map((id) => ({
      label: catalog.classesById[id]?.name ?? id,
      value: id,
    }))
  }, [items, catalog.classesById])

  const tagOptions = useMemo(() => {
    const tags = [...new Set(items.flatMap((i) => i.tags ?? []))].sort()
    return tags.map((tag) => ({ label: tag, value: tag }))
  }, [items])

  const columns: AppDataGridColumn<SkillProficiency>[] = useMemo(() => {
    const base: AppDataGridColumn<SkillProficiency>[] = [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, linkColumn: true },
      {
        field: 'ability',
        headerName: 'Ability',
        width: 120,
        valueFormatter: (v) => (v ? abilityIdToName(v as AbilityId) : '—'),
      },
      {
        field: 'suggestedClasses',
        headerName: 'Suggested Classes',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          const arr = params.value as string[] | undefined
          if (!arr?.length) return '—'
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {arr.map((id) => (
                <AppBadge
                  key={id}
                  label={catalog.classesById[id]?.name ?? id}
                  tone="default"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )
        },
        valueFormatter: (v) =>
          Array.isArray(v) && v.length > 0 ? (v as string[]).join(', ') : '—',
      },
      {
        field: 'tags',
        headerName: 'Tags',
        width: 200,
        renderCell: (params) => {
          const arr = params.value as string[] | undefined
          if (!arr?.length) return '—'
          const displayTags = arr.slice(0, 2)
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {displayTags.map((tag) => (
                <AppBadge
                  key={tag}
                  label={tag}
                  tone="default"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )
        },
        valueFormatter: (v) =>
          Array.isArray(v) && v.length > 0 ? (v as string[]).join(', ') : '—',
      },
    ]
    if (hasViewer) base.push(makeOwnedColumn<SkillProficiency>({ ownedIds }))
    return base
  }, [ownedIds, hasViewer, catalog.classesById])

  const filters: AppDataGridFilter<SkillProficiency>[] = useMemo(() => {
    const base: AppDataGridFilter<SkillProficiency>[] = [
      {
        id: 'ability',
        label: 'Ability',
        type: 'select' as const,
        options: abilityOptions,
        accessor: (r: SkillProficiency) => r.ability,
      },
      {
        id: 'suggestedClasses',
        label: 'Suggested for Class',
        type: 'multiSelect' as const,
        options: suggestedClassOptions,
        accessor: (r: SkillProficiency) => r.suggestedClasses ?? [],
      },
      {
        id: 'tags',
        label: 'Tag',
        type: 'multiSelect' as const,
        options: tagOptions,
        accessor: (r: SkillProficiency) => r.tags ?? [],
      },
    ]
    if (hasViewer) base.push(makeOwnedFilter<SkillProficiency>({ ownedIds: ownedIds }))
    return base
  }, [abilityOptions, suggestedClassOptions, tagOptions, ownedIds, hasViewer])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <AppAlert tone="danger">{error}</AppAlert>
  }

  return (
    <Box>
      <AppPageHeader
        headline="Skill Proficiencies"
        breadcrumbData={breadcrumbs}
        actions={[
          <Button
            key="back"
            component={Link}
            to={`/campaigns/${campaignId}/world`}
            size="small"
            startIcon={<ArrowBackIcon />}
          >
            World
          </Button>,
        ]}
      />
      <AppDataGrid
        rows={items}
        columns={columns}
        getRowId={(r) => r.id}
        getDetailLink={(r) => `${basePath}/${r.id}`}
        filters={filters}
        searchable
        searchPlaceholder="Search skills…"
        searchColumns={['name']}
        emptyMessage="No skill proficiencies found."
        density="compact"
        height={560}
        toolbar={
          canManage && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate(`${basePath}/new`)}
            >
              Add Skill Proficiency
            </Button>
          )
        }
      />
    </Box>
  )
}
