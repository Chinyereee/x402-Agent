import express, { type Express } from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import type { FacilitatorClient } from '@x402/core/server';
import { ExactStellarScheme } from '@x402/stellar/exact/server';

import type { EngineConfig } from './config.js';

export const MIGRATE_PATH = '/api/v1/migrate';

export interface JobInput {
  repoUrl: string;
}

/**
 * Success body, as specified in the shared README. `hello` is only used by the
 * step-A hello job (JOB=hello), which takes the payment but opens no pull request.
 */
export interface JobResult {
  status: 'pr_opened' | 'hello';
  jobId: string;
  prUrl: string;
  transforms: string[];
  needsHuman: Array<{ file: string; line: number; reason: string }>;
}

/** Does the paid work. Must stop when `signal` aborts (the job timeout). */
export type RunJob = (input: JobInput, ctx: { signal: AbortSignal }) => Promise<JobResult>;

export interface AppDeps {
  config: EngineConfig;
  /** Verifies and settles payments: an HTTPFacilitatorClient in production. */
  facilitator: FacilitatorClient;
  runJob: RunJob;
}

class JobTimeoutError extends Error {
  constructor() {
    super('job_timeout');
  }
}

/** Run a job, aborting it once `ms` have passed. */
async function withTimeout(runJob: RunJob, input: JobInput, ms: number): Promise<JobResult> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // Reject first so the race reports a timeout, not the job's own abort error.
      reject(new JobTimeoutError());
      controller.abort();
    }, ms);
  });
  try {
    return await Promise.race([runJob(input, { signal: controller.signal }), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Build the Express app. Kept separate from server.ts so tests can use it without a port. */
export function createApp({ config, facilitator, runJob }: AppDeps): Express {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // x402: unpaid requests get 402 + PAYMENT-REQUIRED; paid ones are verified
  // with the facilitator before the handler runs. The middleware settles only
  // if the handler answers below 400, so a failed or timed-out job is never paid.
  const resourceServer = new x402ResourceServer(facilitator).register(
    config.network,
    new ExactStellarScheme()
  );
  app.use(
    paymentMiddleware(
      {
        [`POST ${MIGRATE_PATH}`]: {
          accepts: [
            {
              scheme: 'exact',
              price: config.price,
              network: config.network,
              payTo: config.payTo,
              maxTimeoutSeconds: config.maxTimeoutSeconds,
            },
          ],
          description: 'ethers v5 to v6 codemod, delivered as a pull request',
        },
      },
      resourceServer
    )
  );

  app.post(MIGRATE_PATH, async (req, res) => {
    try {
      const result = await withTimeout(runJob, { repoUrl: req.body?.repoUrl }, config.jobTimeoutMs);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof JobTimeoutError) {
        res.status(504).json({ status: 'failed', error: 'job_timeout' });
        return;
      }
      res.status(500).json({ status: 'failed', error: (err as Error).message });
    }
  });

  return app;
}
