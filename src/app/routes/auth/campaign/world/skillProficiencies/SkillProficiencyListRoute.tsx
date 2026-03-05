import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
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
import { AppAlert } from '@/ui/primitives'

export default function SkillProficiencyListRoute() {
  const { campaignId } = useActiveCampaign()
  const breadcrumbs = useBreadcrumbs()
  const basePath = `/campaigns/${campaignId}/world/skill-proficiencies`

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
        valueFormatter: (v) =>
          Array.isArray(v) && v.length > 0 ? (v as string[]).join(', ') : '—',
      },
    ]
    if (hasViewer) base.push(makeOwnedColumn<SkillProficiency>({ ownedIds: ownedIds }))
    return base
  }, [ownedIds, hasViewer])

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
    ]
    if (hasViewer) base.push(makeOwnedFilter<SkillProficiency>({ ownedIds: ownedIds }))
    return base
  }, [abilityOptions, suggestedClassOptions, ownedIds, hasViewer])

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
      />
    </Box>
  )
}
