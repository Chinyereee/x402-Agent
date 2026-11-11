import type { PaymentRequirements } from '@x402/core/types';

export interface PayPolicy {
  /** CAIP-2 network we are willing to pay on, e.g. stellar:testnet */
  network: string;
  /** Token contract we are willing to pay in (testnet USDC) */
  asset: string;
  /** Most we will sign for one request, in atomic units (0.05 USDC = 500000) */
  maxAmount: bigint;
  /** If set, the only address we will pay */
  payTo?: string;
}

/**
 * Pick the payment option to sign, or throw. This is the test payer's only
 * safety check; Elodie's wallet applies the owner's full rules instead.
 */
export function chooseRequirement(options: PaymentRequirements[], policy: PayPolicy): PaymentRequirements {
  const acceptable = options.filter(
    (o) =>
      o.network === policy.network &&
      o.asset === policy.asset &&
      (policy.payTo === undefined || o.payTo === policy.payTo)
  );
  if (acceptable.length === 0) {
    throw new Error(
      `no acceptable payment option: want ${policy.network} / ${policy.asset}` +
        (policy.payTo ? ` / pay to ${policy.payTo}` : '')
    );
  }
  const cheapest = acceptable.reduce((a, b) => (BigInt(b.amount) < BigInt(a.amount) ? b : a));
  if (BigInt(cheapest.amount) > policy.maxAmount) {
    throw new Error(`asked for ${cheapest.amount}, over the cap of ${policy.maxAmount}`);
  }
  return cheapest;
}
