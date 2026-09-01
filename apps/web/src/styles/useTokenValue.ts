import { useEffect, useState } from "react";

export function useTokenValue(name: string): string {
  const [value, setValue] = useState("");
  const theme = document.documentElement.dataset.theme;

  useEffect(() => {
    const read = () =>
      setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [name, theme]);

  return value;
}

export function listTokens(prefix = "--color-"): string[] {
  const out = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      for (const prop of Array.from(rule.style)) {
        if (prop.startsWith(prefix)) out.add(prop);
      }
    }
  }
  return [...out].sort();
}

function parseRgb(value: string): [number, number, number] | null {
  const match = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(colorA: string, colorB: string): number | null {
  const rgbA = parseRgb(colorA);
  const rgbB = parseRgb(colorB);
  if (!rgbA || !rgbB) return null;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}
