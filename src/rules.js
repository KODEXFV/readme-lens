export const rules = [
  {
    id: "project-title",
    title: "Clear project title",
    weight: 8,
    passes: (context) => /^#\s+\S+/m.test(context.readme),
    advice: "Start the README with a level-one heading that names the project."
  },
  {
    id: "summary",
    title: "Useful opening summary",
    weight: 10,
    passes: (context) => context.firstParagraph.length >= 120,
    advice: "Add a short opening paragraph that explains who the project is for and what problem it solves."
  },
  {
    id: "installation",
    title: "Installation instructions",
    weight: 12,
    passes: (context) =>
      context.hasHeading(/install|setup|getting started/) ||
      /\b(npm|pnpm|yarn|pip|cargo|go install|brew)\s+(install|add|i)\b/i.test(context.readme),
    advice: "Document the install command and any runtime requirements."
  },
  {
    id: "usage",
    title: "Usage instructions",
    weight: 14,
    passes: (context) =>
      context.hasHeading(/usage|quick start|getting started/) && context.codeFenceCount > 0,
    advice: "Include a quick command or code example that shows the common path."
  },
  {
    id: "options-api",
    title: "Options or API reference",
    weight: 8,
    passes: (context) => context.hasHeading(/api|options|configuration|commands|reference/),
    advice: "Describe supported commands, flags, exported functions, or configuration."
  },
  {
    id: "examples",
    title: "Examples",
    weight: 10,
    passes: (context) => context.hasHeading(/example|recipes/) || context.hasPath(/^examples\//),
    advice: "Add concrete examples, recipes, or an examples directory."
  },
  {
    id: "testing",
    title: "Testing guidance",
    weight: 8,
    passes: (context) =>
      context.hasHeading(/test|quality/) ||
      /\b(npm test|node --test|pytest|cargo test|go test|vitest|jest)\b/i.test(context.readme) ||
      Boolean(context.packageJson?.scripts?.test),
    advice: "Show contributors how to run the test suite."
  },
  {
    id: "contributing",
    title: "Contribution guidance",
    weight: 8,
    passes: (context) => context.hasPath(/^contributing\.md$/i) || context.hasHeading(/contribut/),
    advice: "Add contribution steps, local development notes, and pull request expectations."
  },
  {
    id: "license",
    title: "License",
    weight: 8,
    passes: (context) => context.hasPath(/^licen[cs]e(\.md|\.txt)?$/i) || /\blicen[cs]e\b/i.test(context.readme),
    advice: "Include a license file and mention it in the README."
  },
  {
    id: "security",
    title: "Security reporting",
    weight: 5,
    passes: (context) =>
      context.hasPath(/^security\.md$/i) ||
      context.hasPath(/^\.github\/security\.md$/i) ||
      /\b(security|vulnerability|responsible disclosure)\b/i.test(context.readme),
    advice: "Tell users how to report vulnerabilities privately."
  },
  {
    id: "changelog",
    title: "Change history",
    weight: 5,
    passes: (context) =>
      context.hasPath(/^changelog\.md$/i) ||
      context.hasHeading(/changelog|release notes|history/),
    advice: "Keep a changelog or release notes section so users can track changes."
  },
  {
    id: "repo-metadata",
    title: "Project metadata",
    weight: 4,
    passes: (context) =>
      Boolean(context.packageJson?.description) ||
      context.hasPath(/^pyproject\.toml$/i) ||
      context.hasPath(/^cargo\.toml$/i) ||
      context.hasPath(/^go\.mod$/i),
    advice: "Add package metadata such as description, scripts, keywords, or module information."
  },
  {
    id: "node-package-workflow",
    title: "Node package workflow",
    ecosystems: ["node"],
    weight: 6,
    applies: (context) => context.hasEcosystem("node"),
    passes: (context) => hasNodeInstallCommand(context.readme) && mentionsPackageScript(context),
    advice: "For Node projects, document the package manager install command and at least one package script such as test, lint, start, or build."
  },
  {
    id: "python-environment-workflow",
    title: "Python environment workflow",
    ecosystems: ["python"],
    weight: 6,
    applies: (context) => context.hasEcosystem("python"),
    passes: (context) =>
      /\b(python\s+-m\s+venv|virtualenv|pipx\s+install|pip\s+install|uv\s+(sync|pip\s+install)|poetry\s+install|hatch\s+env\s+create|conda\s+env\s+create)\b/i.test(
        context.readme
      ),
    advice: "For Python projects, document how to create the environment and install dependencies with pip, uv, Poetry, Hatch, Conda, or an equivalent tool."
  },
  {
    id: "rust-cargo-workflow",
    title: "Rust Cargo workflow",
    ecosystems: ["rust"],
    weight: 6,
    applies: (context) => context.hasEcosystem("rust"),
    passes: (context) => /\bcargo\s+(build|check|test|run|install)\b/i.test(context.readme),
    advice: "For Rust projects, document the Cargo command contributors should use, such as cargo build, cargo test, cargo run, or cargo install."
  },
  {
    id: "go-module-workflow",
    title: "Go module workflow",
    ecosystems: ["go"],
    weight: 6,
    applies: (context) => context.hasEcosystem("go"),
    passes: (context) => /\bgo\s+(test|run|build|install|get|mod\s+download)\b/i.test(context.readme),
    advice: "For Go projects, document the Go command contributors should use, such as go test ./..., go run, go build, or go install."
  },
  {
    id: "frontend-dev-workflow",
    title: "Frontend development workflow",
    ecosystems: ["frontend"],
    weight: 6,
    applies: (context) => context.hasEcosystem("frontend"),
    passes: (context) =>
      /\b(npm|pnpm|yarn|bun)\s+(run\s+)?(dev|build|preview|start)\b/i.test(context.readme) ||
      /\b(vite|next|nuxt|astro)\s+(dev|build|preview|start)\b/i.test(context.readme),
    advice: "For frontend projects, document the local development or build command, such as npm run dev, npm run build, vite dev, or next dev."
  }
];

function hasNodeInstallCommand(readme) {
  return /\b(npm|pnpm|yarn|bun)\s+(install|ci|add|i)\b/i.test(readme);
}

function mentionsPackageScript(context) {
  const scripts = context.packageScripts.filter((script) => !script.includes(":")).slice(0, 10);
  if (scripts.length === 0) {
    return true;
  }

  return scripts.some((script) => packageScriptPattern(script).test(context.readme));
}

function packageScriptPattern(script) {
  const escapedScript = escapeRegex(script);
  return new RegExp(`\\b(npm|pnpm|yarn|bun)\\s+(run\\s+)?${escapedScript}\\b`, "i");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
