import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { FakeFacilitator, FakeGitHub, PAY_TO } from './helpers.js';

describe('GET / – the shop front', () => {
  const app = () =>
    createApp({
      config: loadConfig({ PAY_TO }),
      facilitator: new FakeFacilitator(),
      github: new FakeGitHub(),
      runJob: async () => {
        throw new Error('no job on the front page');
      },
    });

  it('is free and says what it sells, the price and where to ask', async () => {
    const res = await request(app()).get('/');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('Upgrade ethers v5 to v6');
    expect(res.text).toContain('$0.05');
    expect(res.text).toContain('/api/v1/migrate');
  });

  it('serves its picture', async () => {
    const res = await request(app()).get('/assets/shop.webp');
    expect(res.status).toBe(200);
  });
});
