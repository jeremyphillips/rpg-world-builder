import type { EncounterToastEventKind, EncounterToastKindDefaults } from './encounter-toast-types'

const defaultsByKind: Record<EncounterToastEventKind, EncounterToastKindDefaults> = {
  action_resolved: {
    defaultVariant: 'standard',
    defaultAutoHideDuration: 8000,
    defaultShow: true,
  },
}

export function getEncounterToastKindDefaults(kind: EncounterToastEventKind): EncounterToastKindDefaults {
  return defaultsByKind[kind]
}
