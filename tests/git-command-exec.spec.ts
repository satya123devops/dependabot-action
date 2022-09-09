import execa = require('execa');
import GitCommandExec from '../utils/git-command-exec';

/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('execa', () =>
  jest.fn().mockImplementation((args: any, options: string[]) => {
    if (options.includes('ls-remote')) {
      const result = {
        command: `${args} ${options.join(' ')}`,
        escapedCommand: `${args} ${options.join(' ')}`,
        exitCode: 0,
        stdout: `e173a8d0070351ba4166edec773a796dbe995f43\t${options[options.length - 1]}`,
        stderr: '',
        failed: false,
        timedOut: false,
        isCanceled: false,
        killed: false,
      };
      return Promise.resolve(result);
    }
    const diffResult = {
      command: `${args} ${options.join(' ')}`,
      escapedCommand: `${args} ${options.join(' ')}`,
      exitCode: 0,
      stdout: 'e173a8d0070351ba4166edec773a796dbe995f43\tpackage.json',
      stderr: '',
      failed: false,
      timedOut: false,
      isCanceled: false,
      killed: false,
    };
    return Promise.resolve(diffResult);
  }),
);

const gitExec = new GitCommandExec();

describe('GitCommandExec', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should determine whether the given branch exists in repo', async () => {
    const res = await gitExec.branchExists('test-branch');
    expect(execa).toHaveBeenCalled();
    expect(res).toBe(true);
  });
  it('should determine whether package.json has been changed', async () => {
    const res = await gitExec.diff();
    expect(execa).toHaveBeenCalled();
    expect(res).toContain('package.json');
  });
});
