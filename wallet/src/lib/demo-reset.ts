// Demo reset for the codemod test repo: close the pull requests the engine opened and delete
// its branches, so a rehearsal never leaves "branch / PR already exists" behind for live judging.
// Only touches branches under DEMO_BRANCH_PREFIX (default "402found/") on ENGINE_TEST_REPO.
// Needs GITHUB_TOKEN with write access to that repo. Plan first, apply only when asked.

type Env = Record<string, string | undefined>;
export type ResetPlan = { repo: string; prefix: string; pulls: { number: number; title: string; branch: string; url: string }[]; branches: string[] };

function setup(env: Env) {
  const m = (env.ENGINE_TEST_REPO || "").match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!m) throw new Error("ENGINE_TEST_REPO is not a GitHub repo URL");
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set, so the demo repo cannot be reset");
  const repo = `${m[1]}/${m[2].replace(/\.git$/, "")}`;
  const prefix = env.DEMO_BRANCH_PREFIX || "402found/";
  const gh = (path: string, init: RequestInit = {}) =>
    fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${env.GITHUB_TOKEN}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "402-found-wallet" },
      signal: AbortSignal.timeout(15_000),
    });
  return { repo, prefix, gh };
}

export async function plan(env: Env): Promise<ResetPlan> {
  const { repo, prefix, gh } = setup(env);
  const [p, b] = await Promise.all([gh("/pulls?state=open&per_page=100"), gh(`/git/matching-refs/heads/${prefix}`)]);
  if (!p.ok) throw new Error(`GitHub ${p.status} listing pull requests on ${repo}`);
  if (!b.ok) throw new Error(`GitHub ${b.status} listing branches on ${repo}`);
  const pulls = ((await p.json()) as { number: number; title: string; html_url: string; head: { ref: string } }[])
    .filter((x) => x.head.ref.startsWith(prefix))
    .map((x) => ({ number: x.number, title: x.title, branch: x.head.ref, url: x.html_url }));
  const branches = ((await b.json()) as { ref: string }[]).map((r) => r.ref.replace("refs/heads/", ""));
  return { repo, prefix, pulls, branches };
}

export async function apply(env: Env): Promise<ResetPlan & { closed: number[]; deleted: string[]; errors: string[] }> {
  const { gh } = setup(env);
  const p = await plan(env);
  const closed: number[] = [];
  const deleted: string[] = [];
  const errors: string[] = [];
  for (const pr of p.pulls) {
    const r = await gh(`/pulls/${pr.number}`, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
    if (r.ok) closed.push(pr.number);
    else errors.push(`PR #${pr.number}: GitHub ${r.status}`);
  }
  for (const name of p.branches) {
    const r = await gh(`/git/refs/heads/${name.split("/").map(encodeURIComponent).join("/")}`, { method: "DELETE" });
    if (r.ok || r.status === 204) deleted.push(name);
    else errors.push(`${name}: GitHub ${r.status}`);
  }
  return { ...p, closed, deleted, errors };
}
