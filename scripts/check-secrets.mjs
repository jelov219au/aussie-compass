import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const trackedFiles = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  encoding: "utf8",
  windowsHide: true,
});

if (trackedFiles.status !== 0) {
  console.error("Unable to list source files for the secret scan.");
  process.exit(1);
}

const patterns = [
  {
    label: "Stripe secret or restricted API key",
    expression: /\b[rs]k_(?:test|live)_[A-Za-z0-9]{20,}\b/g,
  },
  {
    label: "Stripe webhook signing secret",
    expression: /\bwhsec_[A-Za-z0-9]{20,}\b/g,
  },
  {
    label: "Vercel automation bypass query",
    expression: /x-vercel-protection-bypass=[A-Za-z0-9_-]{16,}/g,
  },
  {
    label: "Vercel automation bypass environment value",
    expression: /VERCEL_AUTOMATION_BYPASS_SECRET\s*=\s*[A-Za-z0-9_-]{16,}/g,
  },
];

const findings = [];
const files = trackedFiles.stdout.split("\0").filter(Boolean);

for (const file of files) {
  let content;

  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  if (content.includes("\0")) continue;

  const lines = content.split(/\r?\n/);

  for (const { label, expression } of patterns) {
    for (let index = 0; index < lines.length; index += 1) {
      expression.lastIndex = 0;

      if (expression.test(lines[index])) {
        findings.push(`${file}:${index + 1} - ${label}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Potential credentials were found in tracked files:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Secret scan passed across ${files.length} tracked and untracked source files.`);
