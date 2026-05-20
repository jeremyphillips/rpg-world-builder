#!/usr/bin/env node
/**
 * Summarize dist/stats-data.json (rollup-plugin-visualizer raw-data) + dist/assets sizes.
 * Run after: npm run build:analyze
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const STATS_PATH = join(DIST, 'stats-data.json')
const ASSETS = join(DIST, 'assets')

function readStats() {
  try {
    return JSON.parse(readFileSync(STATS_PATH, 'utf8'))
  } catch {
    console.error('Missing dist/stats-data.json — run: npm run build:analyze')
    process.exit(1)
  }
}

function listAssetChunks() {
  const files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))
  return files
    .map((name) => {
      const path = join(ASSETS, name)
      const bytes = statSync(path).size
      const buf = readFileSync(path)
      const gzipBytes = gzipSync(buf).length
      return { name, bytes, gzipBytes }
    })
    .sort((a, b) => b.bytes - a.bytes)
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

/** Primary app entry: largest `index-*.js` by raw bytes (excludes tiny route index chunks). */
function findEntryChunk(assetChunks) {
  const indexChunks = assetChunks.filter((c) => /^index-/.test(c.name))
  return indexChunks.sort((a, b) => b.bytes - a.bytes)[0] ?? null
}

function topModulesInChunk(stats, chunkFileName) {
  const chunkKey = `assets/${chunkFileName}`
  const { nodeMetas = {}, nodeParts = {} } = stats
  const rows = []

  for (const meta of Object.values(nodeMetas)) {
    const partUid = meta.moduleParts?.[chunkKey]
    if (!partUid) continue
    const part = nodeParts[partUid]
    if (!part) continue
    rows.push({
      id: meta.id ?? partUid,
      gzipLength: part.gzipLength ?? 0,
      renderedLength: part.renderedLength ?? 0,
    })
  }

  return rows.sort((a, b) => b.gzipLength - a.gzipLength)
}

function chunkGzipFromStats(stats, chunkFileName) {
  const chunkKey = `assets/${chunkFileName}`
  let total = 0
  for (const part of Object.values(stats.nodeParts ?? {})) {
    const meta = stats.nodeMetas?.[part.metaUid]
    if (meta?.moduleParts?.[chunkKey]) {
      total += part.gzipLength ?? 0
    }
  }
  return total
}

const stats = readStats()
const assets = listAssetChunks()
const entry = findEntryChunk(assets)

console.log('=== Bundle baseline (post Phase 0 capture) ===\n')

if (entry) {
  const modules = topModulesInChunk(stats, entry.name)
  const statsGzip = chunkGzipFromStats(stats, entry.name)

  console.log(`Entry chunk: ${entry.name}`)
  console.log(`  raw:  ${formatKb(entry.bytes)}`)
  console.log(`  gzip: ${formatKb(entry.gzipBytes)} (file) / ${formatKb(statsGzip)} (sum of modules)\n`)
  console.log('Top 15 modules in entry chunk (gzip):\n')
  for (const [i, m] of modules.slice(0, 15).entries()) {
    console.log(`  ${String(i + 1).padStart(2)}. ${formatKb(m.gzipLength).padStart(10)}  ${m.id}`)
  }
}

console.log('\n=== Key chunks (raw / gzip) ===\n')
for (const a of assets.filter(
  (c) =>
    c.name.startsWith('vendor-') ||
    c.name.startsWith('system-catalog') ||
    c.name.startsWith('system-catalog-spells') ||
    c.name.startsWith('system-catalog-monsters') ||
    c.name === entry?.name,
)) {
  console.log(
    `  ${formatKb(a.bytes).padStart(10)} raw  ${formatKb(a.gzipBytes).padStart(10)} gzip  ${a.name}`,
  )
}

console.log('\n=== Treemap ===\n')
console.log('  Open dist/stats.html in a browser for the full breakdown.\n')
