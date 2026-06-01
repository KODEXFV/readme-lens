# README Lens

README Lens is a dependency-free command line tool for maintainers who want quick, repeatable feedback on whether a repository is easy to install, evaluate, use, test, and contribute to. It scores common onboarding signals, prints practical fixes, and can run in CI so documentation quality does not depend on a one-time manual review.

## Installation

Use the project from source while the package is early:

```sh
git clone https://github.com/KODEXFV/readme-lens.git
cd readme-lens
npm install
npm link
```

After linking, the `readme-lens` command is available on your machine.

## Usage

Audit the current repository:

```sh
readme-lens .
```

Require a minimum score in CI:

```sh
readme-lens . --min-score 80
```

Print machine-readable output:

```sh
readme-lens . --json
```

## Options

| Option | Description |
| --- | --- |
| `--json` | Print the full audit result as JSON. |
| `--min-score <0-100>` | Exit with code `1` when the score is below the threshold. |
| `-v`, `--version` | Print the current version. |
| `-h`, `--help` | Print command help. |

## Configuration

Add `readme-lens.config.json` to the repository root to tune scoring for a project:

```json
{
  "disabledRules": ["repo-metadata"],
  "minScore": 85
}
```

`disabledRules` removes rule IDs from scoring. `minScore` sets the default CI threshold when the CLI is run without `--min-score`; the CLI flag overrides the config file when both are provided.

## Examples

Run the included example report to see the output shape:

```sh
node ./src/cli.js . --min-score 90
```

README Lens currently checks for a project title, useful summary, installation steps, usage examples, options or API reference, examples, testing guidance, contribution notes, licensing, security reporting, change history, and package metadata.

## API

The audit engine can also be imported by other Node.js tools:

```js
import { auditRepository, formatMarkdownReport } from "readme-lens";

const result = await auditRepository(".");
console.log(formatMarkdownReport(result));
```

The returned result includes the resolved target path, README path, score, grade, and each individual check with its weight and advice.

## Testing

Run the test suite with Node's built-in test runner:

```sh
npm test
```

Check JavaScript syntax:

```sh
npm run lint
```

## Contributing

Issues and pull requests are welcome. Good first contributions include new rules, better scoring advice, support for more repository ecosystems, and fixtures that cover real documentation patterns.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local development workflow and review expectations.

## Security

README Lens only reads local repository files and does not send project content over the network. Please report suspected vulnerabilities using the process in [SECURITY.md](SECURITY.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Roadmap

- Add optional SARIF output for code scanning dashboards.
- Add ecosystem-specific rules for Python, Rust, Go, and frontend packages.
- Add a GitHub Action wrapper for one-line CI setup.
- Expand rule configuration for per-rule weights and ecosystem presets.

## License

MIT
