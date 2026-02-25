import type { CharacterClass } from './types'
import { artificer } from './artificer'
import { barbarian } from './barbarian'
import { bard } from './bard'
import { fighter } from './fighter'
import { druid } from './druid' 
import { wizard } from './wizard'
import { cleric } from './cleric'
import { paladin } from './paladin'
import { rogue } from './rogue'
import { ranger } from './ranger'
import { monk } from './monk'
import { sorcerer } from './sorcerer'
import { thief } from './thief'
import { warlock } from './warlock'

export const classes: readonly CharacterClass[] = [
  { ...artificer },
  { ...barbarian },
  {...bard},
  {...cleric},
  {...druid},
  { ...fighter },

  /* ────────────────────────────── */
  /* GLADIATOR                      */
  /* ────────────────────────────── */
  {
    id: 'gladiator',
    name: 'Gladiator',
    definitions: [],
    requirements: [],
    proficiencies: []
  },
  { id: 'duskblade', name: 'Duskblade', definitions: [], requirements: [], proficiencies: [] },
  { ...monk },
  { ...paladin },
  {... ranger },
  { ...rogue },
  { ...sorcerer },
  { ...thief },
  { ...warlock },
  
  /* ────────────────────────────── */
  /* Warlord                        */
  /* ────────────────────────────── */
  {
    id: 'warlord',
    name: 'Warlord',
    definitions: [],
    requirements: [],
    proficiencies: []
  },
  { ...wizard }
]
