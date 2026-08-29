import { useId, useState } from "react";
import { Select } from "../../../components/Select/Select";
import { EnergyPicker, type EnergyLevel } from "../../ranking/EnergyPicker/EnergyPicker";
import { LocationPicker, type LocationRequirement } from "../../ranking/LocationPicker/LocationPicker";
import { DurationPicker } from "../DurationPicker/DurationPicker";
import { PriorityPicker } from "../PriorityPicker/PriorityPicker";
import type { ContextItem } from "../../../services/contextService";
import styles from "./TaskCreationForm.module.css";

export interface TaskCreationPayload {
  title: string;
  contextId: string | null;
  priority: number;
  dueDate: string | null;
  duration: number;
  energyRequired: EnergyLevel;
  location: LocationRequirement;
}

export interface TaskCreationFormProps {
  contexts: ContextItem[];
  onSubmit: (payload: TaskCreationPayload) => void;
  onCancel: () => void;
  onCreateContext: (name: string) => Promise<ContextItem>;
  loading?: boolean;
}

const NEW_CONTEXT_VALUE = "__new__";

export function TaskCreationForm({
  contexts,
  onSubmit,
  onCancel,
  onCreateContext,
  loading = false,
}: TaskCreationFormProps) {
  const titleId = useId();
  const newContextId = useId();

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [addedContexts, setAddedContexts] = useState<ContextItem[]>([]);
  const [contextId, setContextId] = useState<string | undefined>(undefined);
  const [isCreatingContext, setIsCreatingContext] = useState(false);
  const [newContextName, setNewContextName] = useState("");
  const [contextLoading, setContextLoading] = useState(false);

  const [priority, setPriority] = useState(3);
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState(20);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [location, setLocation] = useState<LocationRequirement>("anywhere");

  function handleContextChange(value: string | undefined) {
    if (value === NEW_CONTEXT_VALUE) {
      setIsCreatingContext(true);
    } else {
      setContextId(value);
    }
  }

  async function handleAddContext() {
    const name = newContextName.trim();
    if (!name) return;
    setContextLoading(true);
    try {
      const created = await onCreateContext(name);
      setAddedContexts((prev) => [...prev, created]);
      setContextId(created.id);
      setIsCreatingContext(false);
      setNewContextName("");
    } finally {
      setContextLoading(false);
    }
  }

  function handleCancelNewContext() {
    setIsCreatingContext(false);
    setNewContextName("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    onSubmit({
      title: title.trim(),
      contextId: contextId ?? null,
      priority,
      dueDate: dueDate ?? null,
      duration,
      energyRequired: energy,
      location,
    });
  }

  const allContexts = [...contexts, ...addedContexts];
  const contextOptions = [
    ...allContexts.map((c) => ({ label: c.name, value: c.id })),
    { label: "New context…", value: NEW_CONTEXT_VALUE },
  ];

  const disabled = loading || contextLoading;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor={titleId} className={styles.label}>
          Title
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(false);
          }}
          className={`${styles.titleInput} ${titleError ? styles.inputError : ""}`}
          placeholder="What needs to be done?"
          disabled={disabled}
          autoFocus
        />
        {titleError && <span className={styles.errorText}>Title is required</span>}
      </div>

      <div className={styles.field}>
        <Select
          label="Context"
          options={contextOptions}
          value={contextId}
          onChange={handleContextChange}
          placeholder="No context"
          disabled={disabled}
        />
        {isCreatingContext && (
          <div className={styles.newContextRow}>
            <input
              id={newContextId}
              type="text"
              value={newContextName}
              onChange={(e) => setNewContextName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); void handleAddContext(); }
                if (e.key === "Escape") handleCancelNewContext();
              }}
              className={styles.newContextInput}
              placeholder="Context name"
              disabled={contextLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => void handleAddContext()}
              className={styles.addButton}
              disabled={contextLoading || !newContextName.trim()}
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleCancelNewContext}
              className={styles.cancelContextButton}
              disabled={contextLoading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <PriorityPicker
        label="Priority"
        value={priority}
        onChange={setPriority}
        dueDate={dueDate}
        onDueDateChange={setDueDate}
        disabled={disabled}
      />

      <DurationPicker
        label="Duration"
        value={duration}
        onChange={setDuration}
        disabled={disabled}
      />

      <EnergyPicker
        label="Energy"
        value={energy}
        onChange={setEnergy}
        disabled={disabled}
      />

      <LocationPicker
        label="Location"
        value={location}
        onChange={(val) => setLocation(val ?? "anywhere")}
        disabled={disabled}
      />

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={disabled}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton} disabled={disabled}>
          {loading ? "Saving…" : "Save task"}
        </button>
      </div>
    </form>
  );
}
