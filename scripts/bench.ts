import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Bench } from "tinybench";
import * as acorn from "acorn";
import * as babel from "@babel/parser";
import * as meriyah from "meriyah";
import * as oxc from "oxc-parser";
import swc from "@swc/core";
import type { ParseOptions as SwcParseOptions } from "@swc/types";
import { parse as yukuParseSync } from "yuku-parser";

type Lang = "js" | "tsx";

const FILES: Record<string, { path: string; lang: Lang }> = {
  typescript: { path: "files/typescript.js", lang: "js" },
  calcom: { path: "files/calcom.tsx", lang: "tsx" },
  react: { path: "files/react.js", lang: "js" },
};

interface BenchResult {
  name: string;
  mean: number;
  min: number;
  max: number;
  median: number;
  stddev: number;
  samples: number;
}

interface FileResult {
  file: string;
  results: BenchResult[];
}

async function benchFile(fileKey: string, file: { path: string; lang: Lang }): Promise<FileResult> {
  const source = await readFile(join(process.cwd(), file.path), "utf-8");
  const isTsx = file.lang === "tsx";

  const bench = new Bench({ time: 5000, warmupTime: 1000 });

  if (!isTsx) {
    bench.add("Acorn", () => {
      const { body: _ } = acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" });
    });
  }

  if (!isTsx) {
    bench.add("Meriyah", () => {
      const { body: _ } = meriyah.parse(source, { sourceType: "module", next: true });
    });
  }

  const babelPlugins: babel.ParserPlugin[] = isTsx ? ["typescript", "jsx"] : [];
  bench.add("Babel", () => {
    const { program: _ } = babel.parse(source, {
      sourceType: "module",
      plugins: babelPlugins,
      errorRecovery: isTsx,
    });
  });

  const oxcFilename = isTsx ? "bench.tsx" : "bench.js";
  bench.add("Oxc", () => {
    const { program: _ } = oxc.parseSync(oxcFilename, source);
  });

  const swcSyntax: SwcParseOptions = isTsx
    ? { syntax: "typescript", tsx: true }
    : { syntax: "ecmascript" };
  bench.add("SWC", () => {
    const { body: _ } = swc.parseSync(source, swcSyntax);
  });

  const yukuOptions = isTsx ? { lang: "tsx" as const } : undefined;
  bench.add("Yuku", () => {
    const { program: _ } = yukuParseSync(source, yukuOptions);
  });

  console.log(`\nBenchmarking ${fileKey}...`);
  await bench.run();

  console.table(bench.table());

  const results: BenchResult[] = [];
  for (const task of bench.tasks) {
    if (!task.result || task.result.state !== "completed") continue;
    results.push({
      name: task.name,
      mean: task.result.latency.mean,
      min: task.result.latency.min,
      max: task.result.latency.max,
      median: task.result.latency.p50,
      stddev: task.result.latency.sd,
      samples: task.result.latency.samplesCount,
    });
  }

  return { file: fileKey, results };
}

async function main() {
  const targetFiles = process.argv.slice(2);
  const filesToBench = targetFiles.length > 0
    ? Object.entries(FILES).filter(([key]) => targetFiles.includes(key))
    : Object.entries(FILES);

  await mkdir(join(process.cwd(), "result"), { recursive: true });

  for (const [key, file] of filesToBench) {
    const result = await benchFile(key, file);
    await writeFile(
      join(process.cwd(), "result", `${key}.json`),
      JSON.stringify(result, null, 2),
    );
  }

  console.log("\nBenchmark complete!");
}

main().catch(console.error);
