import type { FacilitatorClient } from '@x402/core/server';
import type { PaymentPayload, PaymentRequirements } from '@x402/core/types';
import { decodePaymentRequiredHeader, encodePaymentSignatureHeader } from '@x402/core/http';
import type { GitHubApi, RepoInfo } from '../src/preflight.js';

export const PAY_TO = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';
export const PAYER = 'GBUYERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

/**
 * A facilitator that never touches the network: it accepts any payment and
 * records what it was asked to verify and settle.
 */
export class FakeFacilitator implements FacilitatorClient {
  verified: PaymentPayload[] = [];
  settled: PaymentPayload[] = [];
  verifyResult = true;
  settleResult = true;

  async verify(payload: PaymentPayload, _req: PaymentRequirements) {
    this.verified.push(payload);
    return this.verifyResult
      ? { isValid: true, payer: PAYER }
      : { isValid: false, invalidReason: 'invalid_signature', payer: PAYER };
  }

  async settle(payload: PaymentPayload, req: PaymentRequirements) {
    this.settled.push(payload);
    return this.settleResult
      ? { success: true, transaction: '7c1e' + 'f04a'.repeat(15), network: req.network, payer: PAYER }
      : { success: false, errorReason: 'settle_failed', transaction: '', network: req.network };
  }

  async getSupported() {
    return {
      kinds: [{ x402Version: 2, scheme: 'exact', network: 'stellar:testnet' as const }],
      extensions: [],
      signers: {},
    };
  }
}

/** Build the PAYMENT-SIGNATURE header a buyer would send, from the engine's 402 response. */
export function paymentFor(paymentRequiredHeader: string): string {
  const required = decodePaymentRequiredHeader(paymentRequiredHeader);
  const payload: PaymentPayload = {
    x402Version: required.x402Version,
    resource: required.resource,
    accepted: required.accepts[0],
    // On Stellar this carries the signed Soroban auth entry; the fake facilitator ignores it.
    payload: { transaction: 'AAAA-signed-auth-entry' },
  };
  return encodePaymentSignatureHeader(payload);
}

/** GitHub as seen by the engine's token: a map of repos and their files. */
export class FakeGitHub implements GitHubApi {
  repos = new Map<string, RepoInfo & { files: Record<string, string> }>();
  calls = 0;

  add(fullName: string, files: Record<string, string>, over: Partial<RepoInfo> = {}) {
    this.repos.set(fullName.toLowerCase(), {
      fullName,
      defaultBranch: 'main',
      sizeKb: 120,
      canPush: true,
      files,
      ...over,
    });
  }

  async getRepo(owner: string, repo: string) {
    this.calls++;
    const r = this.repos.get(`${owner}/${repo}`.toLowerCase());
    return r ? { fullName: r.fullName, defaultBranch: r.defaultBranch, sizeKb: r.sizeKb, canPush: r.canPush } : null;
  }

  async listFiles(owner: string, repo: string) {
    return Object.keys(this.repos.get(`${owner}/${repo}`.toLowerCase())!.files);
  }

  async readFile(owner: string, repo: string, path: string) {
    return this.repos.get(`${owner}/${repo}`.toLowerCase())!.files[path] ?? null;
  }
}

