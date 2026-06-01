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
  }
];
