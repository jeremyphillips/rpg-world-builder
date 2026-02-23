/**
 * Engine-owned build-option resolution.
 *
 * Composes three engine-owned steps:
 *  1. Edition gate   — read base IDs from edition data
 *  2. Setting rules  — apply override config (only / add / remove)
 *  3. Alias resolve  — map edition-era class names to canonical IDs
 *
 * The builder never encodes filtering rules itself; it calls these
 * functions and receives plain ID arrays.
 */
import type { EditionId } from '@/data/editions/edition.types'
import type { SettingId } from '@/data/types'
import type { OverrideConfig } from '@/data'
import { settings } from '@/data/settings'
import { resolveClassId } from '../../progression/reference/classAliases'
import { getEditionBaseRaceIds, getEditionBaseClassIds } from './edition-gate'
import { applySettingOverrides } from './setting-overrides'

// ---------------------------------------------------------------------------
// Internal: look up the setting override config for a given slot
// ---------------------------------------------------------------------------

function getSettingOverrides(
  settingId: SettingId | undefined,
  slot: 'races' | 'classes',
): OverrideConfig | undefined {
  if (!settingId) return undefined
  const setting = settings.find(s => s.id === settingId)
  if (!setting) return undefined
  return slot === 'races' ? setting.raceOverrides : setting.classOverrides
}

// ---------------------------------------------------------------------------
// Public API — named functions (no more stringly-typed callers)
// ---------------------------------------------------------------------------

export function getAllowedRaceIds(
  editionId?: EditionId,
  settingId?: SettingId,
): string[] {
  if (!editionId) return []
  const baseIds = getEditionBaseRaceIds(editionId)
  const overrides = getSettingOverrides(settingId, 'races')
  return applySettingOverrides(baseIds, overrides)
}

export function getAllowedClassIds(
  editionId?: EditionId,
  settingId?: SettingId,
): string[] {
  if (!editionId) return []
  const baseIds = getEditionBaseClassIds(editionId)
  const overrides = getSettingOverrides(settingId, 'classes')
  const ids = applySettingOverrides(baseIds, overrides)
  return ids.map(resolveClassId)
}

// ---------------------------------------------------------------------------
// Draft-first API (callers that already have a state/draft object)
// ---------------------------------------------------------------------------

export type { BuildDraft } from '../types'
import type { BuildDraft } from '../types'

export function getAllowedRaceIdsFromDraft(draft: BuildDraft): string[] {
  return getAllowedRaceIds(
    draft.edition as EditionId | undefined,
    draft.setting as SettingId | undefined,
  )
}

export function getAllowedClassIdsFromDraft(draft: BuildDraft): string[] {
  return getAllowedClassIds(
    draft.edition as EditionId | undefined,
    draft.setting as SettingId | undefined,
  )
}

// ---------------------------------------------------------------------------
// Legacy compat — kept for any remaining callers; prefer named functions
// ---------------------------------------------------------------------------

export type OptionType = 'races' | 'classes'

/** @deprecated Use getAllowedRaceIds / getAllowedClassIds instead. */
export function getBuildOptionIds(
  type: OptionType,
  editionId?: EditionId,
  settingId?: SettingId,
): string[] {
  return type === 'races'
    ? getAllowedRaceIds(editionId, settingId)
    : getAllowedClassIds(editionId, settingId)
}
