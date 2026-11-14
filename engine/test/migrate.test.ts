import { describe, expect, it } from 'vitest';
import type { MigrationResult } from '../../codemod/src/migrate-directory.js';
import { needsHuman, prBody } from '../src/jobs/migrate.js';

const result: MigrationResult = {
  filesScanned: 4,
  ethersFiles: 3,
  modified: ['src/math.js', 'package.json'],
  failures: [{ file: 'src/odd.js', error: 'Unexpected token' }],
  todos: [{ file: 'src/wallet.js', line: 14, text: 'TODO(ethers-codemod): getSigner() in a constructor' }],
  transformsApplied: ['rename-utils', 'bigNumber-to-bigint'],
  packageJson: { changed: true, warnings: ['dependencies: @ethersproject/abi may clash with ethers v6'] },
};

describe('migrate job output', () => {
  it('lists what the maintainer must check in the pull request', () => {
    const body = prBody(result, 'job_1', true);
    expect(body).toContain('- `src/math.js`');
    expect(body).toContain('- `package-lock.json` (regenerated)');
    expect(body).toContain('**package.json: please check**\n- dependencies: @ethersproject/abi may clash with ethers v6');
    expect(body).toContain('`src/wallet.js:14` TODO(ethers-codemod)');
    expect(body).toContain('`src/odd.js`: Unexpected token');
  });

  it('turns TODOs, failures and package.json warnings into needsHuman', () => {
    expect(needsHuman(result)).toEqual([
      { file: 'src/wallet.js', line: 14, reason: 'TODO(ethers-codemod): getSigner() in a constructor' },
      { file: 'src/odd.js', line: 0, reason: 'not migrated: Unexpected token' },
      { file: 'package.json', line: 0, reason: 'dependencies: @ethersproject/abi may clash with ethers v6' },
    ]);
  });
});
