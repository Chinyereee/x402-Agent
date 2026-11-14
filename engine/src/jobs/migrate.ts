import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { migrateDirectory, type MigrationResult } from '../../../codemod/src/migrate-directory.js';
import type { JobResult, RunJob } from '../app.js';

const run = promisify(execFile);

/** The one GitHub write the job needs. Implemented by GitHubRest, faked in tests. */
export interface PullRequestApi {
  /** Opens a pull request and returns its html_url */
  openPullRequest(
    owner: string,
    repo: string,
    pr: { head: string; base: string; title: string; body: string }
  ): Promise<string>;
}

export interface MigrateJobDeps {
  /** Same token as the preflight: clones and pushes over HTTPS */
  token: string;
  github: PullRequestApi;
  /** Branches are named <prefix>ethers-v6-<id>, so the demo reset can find them */
  branchPrefix?: string;
  /** Swapped in tests; defaults to the codemod in /codemod */
  migrate?: (dir: string) => MigrationResult;
}

/** Commit identity for the engine's branch */
const AUTHOR = ['-c', 'user.name=402 Found', '-c', 'user.email=engine@402found.invalid'];

/** Pass the token as a header, never in the remote URL, so it can't end up in .git/config or an error message. */
function authArgs(token: string): string[] {
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  return ['-c', `http.https://github.com/.extraheader=AUTHORIZATION: basic ${basic}`];
}

/** needsHuman entries from what the codemod could not finish */
export function needsHuman(r: MigrationResult): JobResult['needsHuman'] {
  return [
    ...r.todos.map((t) => ({ file: t.file, line: t.line, reason: t.text })),
    ...r.failures.map((f) => ({ file: f.file, line: 0, reason: `not migrated: ${f.error}` })),
    ...r.packageJson.warnings.map((w) => ({ file: 'package.json', line: 0, reason: w })),
  ];
}

/** Pull request description: what changed, then what the maintainer should check. */
export function prBody(r: MigrationResult, jobId: string, lockfile: boolean): string {
  const lines = [
    'This pull request migrates ethers v5 to v6. It was opened by the 402 Found engine and paid for with USDC on Stellar.',
    '',
    `**Files changed (${r.modified.length})**`,
    ...r.modified.map((f) => `- \`${f}\``),
    ...(lockfile ? ['- `package-lock.json` (regenerated)'] : []),
    '',
    `**Transforms applied:** ${r.transformsApplied.length ? r.transformsApplied.join(', ') : 'none'}`,
  ];
  if (r.packageJson.warnings.length) {
    lines.push('', '**package.json: please check**', ...r.packageJson.warnings.map((w) => `- ${w}`));
  }
  if (r.todos.length) {
    lines.push('', '**Left for you (TODO comments in the code)**', ...r.todos.map((t) => `- \`${t.file}:${t.line}\` ${t.text}`));
  }
  if (r.failures.length) {
    lines.push('', '**Not migrated (left unchanged)**', ...r.failures.map((f) => `- \`${f.file}\`: ${f.error}`));
  }
  lines.push('', 'Run `npm install` and your tests before merging.', '', `Job: \`${jobId}\``);
  return lines.join('\n');
}

/**
 * Step C: clone the default branch, run the codemod, regenerate the lockfile,
 * push a branch and open a pull request. Any failure throws, so the app
 * answers 5xx and the payment is never settled.
 */
export function createMigrateJob({ token, github, branchPrefix = '402found/', migrate = migrateDirectory }: MigrateJobDeps): RunJob {
  return async ({ repo }, { signal }) => {
    const jobId = `job_${randomUUID()}`;
    const branch = `${branchPrefix}ethers-v6-${jobId.slice(4, 12)}`;
    const dir = await mkdtemp(path.join(tmpdir(), '402found-'));
    const git = (...args: string[]) => run('git', [...authArgs(token), ...AUTHOR, ...args], { cwd: dir, signal });

    try {
      await git('clone', '--depth', '1', '--branch', repo.defaultBranch, `https://github.com/${repo.fullName}.git`, '.');

      const result = migrate(dir);
      if (result.modified.length === 0) throw new Error('nothing_to_migrate');

      // Lockfile follows package.json; --ignore-scripts so the repo's own scripts never run here.
      const lockfile = result.packageJson.changed && existsSync(path.join(dir, 'package-lock.json'));
      if (lockfile) {
        await run('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: dir, signal });
      }

      await git('checkout', '-b', branch);
      await git('add', '-A');
      await git('commit', '-m', 'Migrate ethers v5 to v6', '-m', `Opened by the 402 Found engine (${jobId}).`);
      await git('push', 'origin', branch);

      const prUrl = await github.openPullRequest(repo.owner, repo.repo, {
        head: branch,
        base: repo.defaultBranch,
        title: 'Migrate ethers v5 to v6',
        body: prBody(result, jobId, lockfile),
      });

      return {
        status: 'pr_opened',
        jobId,
        prUrl,
        transforms: [...result.transformsApplied, ...(result.packageJson.changed ? ['package-json'] : [])],
        needsHuman: needsHuman(result),
      };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };
}
