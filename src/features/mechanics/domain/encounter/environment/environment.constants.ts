export const ENVIRONMENT_SETTINGS = [
  { id: 'indoors', name: 'Indoors', description: 'Enclosed interior space' },
  { id: 'outdoors', name: 'Outdoors', description: 'Open exterior space' },
  { id: 'mixed', name: 'Mixed', description: 'Combination of indoor and outdoor' },
  { id: 'other', name: 'Other', description: 'Non-standard environment' },
] as const

export const LIGHTING_LEVELS = [
  { id: 'bright', name: 'Bright Light', description: 'Full visibility' },
  { id: 'dim', name: 'Dim Light', description: 'Lightly obscured' },
  { id: 'darkness', name: 'Darkness', description: 'Heavily obscured without darkvision' },
] as const

export const TERRAIN_MOVEMENT_TYPES = [
  { id: 'normal', name: 'Normal', description: 'Standard movement cost' },
  { id: 'difficult', name: 'Difficult', description: 'Costs double movement' },
  { id: 'greater-difficult', name: 'Greater Difficult', description: 'Costs triple movement' },
  { id: 'slippery', name: 'Slippery', description: 'Risk of falling prone' },
  { id: 'climb-required', name: 'Climb Required', description: 'Requires climbing movement' },
  { id: 'swim-required', name: 'Swim Required', description: 'Requires swimming movement' },
] as const

export const VISIBILITY_OBSCURED_LEVELS = [
  { id: 'none', name: 'Clear', description: 'No obscurement' },
  { id: 'light', name: 'Lightly Obscured', description: 'Disadvantage on Perception checks relying on sight' },
  { id: 'heavy', name: 'Heavily Obscured', description: 'Effectively blinded in the area' },
] as const

export const ATMOSPHERE_TAGS = [
  { id: 'high-wind', name: 'High Wind', description: 'Strong winds affecting ranged attacks and flight' },
  { id: 'underwater', name: 'Underwater', description: 'Submerged combat rules apply' },
  { id: 'sacred-ground', name: 'Sacred Ground', description: 'Hallowed or consecrated area' },
  { id: 'anti-magic', name: 'Anti-Magic', description: 'Spells and magical effects suppressed' },
  { id: 'extreme-cold', name: 'Extreme Cold', description: 'Constitution saves against exhaustion' },
  { id: 'extreme-heat', name: 'Extreme Heat', description: 'Constitution saves against exhaustion' },
] as const
