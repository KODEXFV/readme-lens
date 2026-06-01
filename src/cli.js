#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VERSION, helpText, parseArgs } from "./args.js";
import { auditRepository, formatMarkdownReport } from "./audit.js";

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`readme-lens: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  if (args.help) {
    console.log(helpText());
    return;
  }

  if (args.version) {
    console.log(VERSION);
    return;
  }

  try {
    const result = await auditRepository(args.path);
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatMarkdownReport(result));
    }

    const minScore = args.minScore ?? result.config.minScore;
    if (minScore !== null && result.percentage < minScore) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`readme-lens: ${error.message}`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
