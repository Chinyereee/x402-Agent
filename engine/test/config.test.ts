import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { PAY_TO } from './helpers.js';

describe('loadConfig', () => {
  it('refuses to start without a valid PAY_TO address', () => {
    expect(() => loadConfig({})).toThrow(/PAY_TO/);
    expect(() => loadConfig({ PAY_TO: 'not-an-address' })).toThrow(/PAY_TO/);
  });

  it('defaults: Coinbase testnet facilitator, $0.05 on stellar:testnet, port 4021', () => {
    const c = loadConfig({ PAY_TO });
    expect(c.facilitatorUrl).toBe('https://www.x402.org/facilitator');
    expect(c.price).toBe('$0.05');
    expect(c.network).toBe('stellar:testnet');
    expect(c.port).toBe(4021);
  });
});
