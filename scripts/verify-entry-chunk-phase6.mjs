#!/usr/bin/env node
/**
 * Phase 6 checks for entry chunk reduction (see docs/reference/build-baseline.md).
 * Requires: npm run build:analyze (populates dist/assets + dist/stats-data.json)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const ASSETS = join(DIST, 'assets')
const STATS_PATH = join(DIST, 'stats-data.json')

const BASELINE_ENTRY_GZIP_KB = 279
const TARGET_ENTRY_GZIP_KB = 200
const MIN_REDUCTION_RATIO = 0.3

const ENTRY_FORBIDDEN_MODULE_SUBSTRINGS = [
  'CharacterBuilderProvider.tsx',
  'ChatContainer.tsx',
  'rulesets/system/catalog.ts',
  'system-catalog',
]

function fail(msg) {
  console.error(`FAIL: ${msg}`)
  process.exitCode = 1
}

function pass(msg) {
  console.log(`OK: ${msg}`)
}

function readStats() {
  try {
    return JSON.parse(readFileSync(STATS_PATH, 'utf8'))
  } catch {
    fail('Missing dist/stats-data.json — run: npm run build:analyze')
    process.exit(1)
  }
}

function listIndexChunks() {
  return readdirSync(ASSETS)
    .filter((f) => /^index-.*\.js$/.test(f))
    .map((name) => {
      const path = join(ASSETS, name)
      const buf = readFileSync(path)
      return { name, bytes: statSync(path).size, gzipBytes: gzipSync(buf).length, text: buf.toString('utf8') }
    })
    .sort((a, b) => b.bytes - a.bytes)
}

function topModuleIds(stats, chunkFileName, limit = 30) {
  const chunkKey = `assets/${chunkFileName}`
  const { nodeMetas = {}, nodeParts = {} } = stats
  const rows = []
  for (const meta of Object.values(nodeMetas)) {
    const partUid = meta.moduleParts?.[chunkKey]
    if (!partUid) continue
    const part = nodeParts[partUid]
    if (!part) continue
    rows.push({ id: meta.id ?? partUid, gzipLength: part.gzipLength ?? 0 })
  }
  return rows.sort((a, b) => b.gzipLength - a.gzipLength).slice(0, limit)
}

function hasChunkMatching(pattern) {
  return readdirSync(ASSETS).some((f) => pattern.test(f))
}

console.log('=== Phase 6 — entry chunk verification ===\n')

const stats = readStats()
const indexChunks = listIndexChunks()
const entry = indexChunks[0]

if (!entry) {
  fail('No index-*.js entry chunk in dist/assets')
  process.exit(1)
}

const entryGzipKb = entry.gzipBytes / 1024
const reduction = 1 - entryGzipKb / BASELINE_ENTRY_GZIP_KB

console.log(`Entry: ${entry.name}`)
console.log(`  gzip: ${entryGzipKb.toFixed(1)} KB (baseline ${BASELINE_ENTRY_GZIP_KB} KB)\n`)

if (reduction >= MIN_REDUCTION_RATIO) {
  pass(`Entry gzip reduced ≥${(MIN_REDUCTION_RATIO * 100).toFixed(0)}% vs Phase 0 (${(reduction * 100).toFixed(1)}%)`)
} else {
  fail(`Entry gzip reduction ${(reduction * 100).toFixed(1)}% < ${(MIN_REDUCTION_RATIO * 100).toFixed(0)}% target`)
}

if (entryGzipKb < TARGET_ENTRY_GZIP_KB) {
  pass(`Entry gzip < ${TARGET_ENTRY_GZIP_KB} KB stretch target`)
} else {
  fail(`Entry gzip ${entryGzipKb.toFixed(1)} KB ≥ ${TARGET_ENTRY_GZIP_KB} KB stretch target`)
}

if (hasChunkMatching(/^system-catalog-/)) {
  pass('system-catalog is a separate async chunk')
} else {
  fail('Missing system-catalog-*.js chunk')
}

if (hasChunkMatching(/^system-catalog-spells-/)) {
  pass('system-catalog-spells is a separate async sub-chunk (Phase 1b)')
} else {
  fail('Missing system-catalog-spells-*.js chunk')
}

if (hasChunkMatching(/^system-catalog-monsters-/)) {
  pass('system-catalog-monsters is a separate async sub-chunk (Phase 1b)')
} else {
  fail('Missing system-catalog-monsters-*.js chunk')
}

if (hasChunkMatching(/^AuthLayout-/)) {
  pass('AuthLayout is lazy-loaded (separate chunk)')
} else {
  fail('Missing AuthLayout-*.js chunk')
}

const topModules = topModuleIds(stats, entry.name)
for (const forbidden of ENTRY_FORBIDDEN_MODULE_SUBSTRINGS) {
  const hit = topModules.find((m) => m.id.includes(forbidden))
  if (hit) {
    fail(`Entry treemap includes forbidden module: ${hit.id}`)
  }
}
pass('Entry treemap excludes builder/chat/catalog modules (top 30)')

if (entry.text.includes('rulesets/system/catalog')) {
  fail('Entry chunk inlines rulesets/system/catalog module path')
} else {
  pass('Entry chunk does not inline rulesets/system/catalog')
}

if (entry.text.includes('getSystemSpells') || entry.text.includes('getSystemMonsters')) {
  fail('Entry chunk references getSystemSpells/getSystemMonsters')
} else {
  pass('Entry chunk has no getSystemSpells/getSystemMonsters symbols')
}

const vendorReact = readdirSync(ASSETS).filter((f) => f.startsWith('vendor-react-'))
if (vendorReact.length === 1) {
  pass('Single vendor-react chunk')
} else {
  fail(`Expected one vendor-react chunk, found ${vendorReact.length}`)
}

console.log('\nManual smoke (browser):')
console.log('  /, /login, /dashboard → campaign → world equipment, /characters builder, encounter simulator')
console.log('  Confirm no duplicate-React hook errors.\n')

if (process.exitCode) {
  console.error('Phase 6 automated checks failed.\n')
  process.exit(1)
}

console.log('Phase 6 automated checks passed.\n')
