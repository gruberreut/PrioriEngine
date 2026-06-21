import { Children, useRef, useCallback, useEffect, useState } from "react";
import styles from "./Carousel.module.css";

export type SwipeDirection = "ltr" | "rtl";

export interface CarouselProps {
  children: React.ReactNode;
  activeIndex: number;
  onSlideChange: (index: number) => void;
  direction?: SwipeDirection;
  showDots?: boolean;
  swipeHint?: boolean;
}

export function Carousel({
  children: rawChildren,
  activeIndex,
  onSlideChange,
  direction = "ltr",
  showDots = false,
  swipeHint = false,
}: CarouselProps) {
  const children = Children.toArray(rawChildren);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container) return;
      const slideWidth = container.offsetWidth;
      const physicalIndex = direction === "rtl" ? children.length - 1 - index : index;
      container.scrollTo({ left: physicalIndex * slideWidth, behavior });
    },
    [direction, children.length]
  );

  useEffect(() => {
    scrollToIndex(activeIndex, "instant");
  }, [children.length]);

  useEffect(() => {
    if (!isScrolling) {
      scrollToIndex(activeIndex);
    }
  }, [activeIndex, scrollToIndex, isScrolling]);

  function handleScroll() {
    setIsScrolling(true);
    if (!hintDismissed) setHintDismissed(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      const container = containerRef.current;
      if (!container) return;
      const slideWidth = container.offsetWidth;
      const physicalIndex = Math.round(container.scrollLeft / slideWidth);
      const logicalIndex =
        direction === "rtl" ? children.length - 1 - physicalIndex : physicalIndex;
      if (logicalIndex !== activeIndex) {
        onSlideChange(logicalIndex);
      }
    }, 100);
  }

  const orderedChildren = direction === "rtl" ? [...children].reverse() : children;
  const showSwipeHint = swipeHint && !hintDismissed && activeIndex === 0;
  const hintDirection = direction === "rtl" ? "←" : "→";

  return (
    <div className={styles.wrapper}>
      <div className={styles.carouselContainer}>
        <div className={styles.carousel} ref={containerRef} onScroll={handleScroll}>
          {orderedChildren.map((child, i) => (
            <div key={i} className={styles.slide}>
              {child}
            </div>
          ))}
        </div>
      </div>
      {showSwipeHint && (
        <div className={styles.hint}>
          <span className={styles.hintArrow}>{hintDirection}</span>
          <span>Swipe for results</span>
        </div>
      )}
      {showDots && children.length > 1 && (
        <div className={styles.dots}>
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
              onClick={() => onSlideChange(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
