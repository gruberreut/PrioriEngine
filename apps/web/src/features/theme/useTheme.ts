import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";

declare global {
  interface Window {
    /** Dev-only escape hatch until a settings screen lets the user set this
     *  (see TASKS-FEATURES.md § 23). Call switchTheme('light' | 'dark' | 'auto') from the
     *  console. */
    switchTheme?: (theme: Theme) => void;
  }
}

const STORAGE_KEY = "tendril-theme";

// Crude day/night split standing in for a real preference until the
// settings screen above exists. No geolocation/sunrise-sunset lookup — just
// local wall-clock hours.
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 18;
const RECHECK_INTERVAL_MS = 15 * 60 * 1000;

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "auto";
}

function readStoredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : "auto";
}

function timeOfDayTheme(): "light" | "dark" {
  const hour = new Date().getHours();
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR ? "light" : "dark";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "auto" ? timeOfDayTheme() : theme;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = resolveTheme(theme);
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

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "auto") return;
    // re-resolve periodically so a long-open tab crosses the day/night
    // boundary without needing a reload
    const id = window.setInterval(() => applyTheme(theme), RECHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [theme]);

  useEffect(() => {
    window.switchTheme = setTheme;
    return () => {
      delete window.switchTheme;
    };
  }, [setTheme]);

  return { theme, setTheme };
}
