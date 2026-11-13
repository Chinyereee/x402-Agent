// The pull request the codemod engine opened, read from what it returned after settling.
// The engine's field name is not fixed yet, so a few common shapes are accepted.
export function prUrl(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const pr = d.pr as Record<string, unknown> | string | undefined;
  const v = d.prUrl ?? d.pr_url ?? d.pullRequestUrl ?? d.pull_request_url ?? (typeof pr === "string" ? pr : pr?.url ?? pr?.html_url);
  return typeof v === "string" && /^https:\/\/github\.com\/.+\/pull\/\d+/.test(v) ? v : undefined;
}

export const prLabel = (url: string) => url.replace(/^https:\/\/github\.com\//, "").replace("/pull/", " #");
