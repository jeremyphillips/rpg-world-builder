import type { MonsterCatalogEntry } from '../types'
import { MONSTERS_A } from './monsters-a'
import { MONSTERS_B } from './monsters-b'
import { MONSTERS_C } from './monsters-c'
import { MONSTERS_D } from './monsters-d'
import { MONSTERS_E } from './monsters-e'
import { MONSTERS_F } from './monsters-f'
import { MONSTERS_G_I } from './monsters-g-i'
import { MONSTERS_J_L } from './monsters-j-l'
import { MONSTERS_M_O } from './monsters-m-o'
import { MONSTERS_P_R } from './monsters-p-r'
import { MONSTERS_S_U } from './monsters-s-u'
import { MONSTERS_V_Z } from './monsters-v-z'

/** Core system monsters (single-letter id shards under `./monsters-*.ts`). */
export const MONSTERS_CORE_DATA: readonly MonsterCatalogEntry[] = [
  ...MONSTERS_A,
  ...MONSTERS_B,
  ...MONSTERS_C,
  ...MONSTERS_D,
  ...MONSTERS_E,
  ...MONSTERS_F,
  ...MONSTERS_G_I,
  ...MONSTERS_J_L,
  ...MONSTERS_M_O,
  ...MONSTERS_P_R,
  ...MONSTERS_S_U,
  ...MONSTERS_V_Z,
]
