export type TriggerType =
  | 'attack'
  | 'weapon-hit'
  | 'hit'
  | 'damage-dealt'
  | 'damage-taken'
  | 'turn-start'
  | 'turn-end'
  | 'spell-cast'

export type TriggerInput =
  | TriggerType
  | 'on_attack'
  | 'on_weapon_hit'
  | 'on_hit'
  | 'on_damage_dealt'
  | 'on_damage_taken'
  | 'on_turn_start'
  | 'on_turn_end'
  | 'on_spell_cast'
  | 'weapon_hit'
  | 'damage_dealt'
  | 'damage_taken'
  | 'turn_start'
  | 'turn_end'
  | 'spell_cast'

const TRIGGER_INPUT_MAP: Record<TriggerInput, TriggerType> = {
  'attack': 'attack',
  'weapon-hit': 'weapon-hit',
  'hit': 'hit',
  'damage-dealt': 'damage-dealt',
  'damage-taken': 'damage-taken',
  'turn-start': 'turn-start',
  'turn-end': 'turn-end',
  'spell-cast': 'spell-cast',
  on_attack: 'attack',
  on_weapon_hit: 'weapon-hit',
  on_hit: 'hit',
  on_damage_dealt: 'damage-dealt',
  on_damage_taken: 'damage-taken',
  on_turn_start: 'turn-start',
  on_turn_end: 'turn-end',
  on_spell_cast: 'spell-cast',
  weapon_hit: 'weapon-hit',
  damage_dealt: 'damage-dealt',
  damage_taken: 'damage-taken',
  turn_start: 'turn-start',
  turn_end: 'turn-end',
  spell_cast: 'spell-cast',
}

export function normalizeTriggerType(trigger: TriggerInput): TriggerType {
  return TRIGGER_INPUT_MAP[trigger]
}
