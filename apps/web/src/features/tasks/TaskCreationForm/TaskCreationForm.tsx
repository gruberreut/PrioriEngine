import { useState, useEffect } from "react";
import { Button } from "../../../components/Button/Button";
import { Select } from "../../../components/Select/Select";
import { TextInput } from "../../../components/TextInput/TextInput";
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
  defaultContextId?: string | null;
}

const NEW_CONTEXT_VALUE = "__new__";

/**
 * `contexts` is the caller's list; `addedContexts` is this form's own record of
 * contexts it has created this session. Once a created context round-trips back
 * into `contexts` (as it does on the real task-creation page, which appends to its
 * own state after `onCreateContext` resolves), the two lists briefly overlap by id —
 * dedupe here rather than assuming the caller never reflects it back.
 */
export function mergeContexts(contexts: ContextItem[], addedContexts: ContextItem[]): ContextItem[] {
  const knownIds = new Set(contexts.map((c) => c.id));
  return [...contexts, ...addedContexts.filter((c) => !knownIds.has(c.id))];
}

export function TaskCreationForm({
  contexts,
  onSubmit,
  onCancel,
  onCreateContext,
  loading = false,
  defaultContextId,
}: TaskCreationFormProps) {
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [addedContexts, setAddedContexts] = useState<ContextItem[]>([]);
  const [contextId, setContextId] = useState<string | undefined>(defaultContextId ?? undefined);

  useEffect(() => {
    setContextId(defaultContextId ?? undefined);
  }, [defaultContextId]);
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
    if (contextLoading) return;
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

  const allContexts = mergeContexts(contexts, addedContexts);
  const contextOptions = [
    ...allContexts.map((c) => ({ label: c.name, value: c.id })),
    { label: "New context…", value: NEW_CONTEXT_VALUE },
  ];

  const disabled = loading || contextLoading;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextInput
        label="Title"
        hideLabel
        value={title}
        onChange={(val) => {
          setTitle(val);
          if (titleError) setTitleError(false);
        }}
        placeholder="What needs to be done?"
        disabled={disabled}
        error={titleError ? "Title is required" : undefined}
        autoFocus
      />

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
            <div className={styles.newContextField}>
              <TextInput
                label="Context name"
                hideLabel
                value={newContextName}
                onChange={setNewContextName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); void handleAddContext(); }
                  if (e.key === "Escape") handleCancelNewContext();
                }}
                placeholder="Context name"
                disabled={contextLoading}
                autoFocus
              />
            </div>
            <Button
              size="sm"
              onClick={() => void handleAddContext()}
              disabled={contextLoading || !newContextName.trim()}
            >
              Add
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelNewContext}
              disabled={contextLoading}
            >
              Cancel
            </Button>
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
        onChange={setLocation}
        disabled={disabled}
      />

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
        <Button type="submit" disabled={contextLoading} loading={loading}>
          Save task
        </Button>
      </div>
    </form>
  );
}
