import { describe, expect, it } from 'vitest';
import type { PaymentRequirements } from '@x402/core/types';
import { chooseRequirement } from '../scripts/guard.js';
import { PAY_TO } from './helpers.js';

const USDC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';
const req = (over: Partial<PaymentRequirements> = {}): PaymentRequirements => ({
  scheme: 'exact',
  network: 'stellar:testnet',
  asset: USDC,
  amount: '500000',
  payTo: PAY_TO,
  maxTimeoutSeconds: 900,
  extra: {},
  ...over,
});

describe('chooseRequirement – the test payer signs only what it expects', () => {
  const policy = { network: 'stellar:testnet', asset: USDC, maxAmount: 500000n, payTo: PAY_TO };

  it('accepts 0.05 USDC on testnet to the expected address', () => {
    expect(chooseRequirement([req()], policy)).toEqual(req());
  });

  it('refuses anything over the cap', () => {
    expect(() => chooseRequirement([req({ amount: '500001' })], policy)).toThrow(/cap/);
  });

  it('refuses another network, asset or pay-to address', () => {
    expect(() => chooseRequirement([req({ network: 'stellar:pubnet' })], policy)).toThrow(/no acceptable/);
    expect(() => chooseRequirement([req({ asset: 'CXXXX' })], policy)).toThrow(/no acceptable/);
    expect(() => chooseRequirement([req({ payTo: 'GOTHER' })], policy)).toThrow(/no acceptable/);
  });

  it('picks the acceptable option when several are offered', () => {
    const good = req();
    expect(chooseRequirement([req({ network: 'stellar:pubnet' }), good], policy)).toEqual(good);
  });

  it('without an expected payTo, accepts any address (but still checks cap, network, asset)', () => {
    const { payTo: _, ...open } = policy;
    expect(chooseRequirement([req({ payTo: 'GANYONE' })], open).payTo).toBe('GANYONE');
  });
});
