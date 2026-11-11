import type { GitHubApi, RepoInfo } from './preflight.js';

/**
 * The preflight's GitHub reads over the REST API, with a token.
 * canPush comes from the token's permissions on the repo; when the 402 Found
 * GitHub App replaces the token, the same check becomes "App installed here".
 */
export class GitHubRest implements GitHubApi {
  constructor(
    private readonly token: string,
    private readonly baseUrl = 'https://api.github.com'
  ) {}

  private async get(path: string): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': '402-found-engine',
      },
      signal: AbortSignal.timeout(15_000),
    });
  }

  private static enc(s: string) {
    return encodeURIComponent(s);
  }

  async getRepo(owner: string, repo: string): Promise<RepoInfo | null> {
    const res = await this.get(`/repos/${GitHubRest.enc(owner)}/${GitHubRest.enc(repo)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub ${res.status} reading ${owner}/${repo}`);
    const r = (await res.json()) as {
      full_name: string;
      default_branch: string;
      size: number;
      permissions?: { push?: boolean };
    };
    return { fullName: r.full_name, defaultBranch: r.default_branch, sizeKb: r.size, canPush: r.permissions?.push === true };
  }

  async listFiles(owner: string, repo: string, ref: string): Promise<string[]> {
    const res = await this.get(
      `/repos/${GitHubRest.enc(owner)}/${GitHubRest.enc(repo)}/git/trees/${GitHubRest.enc(ref)}?recursive=1`
    );
    if (!res.ok) throw new Error(`GitHub ${res.status} listing ${owner}/${repo}`);
    const t = (await res.json()) as { tree: Array<{ path: string; type: string }> };
    return t.tree.filter((e) => e.type === 'blob').map((e) => e.path);
  }

  async readFile(owner: string, repo: string, path: string, ref: string): Promise<string | null> {
    const p = path.split('/').map(GitHubRest.enc).join('/');
    const res = await this.get(
      `/repos/${GitHubRest.enc(owner)}/${GitHubRest.enc(repo)}/contents/${p}?ref=${GitHubRest.enc(ref)}`
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub ${res.status} reading ${path}`);
    const f = (await res.json()) as { content?: string; encoding?: string };
    return f.encoding === 'base64' && f.content ? Buffer.from(f.content, 'base64').toString('utf8') : null;
  }
}
