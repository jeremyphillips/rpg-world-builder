/**
 * Side-effect: registers Vite-bundled `?url` for each PNG. Import from client entry before map UI loads.
 */
import { registerPlacedObjectRasterSourceFileToUrl } from './locationPlacedObjectRasterAssets.core';

const pngModules = import.meta.glob<{ default: string }>(
  '../../../../../../../assets/system/locations/objects/*.png',
  { eager: true, query: '?url', import: 'default' },
);

function resolveGlobModuleUrl(mod: unknown): string {
  if (typeof mod === 'string') return mod;
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const d = (mod as { default: unknown }).default;
    if (typeof d === 'string') return d;
  }
  return '';
}

function buildSourceFileToUrl(): Map<string, string> {
  const m = new Map<string, string>();
  for (const [p, mod] of Object.entries(pngModules)) {
    const base = p.split('/').pop();
    if (!base) continue;
    const url = resolveGlobModuleUrl(mod);
    if (url) m.set(base, url);
  }
  return m;
}

registerPlacedObjectRasterSourceFileToUrl(buildSourceFileToUrl());
