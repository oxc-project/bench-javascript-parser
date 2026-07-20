import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const DEST = "files";
const REPO_URL = "https://github.com/yuku-toolchain/parser-benchmark-files";

const shouldLoad = !existsSync(DEST);

if (!shouldLoad) {
  process.exit(0);
}

console.log("\nDownloading files...");

const result = spawnSync(
  "git",
  [
    "clone",
    "--quiet",
    "--no-progress",
    "--single-branch",
    "--depth",
    "1",
    REPO_URL,
    DEST,
  ],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

console.log("\nFiles downloaded\n");
