# Contributing

Thanks for helping improve README Lens. The project is intentionally small and dependency-free, so changes should keep the CLI fast, readable, and easy to run in CI.

## Local Setup

```sh
git clone https://github.com/YOUR-USERNAME/readme-lens.git
cd readme-lens
npm install
npm test
```

## Development Workflow

1. Open an issue for larger rule changes so the scoring impact is clear.
2. Add or update tests in `test/audit.test.js`.
3. Keep rule advice short and actionable.
4. Run `npm test` and `npm run lint` before opening a pull request.

## Rule Guidelines

Rules should check for documentation signals that help real users evaluate or contribute to a project. Avoid rules that reward vanity metrics, hidden network calls, or project-specific branding.

## Pull Requests

Pull requests should include a short summary, test notes, and screenshots or pasted CLI output when the visible report changes.
