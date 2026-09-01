import { useEffect, useState } from "react";

/**
 * MDX docs pages (unlike CSF stories) never pass through preview.ts's
 * decorators, and Storybook's own preview hooks (useGlobals, etc.) can only
 * be called inside a decorator or story render function — not from plain
 * JSX in a doc body. So this page can't follow the toolbar theme control;
 * instead it owns a small local light/dark toggle, using ordinary React
 * state, that drives `data-theme` directly for live-token content on this
 * page (useTokenValue, etc.) to react to.
 */
export function ThemePreviewToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const optionStyle = (active: boolean) => ({
    padding: "4px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border-input)"}`,
    background: active ? "var(--color-primary-tint)" : "var(--color-bg-page)",
    color: active ? "var(--color-primary)" : "var(--color-text-muted)",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Preview:</span>
      <button type="button" style={optionStyle(theme === "light")} onClick={() => setTheme("light")}>
        Light
      </button>
      <button type="button" style={optionStyle(theme === "dark")} onClick={() => setTheme("dark")}>
        Dark
      </button>
    </div>
  );
}
