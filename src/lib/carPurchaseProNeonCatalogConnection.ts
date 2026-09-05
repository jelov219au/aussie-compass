import "server-only";
import { Client, type ClientConfig } from "@neondatabase/serverless";
import { createCarCatalogTransaction, type CarCatalogConnection, type CarCatalogConnectionOpener } from "./carPurchaseProCatalogTransaction";

const unavailable = () => new Error("Catalog connection unavailable.");
// A trusted deployment registry supplies these inputs. Matching DB/user here
// prevents accidental misrouting; it does not independently establish Neon
// project/branch identity or grant approval to contact a remote endpoint.
export function createCarNeonCatalogOpener(deps: {
  connectionString: unknown; binding: unknown;
}): CarCatalogConnectionOpener {
  let config: ClientConfig | null = null, bindingJson: string | null = null;
  try {
    if (typeof deps.connectionString !== "string" || deps.connectionString.length > 8192) throw unavailable();
    const url = new URL(deps.connectionString);
    const json = JSON.stringify(deps.binding);
    if (typeof json !== "string" || Buffer.byteLength(json) > 8192) throw unavailable();
    const binding = JSON.parse(json);
    if (!binding || typeof binding !== "object" || Array.isArray(binding)
      || !["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || !url.password
      || url.hash || url.pathname.length < 2 || url.pathname.slice(1).includes("/")
      || binding.databaseName !== decodeURIComponent(url.pathname.slice(1))
      || binding.inspectionRole !== decodeURIComponent(url.username)
      || [...url.searchParams.keys()].some(key => key !== "sslmode")
      || url.searchParams.getAll("sslmode").length > 1
      || (url.searchParams.has("sslmode") && !["require", "verify-full"].includes(url.searchParams.get("sslmode")!))) throw unavailable();
    config = { connectionString: deps.connectionString, connectionTimeoutMillis: 5000,
      statement_timeout: 5000, query_timeout: 5000, lock_timeout: 1000,
      idle_in_transaction_session_timeout: 5000, application_name: "car_readiness_catalog",
      options: "-c default_transaction_read_only=on" };
    bindingJson = json;
  } catch { /* Invalid inputs stay closed without constructing a driver. */ }
  return async signal => {
    if (!config || !bindingJson || !signal || signal.aborted) throw unavailable();
    let client: Client;
    try { client = new Client({ ...config }); }
    catch { throw unavailable(); }
    let quarantined = false, connected = false, connectingSettled = false, busy = false, driverFailed = false;
    let closing: Promise<void> | null = null;
    let rejectInterrupted!: (reason: Error) => void;
    const interrupted = new Promise<never>((_, reject) => { rejectInterrupted = reject; });
    void interrupted.catch(() => {});
    const quarantine = () => {
      if (!quarantined) { quarantined = true; rejectInterrupted(unavailable()); }
    };
    const check = () => { if (quarantined || signal.aborted) throw unavailable(); };
    const acquisition = Promise.resolve().then(() => {
      check();
      // Explicit per-client public option; no mutation of global neonConfig.
      client.neonConfig.useSecureWebSocket = true;
      return client.connect();
    }).then(() => { connectingSettled = true; connected = true; check(); }, () => {
      connectingSettled = true; throw unavailable();
    });
    const close = (): Promise<void> => {
      quarantine();
      if (!closing) {
        const pendingAcquisition = !connectingSettled;
        closing = Promise.resolve().then(async () => {
          try {
            try { await client.end(); }
            finally {
              // end() during acquisition may finish before a late connect().
              // End again after it settles; never return that connection.
              if (pendingAcquisition) { await acquisition.catch(() => {}); await client.end(); }
            }
            if (driverFailed) throw unavailable();
          } catch { throw unavailable(); }
          finally { signal.removeEventListener("abort", aborted); }
        });
        void closing.catch(() => {});
      }
      return closing;
    };
    const aborted = () => { quarantine(); void close(); };
    // Keep the sanitized error listener for late driver errors even after close.
    client.on("error", () => { driverFailed = true; aborted(); });
    client.on("end", () => { if (!quarantined) { driverFailed = true; aborted(); } });
    signal.addEventListener("abort", aborted, { once: true });
    const timer = setTimeout(aborted, 5000);
    try {
      check();
      await Promise.race([acquisition, interrupted]);
      check();
      const connection: CarCatalogConnection = {
        binding: JSON.parse(bindingJson), quarantine, close,
        execute: async (sql, values, requestSignal) => {
          try {
            check();
            if (!connected || busy || requestSignal !== signal) throw unavailable();
            busy = true;
            const result = await Promise.race([client.query(sql, [...values]), interrupted]);
            check();
            if (!result || !Array.isArray(result.rows)) throw unavailable();
            return result.rows;
          } catch { quarantine(); void close(); throw unavailable(); }
          finally { busy = false; }
        },
      };
      return connection;
    } catch { quarantine(); void close(); throw unavailable(); }
    finally { clearTimeout(timer); }
  };
}

// Ready to inject as the envelope's query port once the actual target and driver
// have been accepted. Factory creation itself does not connect or read env vars.
export function createCarNeonCatalogQuery(deps: Parameters<typeof createCarNeonCatalogOpener>[0] & { now?: () => number }) {
  return createCarCatalogTransaction({ open: createCarNeonCatalogOpener(deps), now: deps.now });
}
