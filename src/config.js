import { promises as fs } from "node:fs";
import path from "node:path";

export const CONFIG_FILE = "readme-lens.config.json";

const DEFAULT_CONFIG = {
  disabledRules: [],
  minScore: null
};

export async function loadConfig(root) {
  const configPath = path.join(root, CONFIG_FILE);

  let content;
  try {
    content = await fs.readFile(configPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        config: { ...DEFAULT_CONFIG },
        configPath: null
      };
    }
    throw error;
  }

  let rawConfig;
  try {
    rawConfig = JSON.parse(content);
  } catch (error) {
    throw new Error(`${CONFIG_FILE} is not valid JSON: ${error.message}`);
  }

  return {
    config: normalizeConfig(rawConfig),
    configPath
  };
}

function normalizeConfig(rawConfig) {
  if (!isPlainObject(rawConfig)) {
    throw new Error(`${CONFIG_FILE} must contain a JSON object`);
  }

  const allowedKeys = new Set(["disabledRules", "minScore"]);
  const unknownKeys = Object.keys(rawConfig).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`${CONFIG_FILE} has unsupported option: ${unknownKeys.join(", ")}`);
  }

  const disabledRules = rawConfig.disabledRules ?? DEFAULT_CONFIG.disabledRules;
  if (!Array.isArray(disabledRules) || !disabledRules.every((ruleId) => typeof ruleId === "string")) {
    throw new Error(`${CONFIG_FILE} option disabledRules must be an array of rule IDs`);
  }

  const minScore = rawConfig.minScore ?? DEFAULT_CONFIG.minScore;
  if (minScore !== null && (!Number.isInteger(minScore) || minScore < 0 || minScore > 100)) {
    throw new Error(`${CONFIG_FILE} option minScore must be an integer from 0 to 100`);
  }

  return {
    disabledRules: [...new Set(disabledRules)],
    minScore
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
