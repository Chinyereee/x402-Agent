import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { decodePaymentRequiredHeader, decodePaymentResponseHeader } from '@x402/core/http';

import { createApp, type RunJob } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { FakeFacilitator, FakeGitHub, PAY_TO, paymentFor } from './helpers.js';

const REPO = { repoUrl: 'https://github.com/lina/tutor-app' };
const okJob: RunJob = async () => ({
  status: 'pr_opened',
  jobId: 'job_test',
  prUrl: 'https://github.com/lina/tutor-app/pull/12',
  transforms: ['rename-utils'],
  needsHuman: [],
});

describe('POST /api/v1/migrate – the x402 handshake', () => {
  let facilitator: FakeFacilitator;
  beforeEach(() => {
    facilitator = new FakeFacilitator();
  });

  const github = new FakeGitHub();
  github.add('lina/tutor-app', { 'package.json': JSON.stringify({ dependencies: { ethers: '^5.7.2' } }) });
  const app = (runJob: RunJob = okJob, env: Record<string, string> = {}) =>
    createApp({ config: loadConfig({ PAY_TO, ...env }), facilitator, github, runJob });

  it('answers an unpaid request with 402 and the payment requirements from the README', async () => {
    const res = await request(app()).post('/api/v1/migrate').send(REPO);
    expect(res.status).toBe(402);
    const required = decodePaymentRequiredHeader(res.headers['payment-required']);
    expect(required.x402Version).toBe(2);
    expect(required.accepts).toHaveLength(1);
    expect(required.accepts[0]).toMatchObject({
      scheme: 'exact',
      network: 'stellar:testnet',
      asset: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
      amount: '500000',
      payTo: PAY_TO,
      maxTimeoutSeconds: 900,
    });
    expect(facilitator.verified).toHaveLength(0);
  });

  it('runs the job and settles when the payment verifies and the job succeeds', async () => {
    const a = app();
    const unpaid = await request(a).post('/api/v1/migrate').send(REPO);
    const res = await request(a)
      .post('/api/v1/migrate')
      .set('PAYMENT-SIGNATURE', paymentFor(unpaid.headers['payment-required']))
      .send(REPO);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'pr_opened', prUrl: 'https://github.com/lina/tutor-app/pull/12' });
    expect(facilitator.verified).toHaveLength(1);
    expect(facilitator.settled).toHaveLength(1);
    const settlement = decodePaymentResponseHeader(res.headers['payment-response']);
    expect(settlement.success).toBe(true);
    expect(settlement.transaction).toMatch(/^7c1e/);
  });

  it('does not run the job when the payment fails verification', async () => {
    facilitator.verifyResult = false;
    let ran = false;
    const a = app(async (...args) => {
      ran = true;
      return okJob(...args);
    });
    const unpaid = await request(a).post('/api/v1/migrate').send(REPO);
    const res = await request(a)
      .post('/api/v1/migrate')
      .set('PAYMENT-SIGNATURE', paymentFor(unpaid.headers['payment-required']))
      .send(REPO);
    expect(res.status).toBe(402);
    expect(ran).toBe(false);
    expect(facilitator.settled).toHaveLength(0);
  });

  it('never settles when the job fails: the buyer pays nothing', async () => {
    const a = app(async () => {
      throw new Error('git clone failed');
    });
    const unpaid = await request(a).post('/api/v1/migrate').send(REPO);
    const res = await request(a)
      .post('/api/v1/migrate')
      .set('PAYMENT-SIGNATURE', paymentFor(unpaid.headers['payment-required']))
      .send(REPO);
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ status: 'failed', error: 'git clone failed' });
    expect(facilitator.verified).toHaveLength(1);
    expect(facilitator.settled).toHaveLength(0);
  });

  it('stops a job that runs past the job timeout, and does not settle', async () => {
    const a = app(
      (_input, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
      { JOB_TIMEOUT_MS: '50' }
    );
    const unpaid = await request(a).post('/api/v1/migrate').send(REPO);
    const res = await request(a)
      .post('/api/v1/migrate')
      .set('PAYMENT-SIGNATURE', paymentFor(unpaid.headers['payment-required']))
      .send(REPO);
    expect(res.status).toBe(504);
    expect(res.body).toMatchObject({ status: 'failed', error: 'job_timeout' });
    expect(facilitator.settled).toHaveLength(0);
  });

  it('keeps the job timeout well inside the signature lifetime', () => {
    // README: maxTimeoutSeconds 900, job timeout 10 minutes, at least 5 minutes left to settle.
    const c = loadConfig({ PAY_TO });
    expect(c.maxTimeoutSeconds).toBe(900);
    expect(c.jobTimeoutMs).toBe(600_000);
    expect(() => loadConfig({ PAY_TO, JOB_TIMEOUT_MS: '900000' })).toThrow(/JOB_TIMEOUT_MS/);
  });
});
