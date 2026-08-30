import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Task } from "../../../types/task";
import { TaskCard } from "../../../entity/TaskCard/TaskCard";
import { Icon } from "../../../components/Icon/Icon";
import { Play } from "../../../assets/icons/Play";
import { getTasks, updateTask, splitTask } from "../../../services/taskService";
import { resolveTask } from "../resolveTask";
import styles from "./TaskDetailPage.module.css";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; task: Task; tasks: Task[] };

interface TaskDetailPageProps {
  taskId?: string;
  initialState?: State;
}

function getAncestors(task: Task, allTasks: Task[]): Task[] {
  const ancestors: Task[] = [];
  let current: Task | undefined = task;
  while (current?.parentId) {
    const parent = allTasks.find((t) => t.id === current!.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export function TaskDetailPage({ taskId: propTaskId, initialState }: TaskDetailPageProps) {
  const params = useParams<{ id: string }>();
  const id = propTaskId ?? params.id ?? "";
  const navigate = useNavigate();
  const [state, setState] = useState<State>(initialState ?? { status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (initialState) return;
    getTasks()
      .then((tasks) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) {
          setState({ status: "error", message: "Task not found" });
        } else {
          setState({ status: "loaded", task, tasks });
        }
      })
      .catch((err: unknown) =>
        setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" })
      );
  }, [id, initialState]);

  if (state.status === "loading") {
    return (
      <div className={styles.page}>
        <p className={styles.message}>Loading…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={styles.page}>
        <p className={`${styles.message} ${styles.error}`}>{state.message}</p>
      </div>
    );
  }

  const { task, tasks } = state;
  const ancestors = getAncestors(task, tasks);
  const cardTask: Task = { ...task, ...resolveTask(task, ancestors) };
  const anyInProgress = tasks.some((t) => t.status === "in_progress");

  async function handleStart() {
    setActionError(null);
    try {
      const updated = await updateTask(task.id, { status: "in_progress" });
      setState({ status: "loaded", task: updated, tasks: tasks.map((t) => (t.id === updated.id ? updated : t)) });
    } catch {
      setActionError("Failed to start task. Please try again.");
    }
  }

  async function handleSplit() {
    setActionError(null);
    const title = window.prompt("Name the new parent task:");
    if (!title?.trim()) return;
    try {
      const result = await splitTask(task.id, title.trim());
      navigate(`/tasks/${result.parent.id}`);
    } catch {
      setActionError("Failed to split task. Please try again.");
    }
  }

  const actions = [
    {
      id: "add-another",
      icon: "+",
      label: "Add another",
      color: undefined,
    },
    {
      id: "add-subtask",
      icon: "↳",
      label: "Add subtask",
      color: undefined,
    },
    {
      id: "split",
      icon: "✂",
      label: "Split",
      color: undefined,
    },
    {
      id: "start",
      icon: <Icon asset={Play} label="Start" size={20} />,
      label: "Start",
      color: anyInProgress || task.status === "in_progress" ? "var(--color-border)" : undefined,
    },
  ];

  function handleAction(actionId: string) {
    if (actionId === "add-another") {
      navigate("/tasks/new");
    } else if (actionId === "add-subtask") {
      navigate(`/tasks/new?parentId=${task.id}&parentTitle=${encodeURIComponent(task.title)}`);
    } else if (actionId === "split") {
      void handleSplit();
    } else if (actionId === "start") {
      if (!anyInProgress && task.status !== "in_progress") {
        void handleStart();
      }
    }
  }

  return (
    <div className={styles.page}>
      {actionError && <p className={`${styles.message} ${styles.error}`}>{actionError}</p>}
      <TaskCard
        task={cardTask}
        flavor="outlined"
        actions={actions}
        showActionLabels
        onAction={handleAction}
      />
    </div>
  );
}
