import { promises as fs } from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { rules } from "./rules.js";

const README_PATTERN = /^readme(\.(md|markdown|txt|rst))?$/i;

export async function auditRepository(targetPath = ".") {
  const root = path.resolve(targetPath);
  const { config, configPath } = await loadConfig(root);
  const enabledRules = filterRules(rules, config.disabledRules);
  const files = await collectFiles(root);
  const readmePath = files.find((file) => README_PATTERN.test(file));
  const readme = readmePath ? await readText(path.join(root, readmePath)) : "";
  const packageJson = await readPackageJson(root);
  const context = createContext({ files, packageJson, readme });
  const checks = enabledRules.map((rule) => {
    const passed = Boolean(rule.passes(context));

    return {
      id: rule.id,
      title: rule.title,
      weight: rule.weight,
      passed,
      score: passed ? rule.weight : 0,
      advice: rule.advice
    };
  });
  const score = checks.reduce((total, check) => total + check.score, 0);
  const maxScore = checks.reduce((total, check) => total + check.weight, 0);
  const percentage = Math.round((score / maxScore) * 100);

  return {
    targetPath: root,
    readmePath: readmePath ? path.join(root, readmePath) : null,
    configPath,
    config,
    score,
    maxScore,
    percentage,
    grade: gradeForScore(percentage),
    passed: checks.filter((check) => check.passed).length,
    failed: checks.filter((check) => !check.passed).length,
    checks
  };
}

export function formatMarkdownReport(result) {
  const failedChecks = result.checks.filter((check) => !check.passed);
  const passedChecks = result.checks.filter((check) => check.passed);
  const lines = [
    "# README Lens Report",
    "",
    `Target: ${result.targetPath}`,
    `README: ${result.readmePath ?? "not found"}`,
    `Config: ${result.configPath ?? "not found"}`,
    `Score: ${result.score}/${result.maxScore} (${result.percentage}%, ${result.grade})`,
    "",
    "## Passed",
    ""
  ];

  if (passedChecks.length === 0) {
    lines.push("- No checks passed yet.");
  } else {
    for (const check of passedChecks) {
      lines.push(`- ${check.title} (+${check.weight})`);
    }
  }

  lines.push("", "## Needs Work", "");

  if (failedChecks.length === 0) {
    lines.push("- No gaps found.");
  } else {
    for (const check of failedChecks) {
      lines.push(`- ${check.title} (${check.weight} pts): ${check.advice}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function createContext({ files, packageJson, readme }) {
  const normalizedFiles = files.map(toPosixPath);
  const headings = [...readme.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim());
  const firstParagraph = getFirstParagraph(readme);

  return {
    codeFenceCount: (readme.match(/```/g) ?? []).length / 2,
    files: normalizedFiles,
    firstParagraph,
    headings,
    packageJson,
    readme,
    hasHeading(pattern) {
      return headings.some((heading) => pattern.test(heading.toLowerCase()));
    },
    hasPath(pattern) {
      return normalizedFiles.some((file) => pattern.test(file));
    }
  };
}

function filterRules(allRules, disabledRules) {
  const knownRuleIds = new Set(allRules.map((rule) => rule.id));
  const unknownRuleIds = disabledRules.filter((ruleId) => !knownRuleIds.has(ruleId));
  if (unknownRuleIds.length > 0) {
    throw new Error(`readme-lens.config.json has unknown rule ID: ${unknownRuleIds.join(", ")}`);
  }

  const disabledRuleIds = new Set(disabledRules);
  const enabledRules = allRules.filter((rule) => !disabledRuleIds.has(rule.id));
  if (enabledRules.length === 0) {
    throw new Error("readme-lens.config.json must leave at least one rule enabled");
  }

  return enabledRules;
}

async function collectFiles(root, depth = 0) {
  if (depth > 3) {
    return [];
  }

  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Path does not exist: ${root}`);
    }
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    if (shouldSkip(entry.name)) {
      continue;
    }

    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const childFiles = await collectFiles(entryPath, depth + 1);
      files.push(...childFiles.map((file) => path.join(entry.name, file)));
    } else if (entry.isFile()) {
      files.push(entry.name);
    }
  }

  return files.map(toPosixPath);
}

async function readPackageJson(root) {
  try {
    const content = await readText(path.join(root, "package.json"));
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

function getFirstParagraph(markdown) {
  const withoutHeading = markdown.replace(/^#\s+.+$/m, "").trim();
  const paragraph = withoutHeading
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .find((part) => part.length > 0);

  return paragraph ?? "";
}

function gradeForScore(score) {
  if (score >= 90) {
    return "excellent";
  }
  if (score >= 75) {
    return "good";
  }
  if (score >= 50) {
    return "needs work";
  }
  return "critical";
}

function shouldSkip(name) {
  return [".git", "node_modules", "dist", "coverage", ".next", ".turbo"].includes(name);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}
