import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/args.js";
import { auditRepository, formatMarkdownReport } from "../src/audit.js";
import { CONFIG_FILE } from "../src/config.js";

const execFileAsync = promisify(execFile);

test("audits a well-documented repository", async () => {
  const repo = await createTempRepo();
  await writeFile(
    path.join(repo, "README.md"),
    `# Demo Project

Demo Project is a small command line tool for maintainers who want quick feedback on whether a repository is easy to install, use, test, and contribute to.

## Installation

\`\`\`sh
npm install demo-project
\`\`\`

## Usage

\`\`\`sh
demo-project .
\`\`\`

## Options

Use --json for machine-readable output.

## Examples

See the examples directory.

## Testing

\`\`\`sh
npm test
\`\`\`

## Contributing

Pull requests are welcome.

## Security

Report vulnerabilities privately.

## Changelog

See CHANGELOG.md.

## License

MIT
`
  );
  await writeFile(path.join(repo, "package.json"), JSON.stringify({ description: "Demo", scripts: { test: "node --test" } }));
  await writeFile(path.join(repo, "LICENSE"), "MIT");
  await writeFile(path.join(repo, "CONTRIBUTING.md"), "# Contributing");
  await writeFile(path.join(repo, "CHANGELOG.md"), "# Changelog");
  await mkdir(path.join(repo, "examples"));
  await writeFile(path.join(repo, "examples", "basic.md"), "# Basic example");

  const result = await auditRepository(repo);

  assert.equal(result.maxScore, 100);
  assert.equal(result.percentage, 100);
  assert.equal(result.failed, 0);
});

test("reports actionable gaps when no README exists", async () => {
  const repo = await createTempRepo();
  const result = await auditRepository(repo);
  const report = formatMarkdownReport(result);

  assert.equal(result.readmePath, null);
  assert.equal(result.configPath, null);
  assert.deepEqual(result.config, { disabledRules: [], minScore: null });
  assert.equal(result.percentage, 0);
  assert.match(report, /README: not found/);
  assert.match(report, /Needs Work/);
});

test("applies readme-lens.config.json rule settings", async () => {
  const repo = await createTempRepo();
  await writeFile(path.join(repo, "README.md"), "# Demo\n\nShort.");
  await writeFile(
    path.join(repo, CONFIG_FILE),
    JSON.stringify({
      disabledRules: ["summary", "installation"],
      minScore: 40
    })
  );

  const result = await auditRepository(repo);

  assert.equal(result.configPath, path.join(repo, CONFIG_FILE));
  assert.deepEqual(result.config, {
    disabledRules: ["summary", "installation"],
    minScore: 40
  });
  assert.equal(result.maxScore, 78);
  assert.equal(result.checks.some((check) => check.id === "summary"), false);
  assert.equal(result.checks.some((check) => check.id === "installation"), false);
});

test("rejects invalid config files", async () => {
  const repo = await createTempRepo();
  await writeFile(
    path.join(repo, CONFIG_FILE),
    JSON.stringify({
      disabledRules: ["not-a-rule"],
      minScore: 101
    })
  );

  await assert.rejects(() => auditRepository(repo), /minScore must be an integer from 0 to 100/);
});

test("rejects unknown disabled rule IDs", async () => {
  const repo = await createTempRepo();
  await writeFile(
    path.join(repo, CONFIG_FILE),
    JSON.stringify({
      disabledRules: ["not-a-rule"]
    })
  );

  await assert.rejects(() => auditRepository(repo), /unknown rule ID: not-a-rule/);
});

test("uses configured minScore when the CLI flag is omitted", async () => {
  const repo = await createTempRepo();
  await writeFile(path.join(repo, CONFIG_FILE), JSON.stringify({ minScore: 100 }));

  await assert.rejects(
    () => execFileAsync(process.execPath, ["./src/cli.js", repo]),
    (error) => error.code === 1
  );
});

test("lets --min-score override configured minScore", async () => {
  const repo = await createTempRepo();
  await writeFile(path.join(repo, CONFIG_FILE), JSON.stringify({ minScore: 100 }));

  const result = await execFileAsync(process.execPath, ["./src/cli.js", repo, "--min-score", "0"]);

  assert.match(result.stdout, /README Lens Report/);
});

test("parses CLI arguments", () => {
  assert.deepEqual(parseArgs(["docs", "--json", "--min-score", "75"]), {
    help: false,
    json: true,
    minScore: 75,
    path: "docs",
    version: false
  });
});

async function createTempRepo() {
  return mkdtemp(path.join(os.tmpdir(), "readme-lens-"));
}
