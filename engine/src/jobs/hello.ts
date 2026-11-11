import { randomUUID } from 'node:crypto';
import type { RunJob } from '../app.js';

/**
 * Milestone job (13 Nov): proves one real x402 payment settles on Stellar
 * testnet. It does no work and opens no pull request, and says so.
 */
export const helloJob: RunJob = async ({ repoUrl }) => ({
  status: 'hello',
  jobId: `job_${randomUUID()}`,
  prUrl: '',
  transforms: [],
  needsHuman: [{ file: '', line: 0, reason: `hello job: payment only, no pull request for ${repoUrl}` }],
});
