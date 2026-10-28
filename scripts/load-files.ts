import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const DEST = "files";
const REPO_URL = "https://github.com/yuku-toolchain/parser-benchmark-files";
const REQUIRED_FILES = ["typescript.js", "checker.ts", "lib.dom.d.ts", "react.js"];

function run(args: string[]): string | null {
  const result = spawnSync("git", args, { encoding: "utf-8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function main(): void {
  const localHead = existsSync(join(DEST, ".git"))
    ? run(["-C", DEST, "rev-parse", "HEAD"])
    : null;
  const remoteHead = run(["ls-remote", REPO_URL, "HEAD"])?.split(/\s+/)[0] ?? null;
  const hasFiles = REQUIRED_FILES.every((name) => existsSync(join(DEST, name)));

  if (!remoteHead) {
    if (hasFiles) {
      console.warn("\nCould not reach upstream, using existing files\n");
      return;
    }
    throw new Error("Could not reach upstream and benchmark files are missing");
  }

  if (localHead === remoteHead && hasFiles) return;

  console.log(
    localHead === null
      ? "\nDownloading files..."
      : `\nUpdating files (${localHead.slice(0, 7)} -> ${remoteHead.slice(0, 7)})...`,
  );

  // Keep cached files available until their replacement is fully downloaded.
  const staging = mkdtempSync(".benchmark-files-");
  const download = join(staging, "download");
  const backup = join(staging, "backup");
  try {
    const clone = spawnSync(
      "git",
      ["clone", "--quiet", "--no-progress", "--single-branch", "--depth", "1", REPO_URL, download],
      { stdio: "inherit" },
    );
    if (clone.error) throw clone.error;
    if (clone.status !== 0) throw new Error("Failed to download benchmark files");
    if (!REQUIRED_FILES.every((name) => existsSync(join(download, name)))) {
      throw new Error("Downloaded repository is missing benchmark files");
    }

    if (existsSync(DEST)) renameSync(DEST, backup);
    try {
      renameSync(download, DEST);
    } catch (error) {
      if (existsSync(backup)) renameSync(backup, DEST);
      throw error;
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }

  console.log("\nFiles downloaded\n");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
