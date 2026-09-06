import { useState, useEffect, useRef } from "react";
import { Carousel, type SwipeDirection } from "../../../components/Carousel/Carousel";
import { ParamsForm, type RankParams } from "../ParamsForm/ParamsForm";
import { ResultsSlide, type SlideState } from "../ResultsSlide/ResultsSlide";
import { rank } from "../../../services/rankingService";
import { getContextItems, type ContextItem } from "../../../services/contextService";
import { updateTask, snoozeTask, deleteTask } from "../../../services/taskService";
import { ConfirmDialog } from "../../../components/ConfirmDialog/ConfirmDialog";
import type { Task } from "../../../types/task";
import type { RankResultMode } from "../ResultsPanel/ResultsPanel";
import styles from "./RankingPage.module.css";

const DELETE_CHILDREN_OPTIONS = [
  { label: "Keep subtasks", value: "reparent" as const, variant: "primary" as const },
  { label: "Delete subtasks too", value: "delete" as const, variant: "secondary" as const },
];

interface SlideData {
  label: string;
  context: string | undefined;
  slideIndex: number | undefined;
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
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const paramsRef = useRef<RankParams>({
    location: "home",
    availableTime: 30,
    energy: "medium",
    explain: false,
  });
  const paramsVersionRef = useRef(0);
  const slidesRef = useRef<SlideData[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getContextItems().then(setContexts).catch(() => {});
  }, []);

  useEffect(() => {
    // getContextItems() already returns contexts ordered by slideIndex, so
    // carousel pages display in the palette's intended ascending hue order.
    const allSlide: SlideData = { label: "All", context: undefined, slideIndex: undefined, state: "idle" };
    const contextSlides: SlideData[] = contexts.map((c) => ({
      label: c.name,
      context: c.name,
      slideIndex: c.slideIndex,
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

  async function handleInProgressAction(actionId: string, task: Task) {
    if (actionId === "complete") {
      try {
        await updateTask(task.id, { status: "completed" });
      } catch {
        return;
      }
      refreshAfterMutation();
      return;
    }

    if (actionId === "snooze") {
      try {
        await snoozeTask(task.id);
      } catch {
        return;
      }
      refreshAfterMutation();
      return;
    }

    if (actionId === "delete") {
      if (task.hasChildren) {
        setPendingDeleteId(task.id);
        return;
      }
      try {
        await deleteTask(task.id);
      } catch {
        return;
      }
      refreshAfterMutation();
    }
  }

  async function handleDeleteChildrenChoice(childAction: string) {
    const taskId = pendingDeleteId;
    setPendingDeleteId(null);
    if (!taskId) return;
    try {
      await deleteTask(taskId, childAction as "delete" | "reparent");
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
        {slides.map((slide) => (
          <ResultsSlide
            key={slide.label}
            label={slide.label}
            state={slide.state}
            result={slide.result}
            backgroundColor={SLIDE_PALETTE[(slide.slideIndex ?? 0) % SLIDE_PALETTE.length]}
            onStartTask={handleStartTask}
            onInProgressAction={handleInProgressAction}
          />
        ))}
      </Carousel>
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="This task has subtasks"
        description="What should happen to them?"
        options={DELETE_CHILDREN_OPTIONS}
        onSelect={handleDeleteChildrenChoice}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
