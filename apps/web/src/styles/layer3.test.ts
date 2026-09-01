import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesDir = fileURLToPath(new URL('.', import.meta.url));
const srcDir = dirname(stylesDir);
const componentsDir = join(srcDir, 'components');

const css = readFileSync(join(stylesDir, 'tokens.css'), 'utf-8');

// Layer-2 categories a migrated component must route through Layer 3
// instead of referencing directly. --space-*, font families, and
// --motion-* are deliberately excluded - see CLAUDE.md § Design tokens.
const RESTRICTED_LAYER2 = /var\(\s*(--color-|--radius-|--shadow-|--control-height-|--focus-ring)/g;

function extractBlock(source: string, selectorPattern: RegExp): string {
  const selectorMatch = selectorPattern.exec(source);
  if (!selectorMatch) {
    throw new Error(`selector not found: ${selectorPattern}`);
  }
  const openBraceIndex = selectorMatch.index + selectorMatch[0].length;
  let depth = 1;
  let i = openBraceIndex;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
  }
  return source.slice(openBraceIndex, i - 1);
}

function layer3Groups(): { label: string; dir: string }[] {
  const block = extractBlock(css, /Layer 3: component tokens[\s\S]*?\*\/\s*:root\s*\{/);
  const groups: { label: string; dir: string }[] = [];
  for (const match of block.matchAll(/\/\*\s*([^—]+?)\s*—\s*components\/(\S+?)\s*\*\//g)) {
    groups.push({ label: match[1].trim(), dir: match[2].trim() });
  }
  return groups;
}

function moduleCssFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.module.css'))
    .map((f) => join(dir, f));
}

describe('Layer 3 component tokens', () => {
  const groups = layer3Groups();

  it('finds at least one migrated component group', () => {
    expect(groups.length).toBeGreaterThan(0);
  });

  it.each(groups)(
    'every group has a matching components/$dir directory ($label)',
    ({ dir }) => {
      expect(existsSync(join(componentsDir, dir))).toBe(true);
    }
  );

  it.each(groups)(
    "$dir's module CSS references Layer 3 tokens only, not Layer 2 directly ($label)",
    ({ dir }) => {
      const dirPath = join(componentsDir, dir);
      if (!existsSync(dirPath)) return; // already caught by the assertion above
      for (const file of moduleCssFiles(dirPath)) {
        const contents = readFileSync(file, 'utf-8');
        const violations = [...contents.matchAll(RESTRICTED_LAYER2)].map((m) => m[0]);
        expect(
          violations,
          `${file} references a Layer-2 token directly (${violations.join(', ')}) - ` +
            `migrated components must route through their own Layer-3 group instead. ` +
            `See documentation/DESIGN-TOKENS-BY-COMPONENT.md.`
        ).toEqual([]);
      }
    }
  );
});
