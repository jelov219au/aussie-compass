export const carPurchaseRecoveryStorageKey = "hoju_compass_car_purchase_pro_restore_retry_v1";
type Operation = "restore" | "restore-code" | "release";
export type CarPurchaseRecoveryState = {
  phase: "closed" | "idle" | "working" | "notice" | "restored" | "released";
  operation: Operation | null;
  message: string;
  issuedCode: string | null;
  expiresAt: string | null;
  canRestore: boolean;
  canManage: boolean;
};
type Retry = { v: 1; fingerprint: string; nonce: string; createdAt: number };
const codePattern = /^[A-Za-z0-9_-]{43}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const noncePattern = /^[A-Za-z0-9_-]{40,128}$/;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

// Browser-safe state only. Raw restore input is used for one POST, never persisted.
export function createCarPurchaseRecoveryClient(deps: {
  enabled: boolean;
  storage: { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };
  fingerprint: (code: string) => Promise<string>;
  createNonce: () => string;
  now: () => number;
  send: (operation: Operation, body: URLSearchParams) => Promise<{ status: number; json(): Promise<unknown> }>;
  navigate: (destination: string) => void;
  onState: (state: CarPurchaseRecoveryState) => void;
}) {
  let busy = false, disposed = false, released = false, restored = false;
  let operation: Operation | null = null;
  let phase: CarPurchaseRecoveryState["phase"] = deps.enabled ? "idle" : "closed";
  let message = deps.enabled ? "복구 코드를 사용하거나 현재 브라우저의 연결을 관리할 수 있습니다." : "현재 중고차 거래노트의 복구·연결 관리는 준비 중입니다.";
  let issuedCode: string | null = null, expiresAt: string | null = null;
  const publish = () => {
    if (!disposed) deps.onState({ phase, operation, message, issuedCode, expiresAt,
      canRestore: deps.enabled && !busy && !restored,
      canManage: deps.enabled && !busy && !released && !restored });
  };
  const notice = (value: string, next: CarPurchaseRecoveryState["phase"] = "notice") => { phase = next; message = value; publish(); };
  async function run(next: Operation, task: () => Promise<void>) {
    if (!deps.enabled || disposed || busy || restored || (next !== "restore" && released)) return;
    busy = true; operation = next;
    notice("요청 결과를 확인하고 있습니다…", "working");
    try { await task(); }
    catch {
      if (!disposed) notice(next === "release" ? "연결 해제 결과를 확인하지 못했습니다. 해제가 완료된 것으로 보지 말고 다시 확인해 주세요."
        : next === "restore" ? "복구 결과를 확인하지 못했습니다. 같은 코드와 같은 탭으로 재시도해 주세요. 다시 결제하지 마세요."
          : "코드 발급 결과를 확인하지 못했습니다. 잠시 후 다시 요청해 주세요.");
    } finally { busy = false; operation = null; publish(); }
  }
  async function retryNonce(code: string) {
    const fingerprint = await deps.fingerprint(code);
    if (disposed) return null;
    const now = deps.now();
    if (!hashPattern.test(fingerprint) || !Number.isFinite(now) || now < 0) throw new Error("Retry preparation unavailable.");
    const raw = deps.storage.getItem(carPurchaseRecoveryStorageKey);
    if (raw !== null) {
      const saved: unknown = JSON.parse(raw);
      if (!record(saved) || saved.v !== 1 || typeof saved.fingerprint !== "string" || !hashPattern.test(saved.fingerprint)
        || typeof saved.nonce !== "string" || !noncePattern.test(saved.nonce)
        || typeof saved.createdAt !== "number" || !Number.isFinite(saved.createdAt) || saved.createdAt < 0) throw new Error("Invalid retry record.");
      if (saved.fingerprint === fingerprint) {
        if (now < saved.createdAt || now - saved.createdAt > 24 * 60 * 60 * 1000) throw new Error("Expired retry record.");
        return saved.nonce;
      }
    }
    const nonce = deps.createNonce();
    if (!noncePattern.test(nonce)) throw new Error("Invalid retry nonce.");
    const retry: Retry = { v: 1, fingerprint, nonce, createdAt: now };
    const serialized = JSON.stringify(retry);
    deps.storage.setItem(carPurchaseRecoveryStorageKey, serialized);
    if (deps.storage.getItem(carPurchaseRecoveryStorageKey) !== serialized) throw new Error("Retry record was not persisted.");
    return nonce;
  }
  publish();
  return {
    async restore(rawCode: string) {
      await run("restore", async () => {
        const code = rawCode.trim();
        if (!codePattern.test(code)) return notice("43자리 복구 코드를 확인해 주세요. 코드나 구매 확인 주소를 공개하지 마세요.");
        let nonce: string | null;
        try { nonce = await retryNonce(code); }
        catch { return notice("재시도 정보를 안전하게 보관할 수 없거나 만료됐습니다. 새로 결제하지 말고 고객지원을 이용해 주세요."); }
        if (!nonce || disposed) return;
        const response = await deps.send("restore", new URLSearchParams({ restore_code: code, restore_nonce: nonce }));
        const body = await response.json();
        if (disposed) return;
        if (response.status === 200 && record(body) && body.code === "restore_ready" && body.destination === "/car-purchase-pro/workspace") {
          deps.navigate("/car-purchase-pro/workspace");
          try { deps.storage.removeItem(carPurchaseRecoveryStorageKey); } catch { /* Preserve the same retry if cleanup fails. */ }
          restored = true; issuedCode = null; expiresAt = null;
          return notice("이 브라우저의 복구를 확인했습니다. 작업공간으로 이동합니다.", "restored");
        }
        if (response.status === 409) return notice("이 코드로 이용권을 복구할 수 없습니다. 사용·만료·이용권 상태를 고객지원으로 확인해 주세요. 다시 결제하지 마세요.");
        if (response.status === 400 || response.status === 403) return notice("복구 코드나 요청을 확인할 수 없습니다. 같은 탭에서 입력을 확인하거나 고객지원을 이용해 주세요.");
        throw new Error("Unconfirmed restore.");
      });
    },
    async issueCode() {
      if (issuedCode) return;
      await run("restore-code", async () => {
        const response = await deps.send("restore-code", new URLSearchParams());
        const body = await response.json();
        if (disposed) return;
        const now = deps.now();
        if (response.status === 200 && record(body) && typeof body.code === "string" && codePattern.test(body.code)
          && typeof body.expiresAt === "string" && Number.isFinite(now) && now >= 0
          && Date.parse(body.expiresAt) > now && new Date(body.expiresAt).toISOString() === body.expiresAt) {
          issuedCode = body.code; expiresAt = body.expiresAt;
          return notice("발급된 코드를 직접 안전한 곳에 보관해 주세요. 이 화면을 닫으면 원문 코드를 다시 보여드릴 수 없습니다.");
        }
        if (response.status === 401) return notice("이 브라우저의 이용 연결을 확인할 수 없습니다. 보관한 코드로 복구하거나 고객지원을 이용해 주세요.");
        throw new Error("Unconfirmed issuance.");
      });
    },
    hideCode() { if (!busy && !disposed) { issuedCode = null; expiresAt = null; notice("화면에서 코드를 숨겼습니다. 서버의 복구 코드가 취소된 것은 아닙니다."); } },
    async release(confirmed: boolean) {
      await run("release", async () => {
        if (!confirmed) return notice("이 브라우저 연결을 해제한다는 안내를 먼저 확인해 주세요.");
        const response = await deps.send("release", new URLSearchParams());
        const body = await response.json();
        if (disposed) return;
        if (response.status !== 200 || !record(body) || body.released !== true || body.destination !== "/car-purchase-pro?access=released") throw new Error("Unconfirmed release.");
        released = true; issuedCode = null; expiresAt = null;
        notice("이 브라우저의 연결 해제를 확인했습니다. 복구하려면 보관한 코드를 사용해 주세요.", "released");
      });
    },
    dispose() { disposed = true; issuedCode = null; expiresAt = null; },
  };
}
