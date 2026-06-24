import Bun from "bun";

const DEST = "files";
const REPO_URL = "https://github.com/yuku-toolchain/parser-benchmark-files";

const shouldLoad = !(await Bun.file("files").exists());

if (!shouldLoad) {
  process.exit(0);
}

console.log("\nDownloading files...");

Bun.spawnSync({
  cmd: [
    "git",
    "clone",
    "--quiet",
    "--no-progress",
    "--single-branch",
    "--depth",
    "1",
    REPO_URL,
    DEST,
  ],
});

console.log("\nFiles downloaded\n");
