/**
 * Test payer: calls the engine and pays the 402 with a Stellar testnet key.
 * For the 13 Nov milestone and for testing the engine without Elodie's wallet.
 *
 *   BUYER_SECRET=S... npx tsx scripts/pay.ts https://github.com/<owner>/<repo>
 *
 * Optional: ENGINE_URL (default http://localhost:4021), EXPECT_PAY_TO (G...),
 * MAX_AMOUNT (atomic units, default 500000 = 0.05 USDC).
 *
 * Needs network access to Stellar testnet RPC (it simulates the transfer to
 * build the authorization it signs), so it cannot run in CI.
 */
import 'dotenv/config';
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from '@x402/fetch';
import { createEd25519Signer, USDC_TESTNET_ADDRESS } from '@x402/stellar';
import { ExactStellarScheme } from '@x402/stellar/exact/client';

import { chooseRequirement } from './guard.js';

const repoUrl = process.argv[2];
const secret = process.env.BUYER_SECRET;
if (!repoUrl || !secret) {
  console.error('usage: BUYER_SECRET=S... npx tsx scripts/pay.ts <github repo url>');
  process.exit(1);
}
const engineUrl = process.env.ENGINE_URL ?? 'http://localhost:4021';

const signer = createEd25519Signer(secret, 'stellar:testnet');
const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: 'stellar:testnet', client: new ExactStellarScheme(signer) }],
  paymentRequirementsSelector: (_version, options) =>
    chooseRequirement(options, {
      network: 'stellar:testnet',
      asset: USDC_TESTNET_ADDRESS,
      maxAmount: BigInt(process.env.MAX_AMOUNT ?? '500000'),
      payTo: process.env.EXPECT_PAY_TO || undefined,
    }),
});

const started = Date.now();
const res = await fetchWithPayment(`${engineUrl}/api/v1/migrate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ repoUrl }),
});
const body = await res.json().catch(() => null);
const paymentResponse = res.headers.get('PAYMENT-RESPONSE');

console.log(`HTTP ${res.status} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log(JSON.stringify(body, null, 2));
if (paymentResponse) {
  const settlement = decodePaymentResponseHeader(paymentResponse);
  console.log(`settled: ${settlement.success}, transaction ${settlement.transaction}`);
  console.log(`https://stellar.expert/explorer/testnet/tx/${settlement.transaction}`);
} else {
  console.log('no PAYMENT-RESPONSE: nothing was settled');
}
