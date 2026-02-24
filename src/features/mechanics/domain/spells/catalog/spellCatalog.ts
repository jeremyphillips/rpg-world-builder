/**
 * Single point of access for the spell catalog.
 *
 * All modules in the spells engine should import from here instead of
 * reaching into @/data directly. This makes it straightforward to swap
 * in a pre-indexed structure later without touching call sites.
 */
import { spellsCore as spells } from '@/data/spellsCore'

export { spells as spellCatalog }
