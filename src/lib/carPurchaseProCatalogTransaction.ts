import "server-only";
import { carPrivilegeCatalogSql } from "./carPurchaseProReadinessPrivilegeCatalog";
import type { CarBoundCatalogQuery } from "./carPurchaseProReadinessEnvelope";

// A fresh, exclusively leased physical connection, already independently bound
// by the approved registry. quarantine() synchronously blocks reuse/results;
// close() separately confirms asynchronous driver shutdown. Neither a timeout
// nor application quarantine proves the remote server has stopped its query.
export type CarCatalogConnection = {
  binding: unknown;
  execute: (sql: string, values: readonly unknown[], signal: AbortSignal) => Promise<unknown>;
  quarantine: () => void;
  close: () => Promise<void>;
};
export type CarCatalogConnectionOpener = (signal: AbortSignal) => Promise<CarCatalogConnection>;
const unavailable = () => new Error("Catalog transaction unavailable.");
const identifier = (v: unknown): v is string => typeof v === "string" && /^[a-z_][a-z0-9_]{0,62}$/.test(v);
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
  && Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
function names(value: unknown, max: number): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.length <= max && value.every(identifier)
    && new Set(value).size === value.length;
}
function snapshot(value: unknown, max: number): unknown {
  const json = JSON.stringify(value);
  if (typeof json !== "string" || Buffer.byteLength(json, "utf8") > max) throw unavailable();
  return JSON.parse(json);
}
const setup = [
  "SET LOCAL statement_timeout = '5000ms'",
  "SET LOCAL lock_timeout = '1000ms'",
  "SET LOCAL idle_in_transaction_session_timeout = '5000ms'",
  "SET LOCAL search_path = pg_catalog, pg_temp",
] as const;

// Local orchestration only: no driver, DSN, credentials, registry or route wiring.
export function createCarCatalogTransaction(deps: {
  open: CarCatalogConnectionOpener | null; now?: () => number;
}): CarBoundCatalogQuery {
  const open = deps.open, now = deps.now ?? Date.now;
  return async request => {
    if (typeof open !== "function" || !exact(request, ["sql", "values", "options", "challenge"])
      || request.sql !== carPrivilegeCatalogSql || typeof request.challenge !== "string"
      || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(request.challenge)
      || !Array.isArray(request.values) || request.values.length !== 3 || !identifier(request.values[0])
      || !names(request.values[1], 256) || !names(request.values[2], 64)
      || !exact(request.options, ["readOnly", "isolation", "searchPath", "statementTimeoutMs", "lockTimeoutMs"])
      || request.options.readOnly !== true || request.options.isolation !== "repeatable read"
      || request.options.searchPath !== "pg_catalog, pg_temp" || request.options.statementTimeoutMs !== 5000
      || request.options.lockTimeoutMs !== 1000) throw unavailable();
    const values = Object.freeze([request.values[0], Object.freeze([...request.values[1]]), Object.freeze([...request.values[2]])]);
    const challenge = request.challenge, controller = new AbortController();
    let connection: CarCatalogConnection | null = null, expired = false;
    let closing: Promise<void> | null = null;
    let began = false, rollbackAttempted = false;
    const dispose = (): Promise<void> => {
      if (!connection) return Promise.resolve();
      if (!closing) {
        const lease = connection;
        // Quarantine happens synchronously even if close() never settles.
        let quarantineFailed = false;
        try { lease.quarantine(); } catch { quarantineFailed = true; }
        closing = Promise.resolve().then(async () => {
          await lease.close();
          if (quarantineFailed) throw unavailable();
        });
        // Deadline/late-acquisition cleanup may outlive the caller.
        void closing.catch(() => {});
      }
      return closing;
    };
    const check = () => { if (expired) throw unavailable(); };
    const execute = async (sql: string, parameters: readonly unknown[] = []) => {
      check();
      const result = await connection!.execute(sql, parameters, controller.signal);
      check();
      return result;
    };
    let timer: ReturnType<typeof setTimeout>;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        expired = true;
        controller.abort();
        void dispose();
        reject(unavailable());
      }, 10_000);
    });
    const work = async () => {
      try {
        connection = await open(controller.signal);
        check();
        if (!connection || typeof connection.execute !== "function" || typeof connection.quarantine !== "function"
          || typeof connection.close !== "function") throw unavailable();
        const binding = snapshot(connection.binding, 8192);
        await execute("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
        began = true;
        for (const sql of setup) await execute(sql);
        const rows = snapshot(await execute(carPrivilegeCatalogSql, values), 2_000_000);
        const observedAt = now();
        if (!Number.isSafeInteger(observedAt) || observedAt <= 0) throw unavailable();
        rollbackAttempted = true;
        await execute("ROLLBACK");
        return { binding, rows, challenge, observedAt };
      } catch {
        // Only issue cleanup SQL after a settled error. A timed-out in-flight
        // query is quarantined; never enqueue ROLLBACK behind that query.
        if (began && !rollbackAttempted && !expired) {
          rollbackAttempted = true;
          try { await execute("ROLLBACK"); } catch { /* Close below. */ }
        }
        throw unavailable();
      } finally {
        // Success cannot escape before close acknowledgement. Also closes a
        // late lease; after timeout this work may finish only in the background.
        await dispose();
        check();
      }
    };
    try { return await Promise.race([work(), deadline]); }
    catch { throw unavailable(); }
    finally { clearTimeout(timer!); }
  };
}
