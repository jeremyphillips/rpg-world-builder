/**
 * Side-effect: registers `file:` URLs for PNGs on Node/tsx (no `import.meta.glob`). Import first from `server/index.ts`.
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { registerPlacedObjectRasterSourceFileToUrl } from './locationPlacedObjectRasterAssets.core';

function buildNodeSourceFileToUrl(): Map<string, string> {
  const m = new Map<string, string>();
  let p = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 7; i++) {
    p = dirname(p);
  }
  const objectsDir = join(p, 'assets', 'system', 'locations', 'objects');
  if (!existsSync(objectsDir)) return m;
  for (const name of readdirSync(objectsDir)) {
    if (!name.endsWith('.png')) continue;
    const abs = join(objectsDir, name);
    m.set(name, pathToFileURL(abs).href);
  }
  return m;
}

registerPlacedObjectRasterSourceFileToUrl(buildNodeSourceFileToUrl());
