# ECMAScript Parser Benchmark (npm)

Benchmarks for ECMAScript parsers available as npm packages, including pure JavaScript parsers, native parsers (Zig, Rust) via NAPI bindings, and WebAssembly parsers.

## System

| Property | Value |
|----------|-------|
| OS | macOS 27.0.0 (arm64) |
| CPU | Apple M3 Max |
| Cores | 14 |
| Memory | 36 GB |

## Parsers

### [Acorn](https://github.com/acornjs/acorn)

A tiny, fast JavaScript parser, written completely in JavaScript.

### [Babel](https://github.com/babel/babel/tree/main/packages/babel-parser)

A JavaScript compiler and parser used by the Babel toolchain.

### [Oxc (raw transfer)](https://github.com/oxc-project/oxc)

The native Oxc parser with experimental raw AST transfer enabled.

### [Oxc (default)](https://github.com/oxc-project/oxc)

The native Oxc parser with its default AST transfer path.

### [Oxbox (WASM)](https://github.com/unjs/oxbox)

Oxc's parser packaged as a portable WebAssembly module.

### [SWC](https://github.com/swc-project/swc)

An extensible Rust-based platform for compiling and bundling JavaScript and TypeScript.

### [SWC Next](https://github.com/swc-project/swc-next)

A Rust rewrite of SWC with a flat, ESTree-based AST, using @swc-next/parser.

### [Yuku](https://github.com/yuku-toolchain/yuku)

A high-performance & spec-compliant JavaScript/TypeScript compiler written in Zig.

## Benchmarks

### [typescript.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/typescript.js)

**File size:** 7.83 MB

**Configuration:** 3 runs, 10000 ms per run, 2000 ms warmup.

![Bar chart comparing npm parser speeds for typescript.js](charts/typescript.svg)

| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |
|--------|--------|-----|------|-----|-----|---------|----------|
| **SWC Next** | **48.05 ms** | **±4.35%** | **53.78 ms** | **34.22 ms** | **92.67 ms** | **20.81 ops/s** | **baseline** |
| Oxc (raw transfer) | 56.08 ms | ±1.72% | 57.96 ms | 46.98 ms | 93.24 ms | 17.83 ops/s | 1.17× slower |
| Yuku | 59.63 ms | ±1.25% | 57.25 ms | 46.29 ms | 76.73 ms | 16.77 ops/s | 1.24× slower |
| Babel | 200.69 ms | ±2.41% | 212.89 ms | 186.40 ms | 273.08 ms | 4.98 ops/s | 4.18× slower |
| Acorn | 213.33 ms | ±1.48% | 220.43 ms | 206.14 ms | 267.11 ms | 4.69 ops/s | 4.44× slower |
| Oxc (default) | 339.01 ms | ±1.03% | 345.72 ms | 329.75 ms | 378.46 ms | 2.95 ops/s | 7.06× slower |
| Oxbox (WASM) | 340.74 ms | ±0.37% | 342.47 ms | 338.06 ms | 375.25 ms | 2.93 ops/s | 7.09× slower |
| SWC | 572.85 ms | ±1.13% | 584.81 ms | 556.07 ms | 662.82 ms | 1.75 ops/s | 11.92× slower |

### [checker.ts](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/checker.ts)

**File size:** 2.95 MB

**Configuration:** 3 runs, 10000 ms per run, 2000 ms warmup.

![Bar chart comparing npm parser speeds for checker.ts](charts/checker.svg)

| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |
|--------|--------|-----|------|-----|-----|---------|----------|
| **SWC Next** | **13.64 ms** | **±1.78%** | **14.98 ms** | **12.62 ms** | **33.76 ms** | **73.29 ops/s** | **baseline** |
| Yuku | 16.13 ms | ±1.77% | 18.14 ms | 14.98 ms | 36.92 ms | 62.01 ops/s | 1.18× slower |
| Oxc (raw transfer) | 22.32 ms | ±1.48% | 21.74 ms | 15.52 ms | 40.06 ms | 44.80 ops/s | 1.64× slower |
| Babel | 69.85 ms | ±1.07% | 71.28 ms | 62.47 ms | 90.66 ms | 14.32 ops/s | 5.12× slower |
| Oxc (default) | 105.58 ms | ±1.50% | 109.51 ms | 103.11 ms | 131.46 ms | 9.47 ops/s | 7.74× slower |
| Oxbox (WASM) | 107.83 ms | ±1.24% | 112.20 ms | 105.32 ms | 131.55 ms | 9.27 ops/s | 7.90× slower |
| SWC | 170.69 ms | ±0.79% | 173.48 ms | 168.51 ms | 193.93 ms | 5.86 ops/s | 12.51× slower |
| Acorn | Failed to parse | - | - | - | - | - | - |

### [lib.dom.d.ts](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/lib.dom.d.ts)

**File size:** 2.24 MB

**Configuration:** 3 runs, 10000 ms per run, 2000 ms warmup.

![Bar chart comparing npm parser speeds for lib.dom.d.ts](charts/lib_dom.svg)

| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |
|--------|--------|-----|------|-----|-----|---------|----------|
| **SWC Next** | **4.85 ms** | **±0.98%** | **5.29 ms** | **4.54 ms** | **18.41 ms** | **206.09 ops/s** | **baseline** |
| Oxc (raw transfer) | 5.70 ms | ±3.90% | 8.11 ms | 4.58 ms | 79.80 ms | 175.29 ops/s | 1.18× slower |
| Yuku | 7.18 ms | ±3.07% | 8.90 ms | 5.65 ms | 87.74 ms | 139.36 ops/s | 1.48× slower |
| Babel | 26.10 ms | ±0.83% | 26.40 ms | 22.39 ms | 33.88 ms | 38.32 ops/s | 5.38× slower |
| Oxbox (WASM) | 39.65 ms | ±1.36% | 41.96 ms | 37.01 ms | 55.59 ms | 25.22 ops/s | 8.17× slower |
| Oxc (default) | 41.49 ms | ±1.08% | 42.57 ms | 37.32 ms | 147.79 ms | 24.10 ops/s | 8.55× slower |
| SWC | 64.71 ms | ±0.44% | 65.22 ms | 63.37 ms | 83.24 ms | 15.45 ops/s | 13.33× slower |
| Acorn | Failed to parse | - | - | - | - | - | - |

### [react.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/react.js)

**File size:** 0.07 MB

**Configuration:** 3 runs, 10000 ms per run, 2000 ms warmup.

![Bar chart comparing npm parser speeds for react.js](charts/react.svg)

| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |
|--------|--------|-----|------|-----|-----|---------|----------|
| **Oxc (raw transfer)** | **0.22 ms** | **±1.43%** | **0.28 ms** | **0.20 ms** | **4.17 ms** | **4648.46 ops/s** | **baseline** |
| SWC Next | 0.22 ms | ±0.47% | 0.24 ms | 0.20 ms | 1.73 ms | 4607.40 ops/s | 1.01× slower |
| Yuku | 0.24 ms | ±0.13% | 0.25 ms | 0.22 ms | 6.05 ms | 4231.32 ops/s | 1.10× slower |
| Babel | 0.87 ms | ±0.27% | 0.91 ms | 0.81 ms | 3.16 ms | 1150.53 ops/s | 4.04× slower |
| Acorn | 1.29 ms | ±0.15% | 1.31 ms | 1.24 ms | 3.85 ms | 777.54 ops/s | 5.98× slower |
| Oxc (default) | 1.80 ms | ±0.97% | 1.96 ms | 1.70 ms | 6.47 ms | 554.81 ops/s | 8.38× slower |
| Oxbox (WASM) | 2.08 ms | ±1.13% | 2.28 ms | 1.96 ms | 12.23 ms | 481.06 ops/s | 9.66× slower |
| SWC | 3.33 ms | ±0.16% | 3.40 ms | 3.14 ms | 5.38 ms | 299.96 ops/s | 15.50× slower |

