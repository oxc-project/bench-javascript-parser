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
| **SWC Next** | **40.09 ms** | **±4.09%** | **50.03 ms** | **38.42 ms** | **73.09 ms** | **24.95 ops/s** | **baseline** |
| Yuku | 53.23 ms | ±3.11% | 59.84 ms | 48.50 ms | 81.79 ms | 18.79 ops/s | 1.33× slower |
| Oxc (raw transfer) | 58.58 ms | ±3.74% | 58.87 ms | 44.09 ms | 113.71 ms | 17.07 ops/s | 1.46× slower |
| Acorn | 202.63 ms | ±1.32% | 205.38 ms | 190.75 ms | 246.14 ms | 4.94 ops/s | 5.05× slower |
| Babel | 211.49 ms | ±2.11% | 218.16 ms | 200.53 ms | 288.28 ms | 4.73 ops/s | 5.28× slower |
| Oxc (default) | 314.75 ms | ±1.75% | 324.13 ms | 303.12 ms | 370.28 ms | 3.18 ops/s | 7.85× slower |
| Oxbox (WASM) | 351.51 ms | ±0.14% | 351.47 ms | 347.17 ms | 362.40 ms | 2.84 ops/s | 8.77× slower |
| SWC | 562.92 ms | ±0.75% | 569.87 ms | 546.74 ms | 602.99 ms | 1.78 ops/s | 14.04× slower |

### [checker.ts](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/checker.ts)

**File size:** 2.95 MB

**Configuration:** 3 runs, 10000 ms per run, 2000 ms warmup.

![Bar chart comparing npm parser speeds for checker.ts](charts/checker.svg)

| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |
|--------|--------|-----|------|-----|-----|---------|----------|
| **Yuku** | **16.18 ms** | **±1.73%** | **17.82 ms** | **15.74 ms** | **29.90 ms** | **61.79 ops/s** | **baseline** |
| Oxc (raw transfer) | 20.72 ms | ±3.34% | 26.29 ms | 19.55 ms | 81.84 ms | 48.27 ops/s | 1.28× slower |
| SWC Next | 23.99 ms | ±3.61% | 26.15 ms | 16.76 ms | 50.21 ms | 41.69 ops/s | 1.48× slower |
| Babel | 71.24 ms | ±1.25% | 72.37 ms | 64.74 ms | 93.58 ms | 14.04 ops/s | 4.40× slower |
| Oxc (default) | 114.14 ms | ±1.54% | 110.01 ms | 98.68 ms | 126.00 ms | 8.76 ops/s | 7.05× slower |
| Oxbox (WASM) | 126.09 ms | ±1.93% | 126.10 ms | 110.56 ms | 140.42 ms | 7.93 ops/s | 7.79× slower |
| SWC | 162.77 ms | ±0.21% | 163.21 ms | 159.70 ms | 169.47 ms | 6.14 ops/s | 10.06× slower |
| Acorn | Failed to parse | - | - | - | - | - | - |

### [lib.dom.d.ts](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/lib.dom.d.ts)

**File size:** 2.24 MB

**Configuration:** 3 runs, 10000 ms per run, 2000 ms warmup.

![Bar chart comparing npm parser speeds for lib.dom.d.ts](charts/lib_dom.svg)

| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |
|--------|--------|-----|------|-----|-----|---------|----------|
| **Yuku** | **6.08 ms** | **±0.67%** | **6.45 ms** | **5.88 ms** | **10.18 ms** | **164.57 ops/s** | **baseline** |
| Oxc (raw transfer) | 7.01 ms | ±2.32% | 9.14 ms | 6.77 ms | 24.98 ms | 142.71 ops/s | 1.15× slower |
| SWC Next | 7.13 ms | ±0.36% | 7.35 ms | 7.00 ms | 9.50 ms | 140.34 ops/s | 1.17× slower |
| Babel | 28.43 ms | ±0.67% | 28.82 ms | 26.06 ms | 36.36 ms | 35.18 ops/s | 4.68× slower |
| Oxc (default) | 38.85 ms | ±1.86% | 41.91 ms | 37.95 ms | 58.91 ms | 25.74 ops/s | 6.39× slower |
| Oxbox (WASM) | 43.23 ms | ±1.51% | 46.70 ms | 42.05 ms | 56.31 ms | 23.13 ops/s | 7.11× slower |
| SWC | 65.86 ms | ±0.08% | 65.86 ms | 64.84 ms | 67.77 ms | 15.18 ops/s | 10.84× slower |
| Acorn | Failed to parse | - | - | - | - | - | - |

### [react.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/react.js)

**File size:** 0.07 MB

**Configuration:** 3 runs, 10000 ms per run, 2000 ms warmup.

![Bar chart comparing npm parser speeds for react.js](charts/react.svg)

| Parser | Median | RME | Mean | Min | Max | Ops/sec | Relative |
|--------|--------|-----|------|-----|-----|---------|----------|
| **SWC Next** | **0.24 ms** | **±0.36%** | **0.26 ms** | **0.23 ms** | **2.33 ms** | **4137.22 ops/s** | **baseline** |
| Yuku | 0.29 ms | ±0.05% | 0.29 ms | 0.28 ms | 2.00 ms | 3461.70 ops/s | 1.20× slower |
| Oxc (raw transfer) | 0.30 ms | ±5.43% | 0.48 ms | 0.27 ms | 30.28 ms | 3316.30 ops/s | 1.25× slower |
| Babel | 0.92 ms | ±0.14% | 0.94 ms | 0.90 ms | 1.70 ms | 1082.06 ops/s | 3.82× slower |
| Acorn | 1.26 ms | ±0.07% | 1.27 ms | 1.25 ms | 3.26 ms | 793.60 ops/s | 5.21× slower |
| Oxc (default) | 1.87 ms | ±1.79% | 2.03 ms | 1.82 ms | 16.88 ms | 533.74 ops/s | 7.75× slower |
| Oxbox (WASM) | 2.19 ms | ±1.48% | 2.37 ms | 2.11 ms | 18.65 ms | 455.99 ops/s | 9.07× slower |
| SWC | 3.35 ms | ±0.13% | 3.37 ms | 3.28 ms | 5.63 ms | 298.80 ops/s | 13.85× slower |

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