import 'dotenv/config';
import { HTTPFacilitatorClient } from '@x402/core/server';

import { createApp, type RunJob } from './app.js';
import { loadConfig } from './config.js';
import { GitHubRest } from './github.js';
import { helloJob } from './jobs/hello.js';

const config = loadConfig();
const facilitator = new HTTPFacilitatorClient({ url: config.facilitatorUrl });

const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) throw new Error('GITHUB_TOKEN is required: the free preflight reads the repo before asking for payment');
const github = new GitHubRest(githubToken);

const jobs: Record<string, RunJob> = { hello: helloJob };
const jobName = process.env.JOB ?? 'hello';
const runJob = jobs[jobName];
if (!runJob) throw new Error(`Unknown JOB "${jobName}" (available: ${Object.keys(jobs).join(', ')})`);

createApp({ config, facilitator, github, runJob }).listen(config.port, () => {
  console.log(
    `402 Found engine on http://localhost:${config.port}: ${config.price} on ${config.network}, ` +
      `paid to ${config.payTo}, facilitator ${config.facilitatorUrl}, job "${jobName}"`
  );
});
