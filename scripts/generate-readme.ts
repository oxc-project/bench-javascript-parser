import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { arch, cpus, platform, release, totalmem } from "node:os";
import { join } from "node:path";
import type { ChartConfiguration } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const FILES_SOURCE_URL_PREFIX =
  "https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main";

const PARSERS = {
  acorn: {
    name: "Acorn",
    description:
      "A tiny, fast JavaScript parser, written completely in JavaScript.",
    url: "https://github.com/acornjs/acorn",
  },
  babel: {
    name: "Babel",
    description:
      "A JavaScript compiler and parser used by the Babel toolchain.",
    url: "https://github.com/babel/babel/tree/main/packages/babel-parser",
  },
  meriyah: {
    name: "Meriyah",
    description:
      "A 100% compliant, self-hosted JavaScript parser with a high focus on both performance and stability.",
    url: "https://github.com/meriyah/meriyah",
  },
  oxc: {
    name: "Oxc",
    description:
      "A high-performance JavaScript and TypeScript parser written in Rust.",
    url: "https://github.com/oxc-project/oxc",
  },
  swc: {
    name: "SWC",
    description:
      "An extensible Rust-based platform for compiling and bundling JavaScript and TypeScript.",
    url: "https://github.com/swc-project/swc",
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
  meriyah: "#06D6A0",
  oxc: "#F72585",
  swc: "#3A86FF",
  yuku: "#FF6B35",
};

const NAME_TO_KEY: Record<string, string> = {
  Acorn: "acorn",
  Babel: "babel",
  Meriyah: "meriyah",
  Oxc: "oxc",
  SWC: "swc",
  Yuku: "yuku",
};

const FILES = {
  typescript: {
    path: "files/typescript.js",
    source_url: `${FILES_SOURCE_URL_PREFIX}/typescript.js`,
  },
  calcom: {
    path: "files/calcom.tsx",
    source_url: `${FILES_SOURCE_URL_PREFIX}/calcom.tsx`,
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
  samples: number;
}

interface FileResult {
  file: string;
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

function formatOps(meanMs: number): string {
  const ops = 1000 / meanMs;
  return `${ops.toFixed(2)} ops/s`;
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
    if (a.result && b.result) return a.result.mean - b.result.mean;
    if (a.result && !b.result) return -1;
    if (!a.result && b.result) return 1;
    return 0;
  });

  return entries;
}

async function generateChart(entries: ParserEntry[], chartName: string): Promise<string> {
  const data = entries.filter((e) => e.result != null);
  if (data.length === 0) return "";

  const labels = data.map((e) => e.name);
  const meanData = data.map((e) => e.result!.mean);
  const colors = data.map((e) => CHART_COLORS[e.key] ?? "#888888");

  const maxTime = Math.max(...meanData);
  const niceSteps = [10, 20, 25, 50, 100, 200, 250, 500];
  const rawStep = maxTime / 4;
  const step = niceSteps.find((s) => s >= rawStep) || Math.ceil(rawStep / 100) * 100;
  const chartMax = Math.ceil(maxTime / step) * step;

  const dpr = 3;
  const chartWidth = 500;
  const chartHeight = data.length * 24 + 28;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: chartWidth * dpr,
    height: chartHeight * dpr,
  });

  const configuration: ChartConfiguration = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: meanData,
          backgroundColor: colors,
          borderWidth: 0,
          borderRadius: 0,
          barPercentage: 0.75,
          categoryPercentage: 0.92,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: false,
      devicePixelRatio: 1,
      layout: {
        padding: { right: 65 * dpr, top: 2 * dpr, bottom: 0 },
      },
      plugins: {
        legend: { display: false },
        title: { display: false },
      },
      scales: {
        x: { display: false, beginAtZero: true, max: chartMax },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: "#CAC1B0",
            font: { size: 9 * dpr },
            padding: 3 * dpr,
          },
        },
      },
    },
    plugins: [
      {
        id: "value-labels",
        afterDatasetsDraw(chart) {
          const ctx = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          const dataset = chart.data.datasets[0];
          for (let i = 0; i < meta.data.length; i++) {
            const bar = meta.data[i];
            const value = dataset.data[i] as number;
            ctx.save();
            ctx.fillStyle = "#CAC1B0";
            ctx.font = `${9 * dpr}px sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(`${value.toFixed(2)}ms`, bar.x + 8 * dpr, bar.y);
            ctx.restore();
          }
        },
      },
    ],
  };

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  const chartPath = join(process.cwd(), "charts", `${chartName}.png`);
  await mkdir(join(process.cwd(), "charts"), { recursive: true });
  await writeFile(chartPath, imageBuffer);

  return `charts/${chartName}.png`;
}

function generateTable(entries: ParserEntry[]): string {
  const lines: string[] = [];

  const fastest = entries.find((e) => e.result != null)?.result ?? null;

  lines.push("| Parser | Mean | Min | Max | Ops/sec | Relative |");
  lines.push("|--------|------|-----|-----|---------|----------|");

  for (const { name, result } of entries) {
    if (!result) {
      lines.push(`| ${name} | Failed to parse | - | - | - | - |`);
      continue;
    }
    const isFastest = result === fastest;
    const ratio = fastest ? result.mean / fastest.mean : 1;
    const relative = isFastest ? "baseline" : `${ratio.toFixed(2)}× slower`;
    const cells = [
      name,
      formatTime(result.mean),
      formatTime(result.min),
      formatTime(result.max),
      formatOps(result.mean),
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
  const osName = os === "darwin" ? "macOS" : os === "win32" ? "Windows" : os === "linux" ? "Linux" : os;

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

- [Bun](https://bun.sh/) - JavaScript runtime and package manager

### Steps

1. Clone the repository:

\`\`\`bash
git clone https://github.com/yuku-toolchain/ecmascript-parser-benchmark-js.git
cd ecmascript-parser-benchmark-js
\`\`\`

2. Install dependencies:

\`\`\`bash
bun install
\`\`\`

3. Run benchmarks:

\`\`\`bash
bun bench
\`\`\`

This will run benchmarks on all test files. Results are saved to the \`result/\` directory.`;
}

function generateMethodologySection(): string {
  return `## Methodology

Each parser is benchmarked using [Tinybench](https://github.com/tinylibs/tinybench) with warmup iterations followed by multiple timed runs. Each run measures the time to parse the source text into an AST. Source files are read from disk once and kept in memory for all iterations.

Native parsers (Oxc, SWC, Yuku) run through their respective NAPI bindings, so measured time includes the binding overhead. Pure JS parsers (Acorn, Babel) run directly in the JavaScript runtime.

**Why is Oxc slower than Babel?** Oxc's npm package serializes the AST to a JSON string on the Rust side, then calls \`JSON.parse\` on the JavaScript side to make it available. This overhead makes it slower in end-to-end benchmarks, even though Oxc is very fast at raw parsing speed. If you only call the \`parse\` function without accessing the result, Oxc appears faster than Babel because the \`program\` field is a getter that defers \`JSON.parse\` until access. The benchmarks above measure the time to actually obtain the full AST for all parsers.

Oxc also has an \`experimentalRawTransfer\` option that makes \`oxc-parser\` roughly 2-3x faster than the results shown above. However, it is currently experimental and comes with significant limitations: it only works in Node.js (not Bun, Deno, etc.), and it allocates gigabytes of memory upfront for a single parse, leading to out-of-memory errors on many systems and failures when parsing files in parallel.

**Why is Yuku fast?** Yuku's AST is designed from the ground up to be transfer-friendly: flat, compact, and near-binary. Instead of serializing to JSON and parsing it back, the AST produced by the Zig parser can be passed to JavaScript with minimal conversion. Zig's comptime makes this safe by design. There are no multi-gigabyte allocations, only the memory the source being parsed actually needs.`;
}

async function main() {
  const readme = [
    "# ECMAScript Parser Benchmark (npm)",
    "",
    "Benchmarks for ECMAScript parsers available as npm packages, including pure JavaScript parsers and native parsers (Zig, Rust) via NAPI bindings.",
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

main().catch(console.error);
