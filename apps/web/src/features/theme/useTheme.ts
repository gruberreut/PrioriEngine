import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "tendril-theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "auto";
}

function readStoredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : "auto";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  const bgPage = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-bg-page")
    .trim();
  if (meta && bgPage) {
    meta.setAttribute("content", bgPage);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
