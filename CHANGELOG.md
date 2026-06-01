# Changelog

All notable changes to README Lens will be documented in this file.

## 0.4.0 - 2026-06-01

- Added applicable ecosystem detection for Node.js, Python, Rust, Go, and frontend projects.
- Added ecosystem-specific README checks that run only when matching project files are detected.
- Added ecosystem metadata to markdown, JSON, and SARIF output.
- Updated tests and documentation for ecosystem-aware scoring.

## 0.3.0 - 2026-06-01

- Added `--sarif` output for GitHub code scanning dashboards.
- Added SARIF formatter tests and CLI coverage.
- Added a composite GitHub Action for writing SARIF results.
- Documented GitHub Actions usage for uploading README Lens findings.
- Added a copyable GitHub Actions workflow template.

## 0.2.0 - 2026-06-01

- Added `readme-lens.config.json` support.
- Added configurable disabled rule IDs.
- Added configurable default `minScore` for CI usage.
- Documented configuration behavior and added tests for valid and invalid configs.

## 0.1.0 - 2026-06-01

- Added the initial README audit engine.
- Added markdown and JSON output.
- Added CI-friendly `--min-score` support.
- Added tests with Node's built-in test runner.
