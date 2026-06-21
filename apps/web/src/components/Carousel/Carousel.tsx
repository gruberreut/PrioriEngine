import { useRef, useCallback, useEffect, useState } from "react";
import styles from "./Carousel.module.css";

export type SwipeDirection = "ltr" | "rtl";

export interface CarouselProps {
  children: React.ReactNode[];
  activeIndex: number;
  onSlideChange: (index: number) => void;
  direction?: SwipeDirection;
}

export function Carousel({
  children,
  activeIndex,
  onSlideChange,
  direction = "ltr",
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
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

  return (
    <div className={styles.carousel} ref={containerRef} onScroll={handleScroll}>
      {orderedChildren.map((child, i) => (
        <div key={i} className={styles.slide}>
          {child}
        </div>
      ))}
    </div>
  );
}
