import { useEffect, useId, useRef, useState } from "react";
import { Sheet } from "../Sheet/Sheet";
import { Skeleton } from "../Skeleton/Skeleton";
import { useIsWideContainer } from "./useIsWideContainer";
import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  /** Renders skeleton rows in place of the option list. */
  loading?: boolean;
  /** Shown in place of the option list when there are no rows and `loading` is false. */
  emptyTitle?: string;
  emptyDescription?: string;
}

interface Row {
  value: string | undefined;
  label: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  loading = false,
  emptyTitle = "Nothing to choose from",
  emptyDescription,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const labelId = `${listboxId}-label`;
  const isDesktop = useIsWideContainer(containerRef);

  // Placeholder, when given, is a real selectable row (clearing the value) -
  // not just a hint shown while nothing is picked.
  const rows: Row[] =
    placeholder !== undefined ? [{ value: undefined, label: placeholder }, ...options] : options;

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? placeholder;

  function openMenu() {
    if (disabled) return;
    const currentIndex = rows.findIndex((row) => row.value === value);
    setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleSelect(row: Row) {
    onChange(row.value);
    closeMenu();
  }

  // Desktop only - the mobile Sheet manages its own Escape/backdrop dismissal.
  useEffect(() => {
    if (!open || !isDesktop) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          closeMenu();
          break;
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, rows.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
        case " ": {
          event.preventDefault();
          const row = rows[highlightedIndex];
          if (row) handleSelect(row);
          break;
        }
        case "Tab":
          setOpen(false);
          break;
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDesktop, rows, highlightedIndex]);

  function renderOptionList(touch: boolean) {
    if (loading) {
      return (
        <div className={styles.skeletonList} aria-hidden="true">
          <Skeleton width="70%" height="12px" />
          <Skeleton width="45%" height="12px" />
          <Skeleton width="60%" height="12px" />
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>{emptyTitle}</div>
          {emptyDescription && <div className={styles.emptyDescription}>{emptyDescription}</div>}
        </div>
      );
    }

    return (
      <ul className={styles.optionList} role="listbox" id={listboxId} aria-labelledby={labelId}>
        {rows.map((row, index) => {
          const isSelected = row.value === value;
          return (
            <li
              key={row.value ?? "__placeholder__"}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={isSelected}
              className={[
                styles.option,
                touch ? styles.optionTouch : "",
                isSelected ? styles.optionSelected : "",
                !touch && index === highlightedIndex ? styles.optionHighlighted : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSelect(row)}
              onMouseEnter={() => !touch && setHighlightedIndex(index)}
            >
              <span className={styles.optionLabel}>{row.label}</span>
              {isSelected && (
                <svg className={styles.check} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M2.5 7.5L5.5 10.5L11.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <span className={styles.label} id={labelId}>
        {label}
      </span>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && isDesktop ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
      >
        <span className={[styles.value, !selected ? styles.placeholder : ""].filter(Boolean).join(" ")}>
          {displayLabel}
        </span>
        <svg
          className={[styles.caret, open ? styles.caretOpen : ""].filter(Boolean).join(" ")}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && isDesktop && <div className={styles.menu}>{renderOptionList(false)}</div>}

      {open && !isDesktop && (
        <Sheet open={open} onClose={closeMenu} title={label}>
          {renderOptionList(true)}
        </Sheet>
      )}
    </div>
  );
}
