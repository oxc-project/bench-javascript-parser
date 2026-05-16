# ECMAScript Parser Benchmark (npm)

Benchmarks for ECMAScript parsers available as npm packages, including pure JavaScript parsers and native parsers (Zig, Rust) via NAPI bindings.

## System

| Property | Value |
|----------|-------|
| OS | macOS 24.6.0 (arm64) |
| CPU | Apple M3 |
| Cores | 8 |
| Memory | 16 GB |

## Parsers

### [Acorn](https://github.com/acornjs/acorn)

A tiny, fast JavaScript parser, written completely in JavaScript.

### [Babel](https://github.com/babel/babel/tree/main/packages/babel-parser)

A JavaScript compiler and parser used by the Babel toolchain.

### [Meriyah](https://github.com/meriyah/meriyah)

A 100% compliant, self-hosted JavaScript parser with a high focus on both performance and stability.

### [Oxc](https://github.com/oxc-project/oxc)

A high-performance JavaScript and TypeScript parser written in Rust.

### [SWC](https://github.com/swc-project/swc)

An extensible Rust-based platform for compiling and bundling JavaScript and TypeScript.

### [Yuku](https://github.com/yuku-toolchain/yuku)

A high-performance & spec-compliant JavaScript/TypeScript compiler written in Zig.

## Benchmarks

### [typescript.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/typescript.js)

**File size:** 7.83 MB

![Bar chart comparing npm parser speeds for typescript.js](charts/typescript.png)

| Parser | Mean | Min | Max | Ops/sec | Relative |
|--------|------|-----|-----|---------|----------|
| **Yuku** | **32.18 ms** | **29.93 ms** | **43.08 ms** | **31.08 ops/s** | **baseline** |
| Meriyah | 70.22 ms | 61.17 ms | 104.09 ms | 14.24 ops/s | 2.18× slower |
| Acorn | 138.86 ms | 124.86 ms | 190.39 ms | 7.20 ops/s | 4.32× slower |
| Babel | 179.30 ms | 146.71 ms | 231.26 ms | 5.58 ops/s | 5.57× slower |
| Oxc | 277.43 ms | 262.07 ms | 474.87 ms | 3.60 ops/s | 8.62× slower |
| SWC | 485.65 ms | 462.44 ms | 574.26 ms | 2.06 ops/s | 15.09× slower |

### [calcom.tsx](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/calcom.tsx)

**File size:** 1.01 MB

![Bar chart comparing npm parser speeds for calcom.tsx](charts/calcom.png)

| Parser | Mean | Min | Max | Ops/sec | Relative |
|--------|------|-----|-----|---------|----------|
| **Yuku** | **6.82 ms** | **5.76 ms** | **31.67 ms** | **146.68 ops/s** | **baseline** |
| Babel | 40.47 ms | 32.98 ms | 49.34 ms | 24.71 ops/s | 5.94× slower |
| Oxc | 56.88 ms | 54.49 ms | 63.65 ms | 17.58 ops/s | 8.34× slower |
| SWC | 73.17 ms | 68.06 ms | 117.27 ms | 13.67 ops/s | 10.73× slower |
| Acorn | Failed to parse | - | - | - | - |
| Meriyah | Failed to parse | - | - | - | - |

### [react.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/react.js)

**File size:** 0.07 MB

![Bar chart comparing npm parser speeds for react.js](charts/react.png)

| Parser | Mean | Min | Max | Ops/sec | Relative |
|--------|------|-----|-----|---------|----------|
| **Yuku** | **0.25 ms** | **0.21 ms** | **6.51 ms** | **4031.08 ops/s** | **baseline** |
| Meriyah | 0.53 ms | 0.42 ms | 16.97 ms | 1897.67 ops/s | 2.12× slower |
| Acorn | 1.01 ms | 0.93 ms | 20.67 ms | 990.06 ops/s | 4.07× slower |
| Oxc | 1.56 ms | 1.50 ms | 7.78 ms | 641.47 ops/s | 6.28× slower |
| Babel | 1.57 ms | 1.15 ms | 8.15 ms | 636.35 ops/s | 6.33× slower |
| SWC | 2.90 ms | 2.77 ms | 8.41 ms | 344.84 ops/s | 11.69× slower |

## Run Benchmarks

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager

### Steps

1. Clone the repository:

```bash
git clone https://github.com/yuku-toolchain/ecmascript-parser-benchmark-js.git
cd ecmascript-parser-benchmark-js
```

2. Install dependencies:

```bash
bun install
```

3. Run benchmarks:

```bash
bun bench
```

This will run benchmarks on all test files. Results are saved to the `result/` directory.

## Methodology

Each parser is benchmarked using [Tinybench](https://github.com/tinylibs/tinybench) with warmup iterations followed by multiple timed runs. Each run measures the time to parse the source text into an AST. Source files are read from disk once and kept in memory for all iterations.

Native parsers (Oxc, SWC, Yuku) run through their respective NAPI bindings, so measured time includes the binding overhead. Pure JS parsers (Acorn, Babel) run directly in the JavaScript runtime.

**Why is Oxc slower than Babel?** Oxc's npm package serializes the AST to a JSON string on the Rust side, then calls `JSON.parse` on the JavaScript side to make it available. This overhead makes it slower in end-to-end benchmarks, even though Oxc is very fast at raw parsing speed. If you only call the `parse` function without accessing the result, Oxc appears faster than Babel because the `program` field is a getter that defers `JSON.parse` until access. The benchmarks above measure the time to actually obtain the full AST for all parsers.

Oxc also has an `experimentalRawTransfer` option that makes `oxc-parser` roughly 2-3x faster than the results shown above. However, it is currently experimental and comes with significant limitations: it only works in Node.js (not Bun, Deno, etc.), and it allocates gigabytes of memory upfront for a single parse, leading to out-of-memory errors on many systems and failures when parsing files in parallel.

**Why is Yuku fast?** Yuku's AST is designed from the ground up to be transfer-friendly: flat, compact, and near-binary. Instead of serializing to JSON and parsing it back, the AST produced by the Zig parser can be passed to JavaScript with minimal conversion. Zig's comptime makes this safe by design. There are no multi-gigabyte allocations, only the memory the source being parsed actually needs.