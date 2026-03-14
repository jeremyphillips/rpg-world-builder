export type TriggerType =
  | 'attack'
  | 'weapon_hit'
  | 'hit'
  | 'damage_dealt'
  | 'damage_taken'
  | 'turn_start'
  | 'turn_end'
  | 'spell_cast'

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

const TRIGGER_INPUT_MAP: Record<TriggerInput, TriggerType> = {
  attack: 'attack',
  weapon_hit: 'weapon_hit',
  hit: 'hit',
  damage_dealt: 'damage_dealt',
  damage_taken: 'damage_taken',
  turn_start: 'turn_start',
  turn_end: 'turn_end',
  spell_cast: 'spell_cast',
  on_attack: 'attack',
  on_weapon_hit: 'weapon_hit',
  on_hit: 'hit',
  on_damage_dealt: 'damage_dealt',
  on_damage_taken: 'damage_taken',
  on_turn_start: 'turn_start',
  on_turn_end: 'turn_end',
  on_spell_cast: 'spell_cast',
}

export function normalizeTriggerType(trigger: TriggerInput): TriggerType {
  return TRIGGER_INPUT_MAP[trigger]
}
