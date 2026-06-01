export const VERSION = "0.2.0";

export function parseArgs(argv) {
  const parsed = {
    help: false,
    json: false,
    minScore: null,
    path: ".",
    version: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--version" || arg === "-v") {
      parsed.version = true;
    } else if (arg === "--json") {
      parsed.json = true;
    } else if (arg === "--min-score") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        throw new Error("--min-score must be an integer from 0 to 100");
      }
      parsed.minScore = value;
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      parsed.path = arg;
    }
  }

  return parsed;
}

export function helpText() {
  return `README Lens ${VERSION}

Usage:
  readme-lens [path] [options]

Options:
  --json              Print the audit result as JSON.
  --min-score <0-100> Exit with code 1 when the score is below this value.
                      Overrides readme-lens.config.json when both are set.
  -v, --version       Print the version.
  -h, --help          Print this help text.

Examples:
  readme-lens .
  readme-lens ../my-project --min-score 80
  readme-lens . --json
`;
}
