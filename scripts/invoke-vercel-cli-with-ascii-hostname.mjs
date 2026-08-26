import { existsSync, readFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import { delimiter, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const EXPECTED_VERCEL_VERSION = "59.5.0";
const SAFE_OPERATOR_HOSTNAME = "vercel-operator";

function findPinnedVercelCli() {
  for (const pathEntry of (process.env.PATH ?? "").split(delimiter)) {
    if (!pathEntry) continue;

    const packageRoot = resolve(pathEntry, "..", "vercel");
    const packageJsonPath = resolve(packageRoot, "package.json");
    const cliPath = resolve(packageRoot, "dist", "vc.js");
    if (!existsSync(packageJsonPath) || !existsSync(cliPath)) continue;

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      if (packageJson.name === "vercel" && packageJson.version === EXPECTED_VERCEL_VERSION) {
        return cliPath;
      }
    } catch {
      // Ignore malformed or unrelated PATH entries and continue fail-closed.
    }
  }

  return null;
}

os.hostname = () => SAFE_OPERATOR_HOSTNAME;
syncBuiltinESMExports();

const cliPath = findPinnedVercelCli();
if (!cliPath) {
  console.error("VERCEL_OPERATOR_CLI=FAIL reason=pinned_cli_unavailable secrets_printed=no");
  process.exit(1);
}

process.argv = [process.execPath, cliPath, ...process.argv.slice(2)];
await import(pathToFileURL(cliPath).href);
