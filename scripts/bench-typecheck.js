/**
 * Benchmarks TypeScript typechecking with `tsc` vs `tsgo`.
 *
 * Runs both binaries in parallel against the project's tsconfig.json
 * (with --noEmit), captures each one's duration and error count, then
 * prints per-tool output followed by a side-by-side summary.
 *
 * Motivation: compare wall-clock performance of stock `tsc` against the
 * Go-based `tsgo` on the same project.
 *
 * Exits non-zero if either typecheck failed.
 */

import { spawn } from "child_process";
import { performance } from "perf_hooks";

/**
 * Spawn a typecheck binary via npx and resolve with timing + error info.
 *
 * @param {string} label - Display name used in output (e.g. "tsc").
 * @param {string} bin   - npx-resolvable binary name (e.g. "tsc", "tsgo").
 */
function runTypecheck(label, bin) {
  console.log(`Running ${label} (${bin})...`);

  return new Promise((resolve) => {
    const startTime = performance.now();
    const child = spawn(
      "npx",
      [bin, "--project", "tsconfig.json", "--noEmit"],
      {
        stdio: ["inherit", "pipe", "pipe"],
        shell: process.platform === "win32",
      },
    );

    // Buffer stdout/stderr so both tools' output can be printed grouped
    // at the end, instead of interleaving while they run in parallel.
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data;
    });

    child.stderr.on("data", (data) => {
      stderr += data;
    });

    child.on("close", (code) => {
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      // tsc/tsgo error lines look like: `path/to/file.ts(12,3): error TS2304: ...`
      const errorCount = stdout
        .split("\n")
        .filter((line) => line.includes("error TS")).length;

      resolve({ label, bin, code, duration, errorCount, stdout, stderr });
    });
  });
}

// Run both typecheckers concurrently so the wall-clock comparison
// reflects what each tool can do in isolation on this machine.
const results = await Promise.all([
  runTypecheck("tsc", "tsc"),
  runTypecheck("tsgo", "tsgo"),
]);

// Per-tool detailed output (full stdout/stderr + duration + error count).
for (const result of results) {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`${result.label} (${result.bin})`);
  console.log("═".repeat(50));
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  console.log(`Type errors:  ${result.errorCount}`);
  console.log(`Duration:     ${result.duration}s`);
}

// Side-by-side summary — the actual point of the script.
console.log(`\n${"─".repeat(50)}`);
console.log("Summary");
console.log("─".repeat(50));
for (const result of results) {
  console.log(
    `${result.label.padEnd(6)} ${result.duration}s  (${result.errorCount} errors)`,
  );
}

// Propagate the first non-zero exit so this script can be used in CI.
const exitCode = results.find((r) => r.code !== 0)?.code ?? 0;
process.exit(exitCode);
