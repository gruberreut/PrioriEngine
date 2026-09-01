import { useMemo } from "react";
import { useTokenValue, listTokens } from "./useTokenValue";

export interface ComponentTokensProps {
  /** e.g. "--bottom-nav-" — every custom property in tokens.css starting
   *  with this prefix is listed. */
  prefix: string;
}

function isColorValue(value: string): boolean {
  return value.startsWith("#") || value.startsWith("rgb");
}

function TokenRow({ token }: { token: string }) {
  const value = useTokenValue(token);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
      {isColorValue(value) && (
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "4px",
            background: value,
            border: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600 }}>{token}</span>
      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{value}</span>
    </div>
  );
}

/**
 * Self-documents a component's Layer-3 token group by listing whatever is
 * actually declared in tokens.css under the given prefix, with each value
 * resolved live through the cascade (so it follows the theme toolbar and
 * can't drift from what the component actually renders).
 */
export function ComponentTokens({ prefix }: ComponentTokensProps) {
  const tokens = useMemo(() => listTokens(prefix), [prefix]);

  if (tokens.length === 0) {
    return (
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
        No tokens found for prefix "{prefix}".
      </p>
    );
  }

  return (
    <div>
      {tokens.map((token) => (
        <TokenRow key={token} token={token} />
      ))}
    </div>
  );
}
