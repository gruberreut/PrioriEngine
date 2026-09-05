import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

// Container width, not viewport width - Select's presentation follows the
// space it's actually given (e.g. a narrow column on an otherwise-wide
// screen still gets the mobile sheet), per documentation/Tendril Select
// component.png § 9c's "min-width: 768px" line.
const DESKTOP_MIN_WIDTH = 768;

export function useIsWideContainer(ref: RefObject<HTMLElement | null>): boolean {
  const [isWide, setIsWide] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setIsWide(width >= DESKTOP_MIN_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return isWide;
}
