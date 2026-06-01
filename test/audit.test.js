import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/args.js";
import { auditRepository, formatMarkdownReport, formatSarifReport } from "../src/audit.js";
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

  assert.deepEqual(result.ecosystems, ["node"]);
  assert.equal(result.maxScore, 106);
  assert.equal(result.percentage, 100);
  assert.equal(result.failed, 0);
  assert.equal(findCheck(result, "node-package-workflow").passed, true);
});

test("reports actionable gaps when no README exists", async () => {
  const repo = await createTempRepo();
  const result = await auditRepository(repo);
  const report = formatMarkdownReport(result);

  assert.equal(result.readmePath, null);
  assert.equal(result.configPath, null);
  assert.deepEqual(result.config, { disabledRules: [], minScore: null });
  assert.deepEqual(result.ecosystems, []);
  assert.equal(result.percentage, 0);
  assert.match(report, /README: not found/);
  assert.match(report, /Ecosystems: none detected/);
  assert.match(report, /Needs Work/);
});

test("applies Python ecosystem checks when Python project files exist", async () => {
  const repo = await createTempRepo();
  await writeFile(path.join(repo, "pyproject.toml"), "[project]\nname = \"demo\"\n");
  await writeFile(path.join(repo, "README.md"), "# Python Tool\n\nShort.");

  const result = await auditRepository(repo);

  assert.deepEqual(result.ecosystems, ["python"]);
  assert.equal(findCheck(result, "python-environment-workflow").passed, false);
});

test("passes Rust ecosystem checks when Cargo commands are documented", async () => {
  const repo = await createTempRepo();
  await writeFile(path.join(repo, "Cargo.toml"), "[package]\nname = \"demo\"\nversion = \"0.1.0\"\n");
  await writeFile(
    path.join(repo, "README.md"),
    "# Rust Tool\n\nRust Tool helps maintainers test a crate.\n\n## Usage\n\n```sh\ncargo test\n```\n"
  );

  const result = await auditRepository(repo);

  assert.deepEqual(result.ecosystems, ["rust"]);
  assert.equal(findCheck(result, "rust-cargo-workflow").passed, true);
});

test("passes Go ecosystem checks when Go commands are documented", async () => {
  const repo = await createTempRepo();
  await writeFile(path.join(repo, "go.mod"), "module example.com/demo\n\ngo 1.22\n");
  await writeFile(
    path.join(repo, "README.md"),
    "# Go Tool\n\nGo Tool helps maintainers test a module.\n\n## Testing\n\n```sh\ngo test ./...\n```\n"
  );

  const result = await auditRepository(repo);

  assert.deepEqual(result.ecosystems, ["go"]);
  assert.equal(findCheck(result, "go-module-workflow").passed, true);
});

test("passes frontend ecosystem checks when dev commands are documented", async () => {
  const repo = await createTempRepo();
  await writeFile(
    path.join(repo, "package.json"),
    JSON.stringify({
      description: "Demo frontend",
      scripts: { dev: "vite --host 0.0.0.0", build: "vite build" },
      dependencies: { react: "^19.0.0", vite: "^7.0.0" }
    })
  );
  await writeFile(
    path.join(repo, "README.md"),
    "# Frontend Tool\n\nFrontend Tool helps maintainers test UI docs.\n\n## Installation\n\n```sh\nnpm install\n```\n\n## Usage\n\n```sh\nnpm run dev\n```\n"
  );

  const result = await auditRepository(repo);

  assert.deepEqual(result.ecosystems, ["node", "frontend"]);
  assert.equal(findCheck(result, "node-package-workflow").passed, true);
  assert.equal(findCheck(result, "frontend-dev-workflow").passed, true);
});

test("formats failed checks as SARIF", async () => {
  const repo = await createTempRepo();
  const result = await auditRepository(repo);
  const sarif = JSON.parse(formatSarifReport(result));

  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].tool.driver.name, "README Lens");
  assert.equal(sarif.runs[0].tool.driver.rules.length, result.checks.length);
  assert.equal(sarif.runs[0].results.length, result.failed);
  assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, "README.md");
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

test("prints SARIF from the CLI", async () => {
  const repo = await createTempRepo();
  const result = await execFileAsync(process.execPath, ["./src/cli.js", repo, "--sarif"]);
  const sarif = JSON.parse(result.stdout);

  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].results.length > 0, true);
});

test("parses CLI arguments", () => {
  assert.deepEqual(parseArgs(["docs", "--json", "--min-score", "75"]), {
    help: false,
    json: true,
    minScore: 75,
    path: "docs",
    sarif: false,
    version: false
  });

  assert.deepEqual(parseArgs(["docs", "--sarif"]), {
    help: false,
    json: false,
    minScore: null,
    path: "docs",
    sarif: true,
    version: false
  });
});

test("rejects multiple machine-readable output modes", () => {
  assert.throws(() => parseArgs(["--json", "--sarif"]), /cannot be used together/);
});

function findCheck(result, id) {
  const check = result.checks.find((candidate) => candidate.id === id);
  assert.ok(check, `Expected check ${id} to exist`);
  return check;
}

async function createTempRepo() {
  return mkdtemp(path.join(os.tmpdir(), "readme-lens-"));
}
