import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { arch, cpus, platform, release, totalmem } from "node:os";
import { join } from "node:path";

const FILES_SOURCE_URL_PREFIX =
  "https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main";

const PARSERS = {
  acorn: {
    name: "Acorn",
    description: "A tiny, fast JavaScript parser, written completely in JavaScript.",
    url: "https://github.com/acornjs/acorn",
  },
  babel: {
    name: "Babel",
    description: "A JavaScript compiler and parser used by the Babel toolchain.",
    url: "https://github.com/babel/babel/tree/main/packages/babel-parser",
  },
  oxc: {
    name: "Oxc (raw transfer)",
    description: "The native Oxc parser with experimental raw AST transfer enabled.",
    url: "https://github.com/oxc-project/oxc",
  },
  oxcDefault: {
    name: "Oxc (default)",
    description: "The native Oxc parser with its default AST transfer path.",
    url: "https://github.com/oxc-project/oxc",
  },
  oxbox: {
    name: "Oxbox (WASM)",
    description: "Oxc's parser packaged as a portable WebAssembly module.",
    url: "https://github.com/unjs/oxbox",
  },
  swc: {
    name: "SWC",
    description:
      "An extensible Rust-based platform for compiling and bundling JavaScript and TypeScript.",
    url: "https://github.com/swc-project/swc",
  },
  swcNext: {
    name: "SWC Next",
    description: "A Rust rewrite of SWC with a flat, ESTree-based AST, using @swc-next/parser.",
    url: "https://github.com/swc-project/swc-next",
  },
  yuku: {
    name: "Yuku",
    description:
      "A high-performance & spec-compliant JavaScript/TypeScript compiler written in Zig.",
    url: "https://github.com/yuku-toolchain/yuku",
  },
} as const;

const CHART_COLORS: Record<string, string> = {
  acorn: "#4CC9F0",
  babel: "#7209B7",
  oxc: "#F72585",
  oxcDefault: "#F78DB6",
  oxbox: "#9D4EDD",
  swc: "#3A86FF",
  swcNext: "#06D6A0",
  yuku: "#FF6B35",
};

const NAME_TO_KEY: Record<string, string> = {
  Acorn: "acorn",
  Babel: "babel",
  Oxc: "oxc",
  "Oxc (raw transfer)": "oxc",
  "Oxc (default)": "oxcDefault",
  "Oxbox (WASM)": "oxbox",
  SWC: "swc",
  "SWC Next": "swcNext",
  Yuku: "yuku",
};

const FILES = {
  typescript: {
    path: "files/typescript.js",
    source_url: `${FILES_SOURCE_URL_PREFIX}/typescript.js`,
  },
  checker: {
    path: "files/checker.ts",
    source_url: `${FILES_SOURCE_URL_PREFIX}/checker.ts`,
  },
  lib_dom: {
    path: "files/lib.dom.d.ts",
    source_url: `${FILES_SOURCE_URL_PREFIX}/lib.dom.d.ts`,
  },
  react: {
    path: "files/react.js",
    source_url: `${FILES_SOURCE_URL_PREFIX}/react.js`,
  },
} as const;

type FileKey = keyof typeof FILES;

interface BenchResult {
  name: string;
  mean: number;
  min: number;
  max: number;
  median: number;
  stddev: number;
  rme?: number;
  samples: number;
  runs?: number;
}

interface FileResult {
  file: string;
  config?: { time: number; warmupTime: number; runs: number };
  results: BenchResult[];
}

