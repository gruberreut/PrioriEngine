import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./tokens.css', import.meta.url)), 'utf-8');

function customPropertyNames(block: string): Set<string> {
  const names = new Set<string>();
  for (const match of block.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
    names.add(match[1]);
  }
  return names;
}

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

describe('tokens.css dark-mode parity', () => {
  it('declares the same custom properties in [data-theme="dark"] and the prefers-color-scheme media block', () => {
    const explicitDarkBlock = extractBlock(css, /:root\[data-theme=['"]dark['"]\]\s*\{/);
    const mediaBlock = extractBlock(css, /@media \(prefers-color-scheme: dark\)\s*\{/);
    const autoDarkBlock = extractBlock(mediaBlock, /:root:not\(\[data-theme=['"]light['"]\]\)\s*\{/);

    const explicitNames = customPropertyNames(explicitDarkBlock);
    const autoNames = customPropertyNames(autoDarkBlock);

    expect(explicitNames.size).toBeGreaterThan(0);
    expect([...autoNames].sort()).toEqual([...explicitNames].sort());
  });
});
