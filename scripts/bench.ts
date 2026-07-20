import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Bench } from "tinybench";
import * as acorn from "acorn";
import * as babel from "@babel/parser";
import * as oxc from "oxc-parser";
import swc from "@swc/core";
import type { ParseOptions as SwcParseOptions } from "@swc/types";
import { parse as yukuParseSync, type SourceLang } from "yuku-parser";

const FILES: Record<string, { path: string; lang: SourceLang }> = {
  typescript: { path: "files/typescript.js", lang: "js" },
  checker: { path: "files/checker.ts", lang: "ts" },
  react: { path: "files/react.js", lang: "js" },
};

const OXC_OPTIONS = { experimentalRawTransfer: true } as oxc.ParserOptions & {
  experimentalRawTransfer: true;
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

async function benchFile(
  fileKey: string,
  file: { path: string; lang: SourceLang },
): Promise<FileResult> {
  const source = await readFile(join(process.cwd(), file.path), "utf-8");
  const isTs = file.lang === "ts" || file.lang === "tsx";
  const isJsx = file.lang === "tsx";

  const bench = new Bench({ time: 5000, warmupTime: 1000 });

  if (!isTs) {
    bench.add("Acorn", () => {
      const { body: _ } = acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" });
    });
  }

  const babelPlugins: babel.ParserPlugin[] = [];
  if (isTs) babelPlugins.push("typescript");
  if (isJsx) babelPlugins.push("jsx");
  bench.add("Babel", () => {
    const { program: _ } = babel.parse(source, {
      sourceType: "module",
      plugins: babelPlugins,
      errorRecovery: isTs,
    });
  });

  const oxcFilename = isJsx ? "bench.tsx" : isTs ? "bench.ts" : "bench.js";
  bench.add("Oxc", () => {
    const { program: _ } = oxc.parseSync(oxcFilename, source, OXC_OPTIONS);
  });

  const swcSyntax: SwcParseOptions = isTs
    ? { syntax: "typescript", tsx: isJsx }
    : { syntax: "ecmascript" };
  bench.add("SWC", () => {
    const { body: _ } = swc.parseSync(source, swcSyntax);
  });

  const yukuOptions = file.lang === "js" ? undefined : { lang: file.lang };
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
  if (!oxc.rawTransferSupported()) {
    throw new Error("Oxc raw transfer is not supported on this platform");
  }

  const targetFiles = process.argv.slice(2);
  const filesToBench =
    targetFiles.length > 0
      ? Object.entries(FILES).filter(([key]) => targetFiles.includes(key))
      : Object.entries(FILES);

  await mkdir(join(process.cwd(), "result"), { recursive: true });

  for (const [key, file] of filesToBench) {
    const result = await benchFile(key, file);
    await writeFile(join(process.cwd(), "result", `${key}.json`), JSON.stringify(result, null, 2));
  }

  console.log("\nBenchmark complete!");
}

main().catch(console.error);
