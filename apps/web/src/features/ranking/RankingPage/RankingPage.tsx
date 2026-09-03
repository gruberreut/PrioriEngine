import { useState, useEffect, useRef } from "react";
import { Carousel, type SwipeDirection } from "../../../components/Carousel/Carousel";
import { ParamsForm, type RankParams } from "../ParamsForm/ParamsForm";
import { ResultsSlide, type SlideState } from "../ResultsSlide/ResultsSlide";
import { rank } from "../../../services/rankingService";
import { getContexts } from "../../../services/contextService";
import { updateTask } from "../../../services/taskService";
import type { RankResultMode } from "../ResultsPanel/ResultsPanel";
import styles from "./RankingPage.module.css";

interface SlideData {
  label: string;
  context: string | undefined;
  state: SlideState;
  result?: RankResultMode;
}

const SWIPE_DIRECTION: SwipeDirection = "ltr";

const SLIDE_PALETTE = [
  "var(--color-slide-0)",
  "var(--color-slide-1)",
  "var(--color-slide-2)",
  "var(--color-slide-3)",
  "var(--color-slide-4)",
  "var(--color-slide-5)",
  "var(--color-slide-6)",
  "var(--color-slide-7)",
];

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

  function refreshAfterMutation() {
    paramsVersionRef.current++;
    const next = slidesRef.current.map((s) => ({ ...s, state: "idle" as const, result: undefined }));
    slidesRef.current = next;
    setSlides(next);
    const slideIndex = activeIndex - 1;
    if (slideIndex >= 0) {
      loadSlide(slideIndex);
    }
  }

  async function handleStartTask(taskId: string) {
    try {
      await updateTask(taskId, { status: "in_progress" });
    } catch {
      return;
    }
    refreshAfterMutation();
  }

  async function handleInProgressAction(actionId: string, taskId: string) {
    if (actionId !== "complete") return;
    try {
      await updateTask(taskId, { status: "completed" });
    } catch {
      return;
    }
    refreshAfterMutation();
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
        <div className={styles.paramsSlide} style={{ backgroundColor: "var(--color-slide-params)" }}>
          <ParamsForm onParamsChange={handleParamsChange} />
        </div>
        {slides.map((slide, i) => (
          <ResultsSlide
            key={slide.label}
            label={slide.label}
            state={slide.state}
            result={slide.result}
            backgroundColor={SLIDE_PALETTE[i % SLIDE_PALETTE.length]}
            onStartTask={handleStartTask}
            onInProgressAction={handleInProgressAction}
          />
        ))}
      </Carousel>
    </div>
  );
}
