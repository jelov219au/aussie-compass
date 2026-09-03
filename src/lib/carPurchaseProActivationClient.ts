// Browser-safe orchestration only. No token signing, Stripe client or DB imports.
export const carPurchaseActivationStorageKey = "hoju_compass_car_purchase_pro_activation_v1";
export const carPurchaseActivationLifetimeMs = 24 * 60 * 60 * 1000;
const sessionPattern = /^cs_(test|live)_[A-Za-z0-9]{1,240}$/;
const noncePattern = /^[A-Za-z0-9_-]{40,128}$/;
export function validCarPurchaseSessionId(value: unknown): value is string {
  return typeof value === "string" && sessionPattern.test(value);
}
export type CarPurchaseActivationState = {
  phase: "initializing" | "ready" | "working" | "closed" | "missing" | "blocked" | "retry" | "success";
  message: string;
  canSubmit: boolean;
};
type Pending = { v: 1; sessionId: string; nonce: string; createdAt: number };
type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };
type Reply = { status: number; json(): Promise<unknown> };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function createCarPurchaseActivationClient(deps: {
  storage: Storage;
  createNonce: () => string;
  now: () => number;
  clearUrlReference: () => void;
  send: (body: URLSearchParams) => Promise<Reply>;
  navigate: (destination: string) => void;
  onState: (state: CarPurchaseActivationState) => void;
}) {
  let pending: Pending | null = null, busy = false, disposed = false, initialized = false, allowed = false;
  const emit = (phase: CarPurchaseActivationState["phase"], message: string, canSubmit = false) => {
    allowed = canSubmit;
    if (!disposed) deps.onState({ phase, message, canSubmit });
  };
  const retry = () => emit("retry", "연결 결과를 확인하지 못했습니다. 다시 결제하지 말고 같은 버튼으로 재시도해 주세요.", true);
  const current = (value: Pending) => {
    const age = deps.now() - value.createdAt;
    return Number.isFinite(age) && age >= 0 && age <= carPurchaseActivationLifetimeMs;
  };
  return {
    prepare(initialSessionId: string | undefined, invalidReference: boolean, enabled: boolean) {
      if (initialized || disposed) return;
      initialized = true;
      try {
        deps.clearUrlReference();
        if (!enabled) return emit("closed", "현재 중고차 거래노트의 이용권 연결은 준비 중입니다. 새 결제를 시도하지 마세요.");
        if (invalidReference || (initialSessionId !== undefined && !validCarPurchaseSessionId(initialSessionId))) {
          return emit("blocked", "구매 확인 주소를 읽을 수 없습니다. 주소를 공유하거나 새로 결제하지 말고 고객지원으로 확인해 주세요.");
        }
        const saved = deps.storage.getItem(carPurchaseActivationStorageKey);
        let previous: Pending | null = null;
        if (saved !== null) {
          const value: unknown = JSON.parse(saved);
          if (!record(value) || value.v !== 1 || !validCarPurchaseSessionId(value.sessionId)
            || typeof value.nonce !== "string" || !noncePattern.test(value.nonce)
            || typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt)) throw new Error("Invalid retry record.");
          previous = value as Pending;
        }
        if (previous && (!initialSessionId || initialSessionId === previous.sessionId)) {
          if (!current(previous)) return emit("blocked", "이 브라우저의 재시도 정보가 만료됐습니다. 다시 결제하지 말고 고객지원으로 확인해 주세요.");
          pending = previous;
        } else if (initialSessionId) {
          const nonce = deps.createNonce(), createdAt = deps.now();
          if (!noncePattern.test(nonce) || !Number.isFinite(createdAt) || createdAt < 0) throw new Error("Unable to prepare retry record.");
          pending = { v: 1, sessionId: initialSessionId, nonce, createdAt };
          const serialized = JSON.stringify(pending);
          deps.storage.setItem(carPurchaseActivationStorageKey, serialized);
          if (deps.storage.getItem(carPurchaseActivationStorageKey) !== serialized) throw new Error("Retry record was not persisted.");
        }
        if (!pending) return emit("missing", "이 탭에 구매 확인 정보가 없습니다. 결제 후 돌아온 원래 탭에서 확인하거나 고객지원을 이용해 주세요.");
        emit("ready", "버튼을 누르면 구매와 현재 이용권을 서버에서 확인합니다. 연결 전에는 결제 완료로 표시하지 않습니다.", true);
      } catch {
        pending = null;
        emit("blocked", "이 브라우저에서 재시도 정보를 안전하게 보관할 수 없습니다. 저장 설정을 확인하거나 고객지원을 이용해 주세요.");
      }
    },
    async submit() {
      if (disposed || busy || !allowed || !pending) return;
      busy = true;
      emit("working", "구매와 이용권 연결을 확인하고 있습니다…");
      try {
        if (!current(pending)) return emit("blocked", "재시도 정보가 만료됐습니다. 다시 결제하지 말고 고객지원으로 확인해 주세요.");
        const response = await deps.send(new URLSearchParams({ session_id: pending.sessionId, activation_nonce: pending.nonce }));
        const body = await response.json();
        if (disposed) return;
        if (response.status === 200 && record(body) && body.code === "activate_ready"
          && body.destination === "/car-purchase-pro/workspace") {
          deps.navigate("/car-purchase-pro/workspace");
          try { deps.storage.removeItem(carPurchaseActivationStorageKey); } catch { /* Keep the same nonce if storage cleanup is blocked. */ }
          pending = null;
          emit("success", "이 브라우저의 이용 연결을 확인했습니다. 작업공간으로 이동합니다.");
          return;
        }
        if (response.status === 409 && record(body) && body.code === "activate_denied") {
          return emit("blocked", "이 구매의 이용권을 연결할 수 없습니다. 기존 이용 기기나 고객지원에서 상태를 확인해 주세요. 다시 결제하지 마세요.");
        }
        if (response.status === 400 || response.status === 403) {
          return emit("blocked", "이 브라우저의 연결 요청을 확인할 수 없습니다. 새로 결제하지 말고 고객지원으로 확인해 주세요.");
        }
        retry();
      } catch { if (!disposed) retry(); }
      finally { busy = false; }
    },
    dispose() { disposed = true; allowed = false; },
  };
}
