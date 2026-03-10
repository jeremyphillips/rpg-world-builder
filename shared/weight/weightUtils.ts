import type { WeightUnit, Weight } from './types'

const WEIGHT_TO_LB: Record<WeightUnit, number> = {
  lb: 1,
  oz: 1 / 16,
}

export const weightToLb = (weight?: Weight): number => {
  if (!weight) return 0
  return weight.value * WEIGHT_TO_LB[weight.unit as WeightUnit]
}