## Run Benchmarks

### Prerequisites

- [Node.js 22.18 or later](https://nodejs.org/) - JavaScript runtime
- [pnpm 11.17.0](https://pnpm.io/) - Package manager

### Steps

1. Clone the repository:

```bash
git clone https://github.com/oxc-project/bench-javascript-parser.git
cd bench-javascript-parser
```

2. Install dependencies:

```bash
pnpm install
```

3. Run benchmarks:

```bash
pnpm run bench
```

This downloads or updates the benchmark files and runs all benchmarks. Results are saved to the `result/` directory. Use `pnpm run load-files` to update the files separately, or `pnpm run bench:lib_dom` to benchmark only `lib.dom.d.ts` after downloading the files.

Benchmark duration is configurable via `BENCH_TIME` (timed duration per run in ms, default 10000), `BENCH_WARMUP` (warmup duration in ms, default 2000), and `BENCH_RUNS` (independent runs per parser, default 3). Tinybench also enforces minimum sample counts, so slower parsers can exceed these durations. Run on AC power with other applications closed for more stable results.

## Methodology

Each parser is benchmarked using [Tinybench](https://github.com/tinylibs/tinybench) with warmup iterations followed by multiple timed runs. Each run measures the time to parse the source text into an AST. Source files are read from disk once and kept in memory for all iterations.

Every parser × file combination runs in a fresh process for each independent run, so JIT state and GC pressure from one parser do not carry over to another. Each combination is benchmarked in multiple independent runs (3 by default), and the reported median is the median of the run medians. Mean and RME are also medians across runs; min and max are the extremes across all runs. The RME column shows the relative margin of error of the mean at 95% confidence within a run; it does not measure uncertainty in the reported median or variability between runs.

Native parsers (Oxc, SWC, SWC Next, Yuku) run through their respective NAPI bindings, so measured time includes the binding overhead. Oxbox runs through WebAssembly. Pure JS parsers (Acorn, Babel) run directly in the JavaScript runtime.

`lib.dom.d.ts` is a global declaration script. Babel uses declaration mode, and SWC parses it as a script to support its `...arguments` parameter names.

### Oxc raw transfer

By default, `oxc-parser` serializes the AST to a JSON string in Rust and parses that string when JavaScript accesses the `program` property. The Oxc (raw transfer) benchmark enables `experimentalRawTransfer`, which writes the Rust AST into a raw buffer and uses a generated JavaScript deserializer to construct the final AST directly. It avoids JSON serialization, the intermediate string, and `JSON.parse`, but still includes JavaScript object construction in the measured time.

For this benchmark, raw transfer requires Node.js 22.18 or later on a 64-bit, little-endian platform. The benchmark checks support before starting and fails with an explicit error on unsupported platforms.

The implementation reserves a 6 GiB `ArrayBuffer` to obtain a 2 GiB block aligned on a 4 GiB boundary. On systems with virtual memory, this reserves address space rather than consuming 6 GiB of physical memory. These benchmarks call `parseSync` sequentially, allowing Oxc to reuse a cached buffer; concurrent parsing can reserve multiple buffers and therefore requires substantially more virtual address space.

The benchmark accesses each parser's AST (`program` or `body`) on every iteration so that results include obtaining the complete AST. The Oxc (raw transfer) and Oxc (default) rows show both AST transfer paths. Oxbox 0.1.0 bundles Oxc 0.151.0; the native Oxc version is recorded in `pnpm-lock.yaml`.

**Why is Yuku fast?** Yuku's AST is designed from the ground up to be transfer-friendly: flat, compact, and near-binary. Instead of serializing to JSON and parsing it back, the AST produced by the Zig parser can be passed to JavaScript with minimal conversion. Zig's comptime makes this safe by design. There are no multi-gigabyte allocations, only the memory the source being parsed actually needs.