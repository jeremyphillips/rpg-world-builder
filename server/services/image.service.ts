import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { env } from '../shared/config/env'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_DIR = path.resolve(__dirname, '../../assets/uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const EXT_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

/**
 * Resolve a storage key to a public URL.
 *
 * - Returns `undefined` for falsy keys.
 * - Keys that already contain a path prefix (`/uploads/...`) or full URL (`http...`)
 *   are returned as-is for backward compatibility with existing data.
 * - Plain keys (e.g. `1702345-abc.jpg`) are prefixed with IMAGE_BASE_URL.
 */
export function getPublicUrl(key: string | null | undefined): string | undefined {
  if (!key) return undefined
  if (key.startsWith('/') || key.startsWith('http')) return key
  return `${env.IMAGE_BASE_URL}${key}`
}

/**
 * Normalize an image key by stripping known URL prefixes.
 *
 * Accepts raw keys, `/uploads/`-prefixed paths, and full URLs.
 * Returns the bare filename key suitable for DB storage, or `null` for empty values.
 * Pass-through for `undefined` so callers can distinguish "not provided" from "cleared".
 */
export function normalizeImageKey(val: string | null | undefined): string | null | undefined {
  if (val === undefined) return undefined
  if (!val) return null
  if (val.startsWith('/uploads/')) return val.slice('/uploads/'.length)
  if (val.startsWith('http')) {
    const idx = val.lastIndexOf('/uploads/')
    if (idx !== -1) return val.slice(idx + '/uploads/'.length)
  }
  return val
}

/**
 * Store an image buffer to local disk and return the storage key (filename only).
 *
 * When migrating to a CDN (e.g. Cloudflare R2), replace the fs write with an
 * API call to the object-storage provider — the returned key format stays the same.
 */
export async function upload(buffer: Buffer, contentType: string): Promise<string> {
  const ext = EXT_MAP[contentType] ?? '.png'
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const filepath = path.join(UPLOADS_DIR, key)

  fs.writeFileSync(filepath, buffer)

  return key
}

/**
 * Delete an image by its storage key.
 */
export async function remove(key: string): Promise<void> {
  if (!key) return

  // Handle legacy keys that include the /uploads/ prefix
  const filename = key.startsWith('/uploads/') ? key.slice('/uploads/'.length) : key
  const filepath = path.join(UPLOADS_DIR, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
  }
}
