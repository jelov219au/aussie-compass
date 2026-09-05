export type ResumeBuilderStorageStatus = "idle" | "saved" | "failed";
export type ResumeBuilderSaveResult = Exclude<ResumeBuilderStorageStatus, "idle">;

type TimerHandle = unknown;

type StatusControllerOptions = {
  onStatusChange: (status: ResumeBuilderStorageStatus) => void;
  schedule: (callback: () => void, delayMs: number) => TimerHandle;
  cancel: (handle: TimerHandle) => void;
  savedDurationMs?: number;
};

export type ResumeBuilderStorageStatusController = {
  record: (result: ResumeBuilderSaveResult) => void;
  reset: () => void;
  dispose: () => void;
  getSnapshot: () => { status: ResumeBuilderStorageStatus; generation: number };
};

export function createResumeBuilderStorageStatusController({
  onStatusChange,
  schedule,
  cancel,
  savedDurationMs = 1600,
}: StatusControllerOptions): ResumeBuilderStorageStatusController {
  let status: ResumeBuilderStorageStatus = "idle";
  let generation = 0;
  let timer: TimerHandle | null = null;
  let disposed = false;

  const emit = (nextStatus: ResumeBuilderStorageStatus) => {
    if (disposed || nextStatus === status) return;
    status = nextStatus;
    onStatusChange(nextStatus);
  };

  return {
    reset() {
      if (disposed) return;
      generation += 1;
      if (timer !== null) { cancel(timer); timer = null; }
      emit("idle");
    },
    record(result) {
      if (disposed) return;
      generation += 1;
      const attemptGeneration = generation;
      if (timer !== null) {
        cancel(timer);
        timer = null;
      }

      emit(result);
      if (result === "saved") {
        timer = schedule(() => {
          if (disposed || generation !== attemptGeneration) return;
          timer = null;
          emit("idle");
        }, savedDurationMs);
      }
    },
    dispose() {
      disposed = true;
      generation += 1;
      if (timer !== null) {
        cancel(timer);
        timer = null;
      }
    },
    getSnapshot() {
      return { status, generation };
    },
  };
}

export function persistResumeBuilderDraft(
  getStorage: () => Pick<Storage, "setItem">,
  key: string,
  serializedDraft: string,
  controller: ResumeBuilderStorageStatusController,
) {
  let result: ResumeBuilderSaveResult;
  try {
    getStorage().setItem(key, serializedDraft);
    result = "saved";
  } catch {
    result = "failed";
  }
  controller.record(result);
  return result;
}
