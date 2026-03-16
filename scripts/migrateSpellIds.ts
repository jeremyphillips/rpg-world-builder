/**
 * One-time migration: convert persisted spell IDs from legacy camelCase
 * to canonical kebab-case across all collections that reference spell IDs.
 *
 * Safe to run multiple times — only touches documents where a legacy spell ID
 * is found.
 *
 * Collections updated:
 *   - characters (classes[].spells, spells)
 *   - campaign_spells (spellId)
 *   - campaigns (any embedded spell references)
 *
 * Usage:
 *   npx tsx scripts/migrateSpellIds.ts
 *   DRY_RUN=1 npx tsx scripts/migrateSpellIds.ts  # log changes without writing
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME ?? 'dnd'
const DRY_RUN = process.env.DRY_RUN === '1'

const LEGACY_TO_CANONICAL: Record<string, string> = {
  fireBolt: 'fire-bolt',
  eldritchBlast: 'eldritch-blast',
  sacredFlame: 'sacred-flame',
  mageHand: 'mage-hand',
  magicMissile: 'magic-missile',
  cureWounds: 'cure-wounds',
  healingWord: 'healing-word',
  detectMagic: 'detect-magic',
  guidingBolt: 'guiding-bolt',
  charmPerson: 'charm-person',
  protectionFromEvil: 'protection-from-evil',
  featherFall: 'feather-fall',
  mistyStep: 'misty-step',
  spiritualWeapon: 'spiritual-weapon',
  holdPerson: 'hold-person',
  scorchingRay: 'scorching-ray',
  lesserRestoration: 'lesser-restoration',
  spiritGuardians: 'spirit-guardians',
  lightningBolt: 'lightning-bolt',
  dispelMagic: 'dispel-magic',
  removeCurse: 'remove-curse',
  dimensionDoor: 'dimension-door',
  iceStorm: 'ice-storm',
  wallOfForce: 'wall-of-force',
  greaterRestoration: 'greater-restoration',
  raiseDead: 'raise-dead',
  chainLightning: 'chain-lightning',
  powerWordStun: 'power-word-stun',
  powerWordKill: 'power-word-kill',
}

function migrateId(id: string): string {
  return LEGACY_TO_CANONICAL[id] ?? id
}

function migrateIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids)) return null
  let changed = false
  const result = ids.map((id) => {
    if (typeof id !== 'string') return id
    const canonical = migrateId(id)
    if (canonical !== id) changed = true
    return canonical
  })
  return changed ? result : null
}

async function migrateCharacterSpells(db: mongoose.Connection) {
  const collection = db.collection('characters')
  const cursor = collection.find({})
  let updated = 0

  for await (const doc of cursor) {
    const updates: Record<string, unknown> = {}

    const spells = migrateIds(doc.spells)
    if (spells) updates['spells'] = spells

    if (Array.isArray(doc.classes)) {
      doc.classes.forEach((cls: Record<string, unknown>, idx: number) => {
        const clsSpells = migrateIds(cls.spells)
        if (clsSpells) updates[`classes.${idx}.spells`] = clsSpells
      })
    }

    if (Object.keys(updates).length > 0) {
      console.log(`[character] ${doc._id}: updating ${Object.keys(updates).join(', ')}`)
      if (!DRY_RUN) {
        await collection.updateOne({ _id: doc._id }, { $set: updates })
      }
      updated++
    }
  }

  console.log(`[characters] ${updated} document(s) ${DRY_RUN ? 'would be' : ''} updated`)
}

async function migrateCampaignSpells(db: mongoose.Connection) {
  const collection = db.collection('campaign_spells')
  const legacyIds = Object.keys(LEGACY_TO_CANONICAL)
  const cursor = collection.find({ spellId: { $in: legacyIds } })
  let updated = 0

  for await (const doc of cursor) {
    const canonical = migrateId(doc.spellId)
    console.log(`[campaign_spell] ${doc._id}: ${doc.spellId} → ${canonical}`)
    if (!DRY_RUN) {
      await collection.updateOne({ _id: doc._id }, { $set: { spellId: canonical } })
    }
    updated++
  }

  console.log(`[campaign_spells] ${updated} document(s) ${DRY_RUN ? 'would be' : ''} updated`)
}

async function migrate() {
  await mongoose.connect(MONGO_URI)
  const db = mongoose.connection.useDb(DB_NAME)

  console.log(`Connected to ${MONGO_URI}/${DB_NAME}`)
  if (DRY_RUN) console.log('DRY RUN — no writes will be performed\n')

  await migrateCharacterSpells(db)
  await migrateCampaignSpells(db)

  await mongoose.disconnect()
  console.log('\nDone.')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
