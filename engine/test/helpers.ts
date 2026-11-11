import type { FacilitatorClient } from '@x402/core/server';
import type { PaymentPayload, PaymentRequirements } from '@x402/core/types';
import { decodePaymentRequiredHeader, encodePaymentSignatureHeader } from '@x402/core/http';

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
