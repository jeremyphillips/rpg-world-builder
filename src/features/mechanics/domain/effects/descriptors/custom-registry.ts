import type { EffectDescriptor } from '@/features/content/domain/types'
import type { Effect } from '../effects.types'

type CustomDescriptor = Extract<EffectDescriptor, { kind: 'custom' }>

// TODO: Implement per-id custom descriptor handlers (e.g. flame tongue,
// vorpal sword, etc.) and register them here.
export function resolveCustomDescriptor(
  _descriptor: CustomDescriptor,
  _ctx: { source: string },
): Effect[] {
  return []
}
