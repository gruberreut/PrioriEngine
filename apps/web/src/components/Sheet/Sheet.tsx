import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import styles from "./Sheet.module.css";

// How far the panel must be dragged down, via its grabber, before it
// counts as a dismiss rather than springing back.
const DRAG_DISMISS_THRESHOLD = 80;

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Omitted sheets render no header at all - just the grabber above the
   *  content, matching the artboard's title-less rows. */
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleGrabberPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const panel = panelRef.current;
    if (!panel) return;
    const startY = event.clientY;

    function handlePointerMove(moveEvent: PointerEvent) {
      const delta = Math.max(0, moveEvent.clientY - startY);
      panel!.style.transform = `translateY(${delta}px)`;
    }

    function handlePointerUp(upEvent: PointerEvent) {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      const delta = Math.max(0, upEvent.clientY - startY);
      if (delta > DRAG_DISMISS_THRESHOLD) {
        onClose();
      } else {
        panel!.style.transform = "";
      }
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Decorative - Escape is the accessible dismiss path (a drag
         *  gesture has no keyboard equivalent anyway). This is a bonus
         *  pointer/touch affordance: tap or drag down to dismiss. */}
        <div
          className={styles.grabberRow}
          aria-hidden="true"
          onPointerDown={handleGrabberPointerDown}
          onClick={onClose}
        >
          <div className={styles.grabber} />
        </div>
        {title && (
          <div className={styles.header}>
            <div className={styles.title}>{title}</div>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
