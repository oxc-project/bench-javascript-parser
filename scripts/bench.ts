import { spawnSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Bench } from "tinybench";
import * as acorn from "acorn";
import * as babel from "@babel/parser";
import * as oxc from "oxc-parser";
import * as oxbox from "oxbox";
import swc from "@swc/core";
import type { ParseOptions as SwcParseOptions } from "@swc/core";
import { parseSync as swcNextParseSync } from "@swc-next/parser";
import { parse as yukuParseSync, type SourceLang } from "yuku";

const FILES: Record<string, { path: string; lang: SourceLang }> = {
  typescript: { path: "files/typescript.js", lang: "js" },
  checker: { path: "files/checker.ts", lang: "ts" },
  lib_dom: { path: "files/lib.dom.d.ts", lang: "dts" },
  react: { path: "files/react.js", lang: "js" },
};

const BENCH_TIME = Number(process.env.BENCH_TIME ?? 10000);
const BENCH_WARMUP = Number(process.env.BENCH_WARMUP ?? 2000);
const BENCH_RUNS = Number(process.env.BENCH_RUNS ?? 3);

interface RunResult {
  name: string;
  mean: number;
  min: number;
  max: number;
  median: number;
  stddev: number;
  rme: number;
  samples: number;
}

interface BenchResult extends RunResult {
  runs: number;
}

interface FileResult {
  file: string;
  config: { time: number; warmupTime: number; runs: number };
  results: BenchResult[];
}

function isTsLang(lang: SourceLang): boolean {
  return lang === "ts" || lang === "tsx" || lang === "dts";
}

function parserNamesFor(lang: SourceLang): string[] {
  const names = [
    "Babel",
    "Oxc (default)",
    "Oxc (raw transfer)",
    "Oxbox (WASM)",
    "SWC",
    "SWC Next",
    "Yuku",
  ];
  return isTsLang(lang) ? names : ["Acorn", ...names];
}

function createParserTasks(source: string, lang: SourceLang): Record<string, () => void> {
  const isTs = isTsLang(lang);
  const isJsx = lang === "tsx";
  const isDts = lang === "dts";
  const tasks: Record<string, () => void> = {};

  if (!isTs) {
    tasks.Acorn = () => {
      const { body: _ } = acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" });
    };
  }

  const babelPlugins: babel.ParserPlugin[] = [];
  if (isTs) babelPlugins.push(isDts ? ["typescript", { dts: true }] : "typescript");
  if (isJsx) babelPlugins.push("jsx");
  tasks.Babel = () => {
    const { program: _ } = babel.parse(source, {
      sourceType: "module",
      plugins: babelPlugins,
      errorRecovery: isTs,
    });
  };

  const oxcFilename = isDts ? "bench.d.ts" : isJsx ? "bench.tsx" : isTs ? "bench.ts" : "bench.js";
  tasks["Oxc (default)"] = () => {
    const { program: _ } = oxc.parseSync(oxcFilename, source);
  };
  const oxcOptions = { experimentalRawTransfer: true } as oxc.ParserOptions & {
    experimentalRawTransfer: true;
  };
  tasks["Oxc (raw transfer)"] = () => {
    const { program: _ } = oxc.parseSync(oxcFilename, source, oxcOptions);
  };
  tasks["Oxbox (WASM)"] = () => {
    const { program: _ } = oxbox.parseSync(oxcFilename, source);
  };

  // Declaration files are parsed as scripts: SWC's binding throws on the
  // `...arguments` parameter names in lib.dom.d.ts when parsing as a module.
  // `isModule` is accepted by the binding but missing from the ParseOptions type.
  const swcSyntax: SwcParseOptions & { isModule?: boolean } = isTs
    ? { syntax: "typescript", tsx: isJsx, isModule: !isDts }
    : { syntax: "ecmascript" };
  tasks.SWC = () => {
    const { body: _ } = swc.parseSync(source, swcSyntax);
  };

  const swcNextOptions = { lang };
  tasks["SWC Next"] = () => {
    const { program: _ } = swcNextParseSync(source, swcNextOptions);
  };

  const yukuOptions = lang === "js" ? undefined : { lang };
  tasks.Yuku = () => {
    const { program: _ } = yukuParseSync(source, yukuOptions);
  };

  return tasks;
}

// Child mode: benchmark a single parser against a single file in a fresh
// process, so JIT state and GC pressure from one parser never affect another.
// Emits a single JSON object on stdout, all logging goes to stderr.

