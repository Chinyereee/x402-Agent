/**
 * Free preflight: everything we can check before asking for money.
 * A repository that fails here gets a 4xx and is never asked to pay.
 * Error codes follow the table in the shared README.
 */

export interface RepoRef {
  owner: string;
  repo: string;
}

export interface RepoInfo {
  fullName: string;
  defaultBranch: string;
  /** Repository size as GitHub reports it, in KB */
  sizeKb: number;
  /** Whether the engine's GitHub identity can push branches (App installed / token has write) */
  canPush: boolean;
}

/** The few GitHub reads the preflight needs. Implemented by GitHubRest, faked in tests. */
export interface GitHubApi {
  /** null when the repository does not exist or the engine cannot see it */
  getRepo(owner: string, repo: string): Promise<RepoInfo | null>;
  /** Every file path on the default branch */
  listFiles(owner: string, repo: string, ref: string): Promise<string[]>;
  /** File contents, or null if missing */
  readFile(owner: string, repo: string, path: string, ref: string): Promise<string | null>;
}

export type PreflightResult =
  | {
      ok: true;
      repo: RepoRef & { fullName: string; defaultBranch: string };
      /** package.json files that depend on ethers v5 */
      ethersPackages: string[];
    }
  | { ok: false; status: 400 | 403 | 404 | 413 | 422 | 502; error: string; message: string };

const GITHUB_REPO_URL = /^https:\/\/github\.com\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?\/?$/;
/** At most this many package.json files are read (monorepos) */
const MAX_PACKAGE_FILES = 30;

/** https://github.com/<owner>/<repo>[.git][/] → { owner, repo }; anything else → null */
export function parseRepoUrl(url: unknown): RepoRef | null {
  if (typeof url !== 'string') return null;
  const m = GITHUB_REPO_URL.exec(url);
  if (!m || m[2] === '.' || m[2] === '..') return null;
  return { owner: m[1], repo: m[2] };
}

/** Major version a semver range starts from: '^5.7.2' → 5, '~5.0' → 5, '>=5 <7' → 5, 'latest' → null */
export function majorOf(range: string): number | null {
  const m = /(\d+)/.exec(range.replace(/^npm:ethers@/, ''));
  return m ? Number(m[1]) : null;
}

function ethersRange(packageJson: string): string | null {
  try {
    const p = JSON.parse(packageJson) as Record<string, Record<string, string> | undefined>;
    return p.dependencies?.ethers ?? p.devDependencies?.ethers ?? p.peerDependencies?.ethers ?? null;
  } catch {
    return null;
  }
}

export async function preflight(
  repoUrl: unknown,
  github: GitHubApi,
  limits: { maxRepoKb: number }
): Promise<PreflightResult> {
  const ref = parseRepoUrl(repoUrl);
  if (!ref) {
    return { ok: false, status: 400, error: 'not_github_repo', message: 'repoUrl must be https://github.com/<owner>/<repo>' };
  }

  try {
    const info = await github.getRepo(ref.owner, ref.repo);
    if (!info) {
      return { ok: false, status: 404, error: 'repo_not_found', message: `${ref.owner}/${ref.repo} not found` };
    }
    if (!info.canPush) {
      return {
        ok: false,
        status: 403,
        error: 'no_push_access',
        message: 'install the 402 Found GitHub App on this repository so the engine can open a pull request',
      };
    }
    if (info.sizeKb > limits.maxRepoKb) {
      return {
        ok: false,
        status: 413,
        error: 'repo_too_large',
        message: `repository is ${info.sizeKb} KB, the limit is ${limits.maxRepoKb} KB`,
      };
    }

    const packageFiles = (await github.listFiles(ref.owner, ref.repo, info.defaultBranch))
      .filter((p) => (p === 'package.json' || p.endsWith('/package.json')) && !p.split('/').includes('node_modules'))
      .slice(0, MAX_PACKAGE_FILES);
    const ethersPackages: string[] = [];
    for (const path of packageFiles) {
      const content = await github.readFile(ref.owner, ref.repo, path, info.defaultBranch);
      const range = content ? ethersRange(content) : null;
      if (range && majorOf(range) === 5) ethersPackages.push(path);
    }
    if (ethersPackages.length === 0) {
      return { ok: false, status: 422, error: 'no_ethers_v5', message: 'no package.json depends on ethers v5' };
    }

    return {
      ok: true,
      repo: { ...ref, fullName: info.fullName, defaultBranch: info.defaultBranch },
      ethersPackages,
    };
  } catch (err) {
    return { ok: false, status: 502, error: 'github_unavailable', message: (err as Error).message };
  }
}
