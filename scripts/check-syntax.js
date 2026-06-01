import { spawnSync } from "node:child_process";

const files = [
  "scripts/check-syntax.js",
  "src/args.js",
  "src/audit.js",
  "src/cli.js",
  "src/index.js",
  "src/rules.js",
  "test/audit.test.js"
];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    shell: false,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
