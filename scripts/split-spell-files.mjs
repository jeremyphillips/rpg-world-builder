#!/usr/bin/env node
/**
 * Splits large spell data files into two alphabetical halves.
 * Run from project root: node scripts/split-spell-files.mjs
 *
 * Used for cantrips, level1-6. Level 7, 8, 9 stay as single files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../src/features/mechanics/domain/rulesets/system/spells/data');

const SPLITS = [
  { file: 'cantrips', count: 27, firstHalf: 13, firstSuffix: 'a-l', secondSuffix: 'm-z', varPrefix: 'SPELLS_LEVEL_0' },
  { file: 'level1', count: 57, firstHalf: 28, firstSuffix: 'a-l', secondSuffix: 'm-z', varPrefix: 'SPELLS_LEVEL_1' },
  { file: 'level2', count: 56, firstHalf: 28, firstSuffix: 'a-f', secondSuffix: 'g-z', varPrefix: 'SPELLS_LEVEL_2' },
  { file: 'level3', count: 42, firstHalf: 21, firstSuffix: 'a-l', secondSuffix: 'm-z', varPrefix: 'SPELLS_LEVEL_3' },
  { file: 'level4', count: 34, firstHalf: 17, firstSuffix: 'a-l', secondSuffix: 'm-z', varPrefix: 'SPELLS_LEVEL_4' },
  { file: 'level5', count: 38, firstHalf: 19, firstSuffix: 'a-l', secondSuffix: 'm-z', varPrefix: 'SPELLS_LEVEL_5' },
  { file: 'level6', count: 31, firstHalf: 15, firstSuffix: 'a-l', secondSuffix: 'm-z', varPrefix: 'SPELLS_LEVEL_6' },
];

function extractSpellObjects(content) {
  const spells = [];
  let depth = 0;
  let start = -1;
  let inArray = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (content.slice(i, i + 2) === '[ ' || content.slice(i, i + 2) === '[\n') {
      inArray = true;
      i++;
      continue;
    }
    if (inArray && char === '{' && (content[i - 1] === ' ' || content[i - 1] === '\n' || content[i - 1] === '[' || content[i - 1] === ',')) {
      if (depth === 0) start = i;
      depth++;
    } else if (inArray && char === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        spells.push(content.slice(start, i + 1).trimEnd());
      }
    }
  }
  return spells;
}

function getImports(content) {
  const importEnd = content.indexOf('export const');
  return content.slice(0, importEnd).trim();
}

function splitFile(config) {
  const filePath = path.join(DATA_DIR, `${config.file}.ts`);
  const content = fs.readFileSync(filePath, 'utf8');

  const ids = [...content.matchAll(/^\s+id: '([^']+)',/gm)].map((m) => m[1]);
  if (ids.length !== config.count) {
    console.warn(`Warning: ${config.file}.ts has ${ids.length} spells, expected ${config.count}`);
  }

  const splitIdx = config.firstHalf;
  const spells = extractSpellObjects(content);
  if (spells.length !== ids.length) {
    console.error(`Parse error: extracted ${spells.length} spells but found ${ids.length} ids in ${config.file}.ts`);
    return;
  }

  const firstSpells = spells.slice(0, splitIdx);
  const secondSpells = spells.slice(splitIdx);

  const imports = getImports(content);
  const varName = config.varPrefix;

  const firstVar = `${varName}_${config.firstSuffix.toUpperCase().replace(/-/g, '_')}`;
  const secondVar = `${varName}_${config.secondSuffix.toUpperCase().replace(/-/g, '_')}`;

  const firstContent = `${imports}

export const ${firstVar}: readonly SpellEntry[] = [
${firstSpells.map((s) => s.trimEnd().replace(/,\s*$/, '')).join(',\n')},
];
`;

  const secondContent = `${imports}

export const ${secondVar}: readonly SpellEntry[] = [
${secondSpells.map((s) => s.trimEnd().replace(/,\s*$/, '')).join(',\n')},
];
`;

  fs.writeFileSync(path.join(DATA_DIR, `${config.file}-${config.firstSuffix}.ts`), firstContent);
  fs.writeFileSync(path.join(DATA_DIR, `${config.file}-${config.secondSuffix}.ts`), secondContent);

  const typeImport = "import type { SpellEntry } from '../types';";
  const parentContent = `${typeImport}
import { ${firstVar} } from './${config.file}-${config.firstSuffix}';
import { ${secondVar} } from './${config.file}-${config.secondSuffix}';

export const ${varName}: readonly SpellEntry[] = [
  ...${firstVar},
  ...${secondVar},
];
`;

  fs.writeFileSync(filePath, parentContent);
  console.log(`Split ${config.file}.ts: ${firstSpells.length} + ${secondSpells.length} spells`);
}

// Only run if the parent file still has the full array (not already split)
const cantripsContent = fs.readFileSync(path.join(DATA_DIR, 'cantrips.ts'), 'utf8');
if (cantripsContent.includes("from './cantrips-a-l'")) {
  console.log('Files already split. Restore originals from git to re-run.');
} else {
  for (const config of SPLITS) {
    splitFile(config);
  }
}
