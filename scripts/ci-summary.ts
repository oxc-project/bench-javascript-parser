import { readFile } from "node:fs/promises";
import { cpus } from "node:os";

type BenchResult = {
  name: string;
  mean: number;
  median: number;
  samples: number;
};

const files = ["typescript", "checker", "react"];
const lines = [
  "## Parser benchmarks",
  "",
  `Node ${process.version} · ${process.platform}/${process.arch} · ${cpus()[0]?.model ?? "Unknown CPU"}`,
  "",
  "Times include parsing and accessing the complete AST.",
];

let found = 0;
for (const file of files) {
  let results: BenchResult[];
  try {
    const data = JSON.parse(await readFile(new URL(`../result/${file}.json`, import.meta.url), "utf8"));
    results = data.results;
  } catch {
    continue;
  }

  found++;
  lines.push("", `### ${file}`, "", "| Parser | Mean | Median | Samples |", "| --- | ---: | ---: | ---: |");
  for (const result of results.toSorted((a, b) => a.mean - b.mean)) {
    const name = result.name === "Oxc" ? "Oxc (raw transfer)" : result.name;
    lines.push(
      `| ${name} | ${result.mean.toFixed(2)} ms | ${result.median.toFixed(2)} ms | ${result.samples} |`,
    );
  }
}

if (found === 0) lines.push("", "No benchmark results were produced.");

console.log(lines.join("\n"));