async function runTask(fileKey: string, parserName: string): Promise<void> {
  const file = FILES[fileKey];
  if (!file) throw new Error(`Unknown file: ${fileKey}`);

  const source = await readFile(join(process.cwd(), file.path), "utf-8");
  const tasks = createParserTasks(source, file.lang);
  const fn = tasks[parserName];
  if (!fn) throw new Error(`Parser ${parserName} does not support ${fileKey}`);

  const bench = new Bench({ time: BENCH_TIME, warmupTime: BENCH_WARMUP });
  bench.add(parserName, fn);
  await bench.run();

  const task = bench.tasks[0];
  if (!task?.result || task.result.state !== "completed") {
    throw new Error(`${parserName} did not complete ${fileKey}`, {
      cause: task?.result?.state === "errored" ? task.result.error : undefined,
    });
  }

  const latency = task.result.latency;
  const result: RunResult = {
    name: parserName,
    mean: latency.mean,
    min: latency.min,
    max: latency.max,
    median: latency.p50,
    stddev: latency.sd,
    rme: latency.rme,
    samples: latency.samplesCount,
  };
  process.stdout.write(JSON.stringify({ ok: true, result }));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function aggregateRuns(name: string, runs: RunResult[]): BenchResult {
  return {
    name,
    mean: median(runs.map((r) => r.mean)),
    min: Math.min(...runs.map((r) => r.min)),
    max: Math.max(...runs.map((r) => r.max)),
    median: median(runs.map((r) => r.median)),
    stddev: median(runs.map((r) => r.stddev)),
    rme: median(runs.map((r) => r.rme)),
    samples: runs.reduce((sum, r) => sum + r.samples, 0),
    runs: runs.length,
  };
}

async function benchFile(
  fileKey: string,
  file: { path: string; lang: SourceLang },
): Promise<FileResult> {
  console.log(`\nBenchmarking ${fileKey}...`);

  const results: BenchResult[] = [];
  for (const name of parserNamesFor(file.lang)) {
    const runs: RunResult[] = [];
    for (let run = 1; run <= BENCH_RUNS; run++) {
      console.log(`  ${name} (run ${run}/${BENCH_RUNS})`);
      const proc = spawnSync(
        process.execPath,
        [...process.execArgv, import.meta.filename, "--task", fileKey, name],
        { encoding: "utf-8", stdio: ["ignore", "pipe", "inherit"] },
      );
      if (proc.error) throw proc.error;
      if (proc.status !== 0) {
        throw new Error(`${name} run ${run} failed (${proc.signal ?? proc.status})`);
      }
      const out = JSON.parse(proc.stdout) as { ok: boolean; result?: RunResult };
      if (out.ok && out.result) runs.push(out.result);
      else throw new Error(`${name} run ${run} did not complete ${fileKey}`);
    }
    results.push(aggregateRuns(name, runs));
  }

  results.sort((a, b) => a.median - b.median);
  console.table(
    results.map((r) => ({
      Parser: r.name,
      "Median (ms)": r.median.toFixed(3),
      "±RME": `${r.rme.toFixed(2)}%`,
      Samples: r.samples,
      Runs: r.runs,
    })),
  );

  return {
    file: fileKey,
    config: { time: BENCH_TIME, warmupTime: BENCH_WARMUP, runs: BENCH_RUNS },
    results,
  };
}

async function main() {
  if (!Number.isFinite(BENCH_TIME) || BENCH_TIME <= 0) {
    throw new Error("BENCH_TIME must be a positive number of milliseconds");
  }
  if (!Number.isFinite(BENCH_WARMUP) || BENCH_WARMUP < 0) {
    throw new Error("BENCH_WARMUP must be a non-negative number of milliseconds");
  }
  if (!Number.isInteger(BENCH_RUNS) || BENCH_RUNS <= 0) {
    throw new Error("BENCH_RUNS must be a positive integer");
  }

  const args = process.argv.slice(2);

  if (args[0] === "--task") {
    const [, fileKey, parserName] = args;
    if (!fileKey || !parserName) throw new Error("Usage: bench.ts --task <file> <parser>");
    await runTask(fileKey, parserName);
    return;
  }

  if (!oxc.rawTransferSupported()) {
    throw new Error("Oxc raw transfer is not supported on this platform");
  }

  const unknownFiles = args.filter((key) => !Object.hasOwn(FILES, key));
  if (unknownFiles.length > 0) throw new Error(`Unknown files: ${unknownFiles.join(", ")}`);

  const filesToBench =
    args.length > 0
      ? Object.entries(FILES).filter(([key]) => args.includes(key))
      : Object.entries(FILES);

  await mkdir(join(process.cwd(), "result"), { recursive: true });

  for (const [key, file] of filesToBench) {
    const result = await benchFile(key, file);
    await writeFile(join(process.cwd(), "result", `${key}.json`), JSON.stringify(result, null, 2));
  }

  console.log("\nBenchmark complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
