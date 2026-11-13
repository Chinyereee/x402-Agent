// Reset the codemod demo repo from the command line, before a rehearsal or live judging.
//   node --experimental-strip-types scripts/demo-reset.mts         shows what would be closed and deleted
//   node --experimental-strip-types scripts/demo-reset.mts --yes   does it
// Reads ENGINE_TEST_REPO, GITHUB_TOKEN and DEMO_BRANCH_PREFIX from the environment or .env.local.
import { readFileSync, existsSync } from "node:fs";
import { apply, plan } from "../src/lib/demo-reset.ts";

const env: Record<string, string | undefined> = { ...process.env };
if (existsSync(".env.local"))
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i > 0 && !line.startsWith("#") && env[line.slice(0, i).trim()] === undefined) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }

const yes = process.argv.includes("--yes");
const done = yes ? await apply(env) : null;
const p = done ?? (await plan(env));
console.log(`${p.repo} · branches under ${p.prefix}`);
for (const pr of p.pulls) console.log(`  PR #${pr.number} ${pr.title} (${pr.branch})`);
for (const b of p.branches) console.log(`  branch ${b}`);
if (!p.pulls.length && !p.branches.length) console.log("  nothing to reset");
if (done) {
  console.log(`closed ${done.closed.length} PRs, deleted ${done.deleted.length} branches`);
  for (const e of done.errors) console.log(`  could not: ${e}`);
} else if (p.pulls.length || p.branches.length) console.log("Run again with --yes to close and delete these.");
