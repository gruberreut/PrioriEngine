import { useState, useEffect, useRef } from "react";
import { Carousel, type SwipeDirection } from "../../../components/Carousel/Carousel";
import { ParamsForm, type RankParams } from "../ParamsForm/ParamsForm";
import { ResultsSlide, type SlideState } from "../ResultsSlide/ResultsSlide";
import { rank, getContexts } from "../rankingService";
import type { RankResultMode } from "../ResultsPanel/ResultsPanel";
import styles from "./RankingPage.module.css";

interface SlideData {
  label: string;
  context: string | undefined;
  state: SlideState;
  result?: RankResultMode;
}

const SWIPE_DIRECTION: SwipeDirection = "ltr";

export function RankingPage() {
  const [contexts, setContexts] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const paramsRef = useRef<RankParams>({
    location: undefined,
    availableTime: 30,
    energy: "medium",
    explain: false,
  });
  const paramsVersionRef = useRef(0);
  const slidesRef = useRef<SlideData[]>([]);

  useEffect(() => {
    getContexts().then(setContexts).catch(() => {});
  }, []);

  useEffect(() => {
    const allSlide: SlideData = { label: "All", context: undefined, state: "idle" };
    const contextSlides: SlideData[] = contexts.map((c) => ({
      label: c,
      context: c,
      state: "idle",
    }));
    const next = [allSlide, ...contextSlides];
    setSlides(next);
    slidesRef.current = next;
  }, [contexts]);

  function handleParamsChange(params: RankParams) {
    paramsRef.current = params;
    paramsVersionRef.current++;
    setSlides((prev) => {
      const next = prev.map((s) => ({ ...s, state: "idle" as const, result: undefined }));
      slidesRef.current = next;
      return next;
    });
  }

  async function loadSlide(slideIndex: number) {
    const version = paramsVersionRef.current;

    setSlides((prev) => {
      const copy = [...prev];
      if (copy[slideIndex]) copy[slideIndex] = { ...copy[slideIndex], state: "loading" };
      slidesRef.current = copy;
      return copy;
    });

    try {
      const params = paramsRef.current;
      const slideContext = slidesRef.current[slideIndex]?.context;
      const result = await rank(params, slideContext);

      if (paramsVersionRef.current !== version) return;

      setSlides((prev) => {
        const copy = [...prev];
        if (copy[slideIndex]) copy[slideIndex] = { ...copy[slideIndex], state: "loaded", result };
        slidesRef.current = copy;
        return copy;
      });
    } catch {
      if (paramsVersionRef.current !== version) return;

      setSlides((prev) => {
        const copy = [...prev];
        if (copy[slideIndex]) copy[slideIndex] = { ...copy[slideIndex], state: "error" };
        slidesRef.current = copy;
        return copy;
      });
    }
  }

  function handleSlideChange(index: number) {
    setActiveIndex(index);
    const slideIndex = index - 1;
    if (slideIndex >= 0 && slides[slideIndex]?.state === "idle") {
      loadSlide(slideIndex);
    }
  }

  return (
    <div className={styles.page}>
      <Carousel
        activeIndex={activeIndex}
        onSlideChange={handleSlideChange}
        direction={SWIPE_DIRECTION}
        showDots
        swipeHint
      >
        <div className={styles.paramsSlide}>
          <ParamsForm onParamsChange={handleParamsChange} />
        </div>
        {slides.map((slide) => (
          <ResultsSlide
            key={slide.label}
            label={slide.label}
            state={slide.state}
            result={slide.result}
          />
        ))}
      </Carousel>
    </div>
  );
}
