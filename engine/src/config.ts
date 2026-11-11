/** Engine settings, read from the environment (see .env.example). */
export interface EngineConfig {
  port: number;
  /** Stellar address (G...) that receives payments */
  payTo: string;
  facilitatorUrl: string;
  /** x402 network id (CAIP-2) */
  network: 'stellar:testnet' | 'stellar:pubnet';
  /** Price per migration, e.g. "$0.05" (USDC, 7 decimals on Stellar) */
  price: string;
  /**
   * How long the buyer's signed authorization stays valid. On Stellar the auth
   * entry expires at currentLedger + maxTimeoutSeconds / ledger time, and we
   * settle only after the job, so this must outlast the job (see README).
   */
  maxTimeoutSeconds: number;
  /** Hard limit on one job; the job is stopped and nothing is settled after it. */
  jobTimeoutMs: number;
  /** Largest repository the engine accepts, in KB as GitHub reports it */
  maxRepoKb: number;
}

/** Time we always keep between the end of a job and the signature expiring. */
export const MIN_SETTLE_MARGIN_SECONDS = 300;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EngineConfig {
  const payTo = env.PAY_TO ?? '';
  if (!/^G[A-Z2-7]{55}$/.test(payTo)) {
    throw new Error('PAY_TO must be a Stellar public key (G..., 56 characters)');
  }

  const network = env.NETWORK ?? 'stellar:testnet';
  if (network !== 'stellar:testnet' && network !== 'stellar:pubnet') {
    throw new Error('NETWORK must be stellar:testnet or stellar:pubnet');
  }

  const maxTimeoutSeconds = Number(env.MAX_TIMEOUT_SECONDS ?? 900);
  const jobTimeoutMs = Number(env.JOB_TIMEOUT_MS ?? 600_000);
  if (!(jobTimeoutMs > 0) || jobTimeoutMs > (maxTimeoutSeconds - MIN_SETTLE_MARGIN_SECONDS) * 1000) {
    throw new Error(
      `JOB_TIMEOUT_MS must leave at least ${MIN_SETTLE_MARGIN_SECONDS}s of the ${maxTimeoutSeconds}s ` +
        'signature lifetime to settle in'
    );
  }

  return {
    port: Number(env.PORT ?? 4021),
    payTo,
    facilitatorUrl: env.FACILITATOR_URL ?? 'https://www.x402.org/facilitator',
    network,
    price: env.PRICE ?? '$0.05',
    maxTimeoutSeconds,
    jobTimeoutMs,
    maxRepoKb: Number(env.MAX_REPO_KB ?? 50_000),
  };
}
