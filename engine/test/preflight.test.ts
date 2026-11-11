import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp, type RunJob } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { preflight, parseRepoUrl } from '../src/preflight.js';
import { FakeFacilitator, FakeGitHub, PAY_TO, paymentFor } from './helpers.js';

const pkg = (deps: Record<string, string>) => JSON.stringify({ name: 'x', dependencies: deps });

describe('parseRepoUrl', () => {
  it('accepts https://github.com/<owner>/<repo>, with or without .git or a trailing slash', () => {
    expect(parseRepoUrl('https://github.com/lina/tutor-app')).toEqual({ owner: 'lina', repo: 'tutor-app' });
    expect(parseRepoUrl('https://github.com/lina/tutor-app.git')).toEqual({ owner: 'lina', repo: 'tutor-app' });
    expect(parseRepoUrl('https://github.com/lina/tutor-app/')).toEqual({ owner: 'lina', repo: 'tutor-app' });
  });

  it('rejects other hosts, other schemes, paths, credentials and junk', () => {
    for (const bad of [
      'http://github.com/lina/app',
      'https://gitlab.com/lina/app',
      'https://github.com.evil.com/lina/app',
      'https://user:pass@github.com/lina/app',
      'https://github.com/lina/app/tree/main',
      'https://github.com/lina',
      'file:///etc/passwd',
      '',
      42,
      undefined,
    ]) {
      expect(parseRepoUrl(bad as never)).toBeNull();
    }
  });
});

describe('preflight', () => {
  let gh: FakeGitHub;
  const limits = { maxRepoKb: 50_000 };
  beforeEach(() => {
    gh = new FakeGitHub();
  });

  it('passes a repo the engine can push to that uses ethers v5', async () => {
    gh.add('lina/tutor-app', { 'package.json': pkg({ ethers: '^5.7.2' }) });
    expect(await preflight('https://github.com/lina/tutor-app', gh, limits)).toMatchObject({
      ok: true,
      repo: { owner: 'lina', repo: 'tutor-app', defaultBranch: 'main' },
      ethersPackages: ['package.json'],
    });
  });

  it('finds ethers v5 in a workspace package (scaffold-eth layout)', async () => {
    gh.add('a/b', {
      'package.json': JSON.stringify({ workspaces: ['packages/*'] }),
      'packages/react-app/package.json': pkg({ ethers: '5.4.1' }),
      'packages/react-app/node_modules/x/package.json': pkg({ ethers: '^5.0.0' }),
    });
    const r = await preflight('https://github.com/a/b', gh, limits);
    expect(r).toMatchObject({ ok: true, ethersPackages: ['packages/react-app/package.json'] });
  });

  it.each([
    ['400 for a URL that is not a github.com repo', 'https://gitlab.com/a/b', 400, 'not_github_repo'],
    ['404 for a repo that does not exist', 'https://github.com/a/missing', 404, 'repo_not_found'],
  ])('%s', async (_name, url, status, error) => {
    expect(await preflight(url, gh, limits)).toMatchObject({ ok: false, status, error });
  });

  it('403 when the engine cannot push to the repo (GitHub App not installed)', async () => {
    gh.add('a/b', { 'package.json': pkg({ ethers: '^5.7.0' }) }, { canPush: false });
    expect(await preflight('https://github.com/a/b', gh, limits)).toMatchObject({ ok: false, status: 403, error: 'no_push_access' });
  });

  it('413 for a repo over the size limit', async () => {
    gh.add('a/b', { 'package.json': pkg({ ethers: '^5.7.0' }) }, { sizeKb: 60_000 });
    expect(await preflight('https://github.com/a/b', gh, limits)).toMatchObject({ ok: false, status: 413, error: 'repo_too_large' });
  });

  it.each([
    ['no package.json', {}],
    ['no ethers dependency', { 'package.json': pkg({ react: '^18.0.0' }) }],
    ['already on ethers 6', { 'package.json': pkg({ ethers: '^6.13.0' }) }],
  ])('422 when there is %s', async (_name, files) => {
    gh.add('a/b', files as Record<string, string>);
    expect(await preflight('https://github.com/a/b', gh, limits)).toMatchObject({ ok: false, status: 422, error: 'no_ethers_v5' });
  });

  it('treats ethers in devDependencies as ethers v5 too', async () => {
    gh.add('a/b', { 'package.json': JSON.stringify({ devDependencies: { ethers: '~5.7.0' } }) });
    expect(await preflight('https://github.com/a/b', gh, limits)).toMatchObject({ ok: true });
  });
});

describe('POST /api/v1/migrate – preflight runs before any payment request', () => {
  const okJob: RunJob = async () => ({ status: 'pr_opened', jobId: 'j', prUrl: 'u', transforms: [], needsHuman: [] });

  it('a repo that fails preflight gets its 4xx and no PAYMENT-REQUIRED header', async () => {
    const gh = new FakeGitHub();
    const facilitator = new FakeFacilitator();
    const app = createApp({ config: loadConfig({ PAY_TO }), facilitator, runJob: okJob, github: gh });
    const res = await request(app).post('/api/v1/migrate').send({ repoUrl: 'https://github.com/a/missing' });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 'rejected', error: 'repo_not_found' });
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('a repo that passes gets the 402, and is checked again when the paid request arrives', async () => {
    const gh = new FakeGitHub();
    gh.add('lina/tutor-app', { 'package.json': pkg({ ethers: '^5.7.2' }) });
    const facilitator = new FakeFacilitator();
    let jobInput: unknown;
    const app = createApp({
      config: loadConfig({ PAY_TO }),
      facilitator,
      github: gh,
      runJob: async (input) => {
        jobInput = input;
        return okJob(input, { signal: new AbortController().signal });
      },
    });
    const body = { repoUrl: 'https://github.com/lina/tutor-app' };
    const unpaid = await request(app).post('/api/v1/migrate').send(body);
    expect(unpaid.status).toBe(402);
    const paid = await request(app).post('/api/v1/migrate').set('PAYMENT-SIGNATURE', paymentFor(unpaid.headers['payment-required'])).send(body);
    expect(paid.status).toBe(200);
    expect(gh.calls).toBe(2);
    // The job receives the preflight's findings, so it does not look them up again.
    expect(jobInput).toMatchObject({
      repoUrl: body.repoUrl,
      repo: { owner: 'lina', repo: 'tutor-app', defaultBranch: 'main' },
      ethersPackages: ['package.json'],
    });
  });
});
