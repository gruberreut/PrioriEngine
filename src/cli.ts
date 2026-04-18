#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportCliError, runRankCli } from "./runCli.js";

const resolvedExec = process.argv[1] ? path.resolve(process.argv[1]) : "";
const resolvedThis = path.resolve(fileURLToPath(import.meta.url));

if (resolvedExec === resolvedThis) {
  runRankCli(process.argv.slice(2)).catch(reportCliError);
}
