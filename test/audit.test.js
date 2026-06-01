import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/args.js";
import { auditRepository, formatMarkdownReport } from "../src/audit.js";

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
  assert.equal(result.percentage, 0);
  assert.match(report, /README: not found/);
  assert.match(report, /Needs Work/);
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