interface ParserEntry {
  key: string;
  name: string;
  result: BenchResult | null;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(ms: number): string {
  return `${ms.toFixed(2)} ms`;
}

function formatOps(medianMs: number): string {
  const ops = 1000 / medianMs;
  return `${ops.toFixed(2)} ops/s`;
}

function formatRme(rme: number | undefined): string {
  return rme != null ? `±${rme.toFixed(2)}%` : "-";
}

async function readBenchmarkResults(fileKey: FileKey): Promise<FileResult> {
  const content = await readFile(join(process.cwd(), "result", `${fileKey}.json`), "utf-8");
  return JSON.parse(content) as FileResult;
}

function getParserEntries(data: FileResult): ParserEntry[] {
  const resultsByKey = new Map<string, BenchResult>();
  for (const result of data.results) {
    const key = NAME_TO_KEY[result.name];
    if (key) resultsByKey.set(key, result);
  }

  const entries: ParserEntry[] = [];
  for (const [key, parser] of Object.entries(PARSERS)) {
    entries.push({ key, name: parser.name, result: resultsByKey.get(key) ?? null });
  }

  entries.sort((a, b) => {
    if (a.result && b.result) return a.result.median - b.result.median;
    if (a.result && !b.result) return -1;
    if (!a.result && b.result) return 1;
    return 0;
  });

  return entries;
}

function textWidth(text: string): number {
  let em = 0;
  for (const c of text) em += /[fijlrt\-. ]/.test(c) ? 0.35 : /[A-Zmw]/.test(c) ? 0.75 : 0.58;
  return Math.ceil(em * 13);
}

async function generateChart(entries: ParserEntry[], chartName: string): Promise<string> {
  const data = entries.filter((e) => e.result != null);
  if (data.length === 0) return "";

  const width = 640;
  const barX = Math.max(...data.map((e) => textWidth(e.name))) + 10;
  const fastest = Math.min(...data.map((e) => e.result!.median));
  const slowest = Math.max(...data.map((e) => e.result!.median));
  const labelWidth = Math.max(
    ...data.map(({ result }) =>
      textWidth(`${formatTime(result!.median)} ${(result!.median / fastest).toFixed(2)}×`) + 24,
    ),
  );
  const rows = data.map(({ key, name, result }, index) => {
    const { median } = result!;
    const y = index * 30;
    const middle = y + 11;
    const barEnd = barX + Math.round((median / slowest) * (width - barX - labelWidth));
    const row = [
      `<text x="${barX - 10}" y="${middle}" text-anchor="end">${name}</text>`,
      `<rect x="${barX}" y="${y}" width="${barEnd - barX}" height="22" rx="4" fill="${CHART_COLORS[key]}"/>`,
      `<text x="${barEnd + 8}" y="${middle}">${formatTime(median)}</text>`,
    ];
    if (median !== fastest) {
      const ratio = `${(median / fastest).toFixed(2)}×`;
      if (barEnd - barX >= textWidth(ratio) + 16) {
        row.push(`<text class="ratio" x="${barEnd - 8}" y="${middle}" text-anchor="end">${ratio}</text>`);
      } else {
        row.push(`<text x="${barEnd + 16 + textWidth(formatTime(median))}" y="${middle}">${ratio}</text>`);
      }
    }
    return row.join("\n  ");
  });

  const height = data.length * 30 - 8;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    text { font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; fill: #848d97; dominant-baseline: central; font-variant-numeric: tabular-nums }
    .ratio { font-size: 12px; fill: #fff }
  </style>
  ${rows.join("\n  ")}
</svg>
`;

  await mkdir(join(process.cwd(), "charts"), { recursive: true });
  await writeFile(join(process.cwd(), "charts", `${chartName}.svg`), svg);
  return `charts/${chartName}.svg`;
}

function generateTable(entries: ParserEntry[]): string {
  const lines: string[] = [];

  const fastest = entries.find((e) => e.result != null)?.result ?? null;

  lines.push("| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |");
  lines.push("|--------|--------|-----|------|-----|-----|---------|----------|");

  for (const { name, result } of entries) {
    if (!result) {
      lines.push(`| ${name} | Failed to parse | - | - | - | - | - | - |`);
      continue;
    }
    const isFastest = result === fastest;
    const ratio = fastest ? result.median / fastest.median : 1;
    const relative = isFastest ? "baseline" : `${ratio.toFixed(2)}× slower`;
    const cells = [
      name,
      formatTime(result.median),
      formatRme(result.rme),
      formatTime(result.mean),
      formatTime(result.min),
      formatTime(result.max),
      formatOps(result.median),
      relative,
    ];
    const row = isFastest ? cells.map((c) => `**${c}**`).join(" | ") : cells.join(" | ");
    lines.push(`| ${row} |`);
  }

  return lines.join("\n");
}

async function generateBenchmarksSection(): Promise<string> {
  const lines = ["## Benchmarks", ""];

  for (const [key, file] of Object.entries(FILES)) {
    const fileKey = key as FileKey;
    const fileName = file.path.split("/").pop()!;
    const fileSize = (await stat(join(process.cwd(), file.path))).size;
    const data = await readBenchmarkResults(fileKey);
    const entries = getParserEntries(data);

    lines.push(`### [${fileName}](${file.source_url})`);
    lines.push("");
    lines.push(`**File size:** ${formatBytes(fileSize)}`);
    lines.push("");
    if (data.config) {
      lines.push(
        `**Configuration:** ${data.config.runs} runs, ${data.config.time} ms per run, ${data.config.warmupTime} ms warmup.`,
      );
      lines.push("");
    }

    const chartPath = await generateChart(entries, fileKey);
    if (chartPath) {
      lines.push(`![Bar chart comparing npm parser speeds for ${fileName}](${chartPath})`);
      lines.push("");
    }

    lines.push(generateTable(entries));
    lines.push("");
  }

  return lines.join("\n");
}

function generateParsersSection(): string {
  const lines = ["## Parsers", ""];

  for (const [, parser] of Object.entries(PARSERS)) {
    lines.push(`### [${parser.name}](${parser.url})`);
    lines.push("");
    lines.push(parser.description);
    lines.push("");
  }

  return lines.join("\n");
}

function getSystemInfo(): string {
  const cpu = cpus()[0];
  const cpuModel = cpu?.model || "Unknown CPU";
  const cpuCores = cpus().length;
  const totalMemoryGB = (totalmem() / (1024 * 1024 * 1024)).toFixed(0);
  const os = platform();
  const osArch = arch();
  const osRelease = release();
  const osName =
    os === "darwin" ? "macOS" : os === "win32" ? "Windows" : os === "linux" ? "Linux" : os;

  return `## System

| Property | Value |
|----------|-------|
| OS | ${osName} ${osRelease} (${osArch}) |
| CPU | ${cpuModel} |
| Cores | ${cpuCores} |
| Memory | ${totalMemoryGB} GB |`;
}

function generateRunSection(): string {
  return `## Run Benchmarks

### Prerequisites

- [Node.js 22.18 or later](https://nodejs.org/) - JavaScript runtime
- [pnpm 11.17.0](https://pnpm.io/) - Package manager

### Steps

1. Clone the repository:

\`\`\`bash
git clone https://github.com/oxc-project/bench-javascript-parser.git
cd bench-javascript-parser
\`\`\`

2. Install dependencies:

\`\`\`bash
pnpm install
\`\`\`

3. Run benchmarks:

\`\`\`bash
pnpm run bench
\`\`\`

This downloads or updates the benchmark files and runs all benchmarks. Results are saved to the \`result/\` directory. Use \`pnpm run load-files\` to update the files separately, or \`pnpm run bench:lib_dom\` to benchmark only \`lib.dom.d.ts\` after downloading the files.

Benchmark duration is configurable via \`BENCH_TIME\` (timed duration per run in ms, default 10000), \`BENCH_WARMUP\` (warmup duration in ms, default 2000), and \`BENCH_RUNS\` (independent runs per parser, default 3). Tinybench also enforces minimum sample counts, so slower parsers can exceed these durations. Run on AC power with other applications closed for more stable results.`;
}

function generateMethodologySection(): string {
  return `## Methodology

Each parser is benchmarked using [Tinybench](https://github.com/tinylibs/tinybench) with warmup iterations followed by multiple timed runs. Each run measures the time to parse the source text into an AST. Source files are read from disk once and kept in memory for all iterations.

Every parser × file combination runs in a fresh process for each independent run, so JIT state and GC pressure from one parser do not carry over to another. Each combination is benchmarked in multiple independent runs (3 by default), and the reported median is the median of the run medians. Mean and RME are also medians across runs; min and max are the extremes across all runs. The RME column shows the relative margin of error of the mean at 95% confidence within a run; it does not measure uncertainty in the reported median or variability between runs.

Native parsers (Oxc, SWC, SWC Next, Yuku) run through their respective NAPI bindings, so measured time includes the binding overhead. Oxbox runs through WebAssembly. Pure JS parsers (Acorn, Babel) run directly in the JavaScript runtime.

\`lib.dom.d.ts\` is a global declaration script. Babel uses declaration mode, and SWC parses it as a script to support its \`...arguments\` parameter names.

### Oxc raw transfer

By default, \`oxc-parser\` serializes the AST to a JSON string in Rust and parses that string when JavaScript accesses the \`program\` property. The Oxc (raw transfer) benchmark enables \`experimentalRawTransfer\`, which writes the Rust AST into a raw buffer and uses a generated JavaScript deserializer to construct the final AST directly. It avoids JSON serialization, the intermediate string, and \`JSON.parse\`, but still includes JavaScript object construction in the measured time.

For this benchmark, raw transfer requires Node.js 22.18 or later on a 64-bit, little-endian platform. The benchmark checks support before starting and fails with an explicit error on unsupported platforms.

The implementation reserves a 6 GiB \`ArrayBuffer\` to obtain a 2 GiB block aligned on a 4 GiB boundary. On systems with virtual memory, this reserves address space rather than consuming 6 GiB of physical memory. These benchmarks call \`parseSync\` sequentially, allowing Oxc to reuse a cached buffer; concurrent parsing can reserve multiple buffers and therefore requires substantially more virtual address space.

The benchmark accesses each parser's AST (\`program\` or \`body\`) on every iteration so that results include obtaining the complete AST. The Oxc (raw transfer) and Oxc (default) rows show both AST transfer paths. Oxbox 0.1.0 bundles Oxc 0.151.0; the native Oxc version is recorded in \`pnpm-lock.yaml\`.

**Why is Yuku fast?** Yuku's AST is designed from the ground up to be transfer-friendly: flat, compact, and near-binary. Instead of serializing to JSON and parsing it back, the AST produced by the Zig parser can be passed to JavaScript with minimal conversion. Zig's comptime makes this safe by design. There are no multi-gigabyte allocations, only the memory the source being parsed actually needs.`;
}

async function main() {
  const readme = [
    "# ECMAScript Parser Benchmark (npm)",
    "",
    "Benchmarks for ECMAScript parsers available as npm packages, including pure JavaScript parsers, native parsers (Zig, Rust) via NAPI bindings, and WebAssembly parsers.",
    "",
    getSystemInfo(),
    "",
    generateParsersSection(),
    await generateBenchmarksSection(),
    generateRunSection(),
    "",
    generateMethodologySection(),
  ].join("\n");

  await writeFile(join(process.cwd(), "README.md"), readme);
  console.log("README.md generated successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
