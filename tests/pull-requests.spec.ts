import * as github from '@actions/github';
import * as core from '@actions/core';
import execa = require('execa');
import { combinePRs, applyPRVersionBump, cherryPickPR } from '../utils/pull-requests';
import GitCommandExec from '../utils/git-command-exec';
import { newPR, pulls, commit, pipcommit, checks } from './data';
import * as fileUtils from '../utils/file-utils';
import * as repository from '../utils/repository';

jest.mock('execa', () =>
  jest.fn().mockResolvedValue({
    command: 'git push origin combined-dependabot-prs',
    escapedCommand: 'git push origin combined-dependabot-prs',
    exitCode: 0,
    stdout: '',
    stderr: '',
    failed: false,
    timedOut: false,
    isCanceled: false,
    killed: false,
  }),
);

/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('@actions/github', () => ({
  getOctokit: () => ({
    rest: {
      pulls: {
        list: jest.fn().mockResolvedValue({
          data: pulls,
        }),
        create: jest.fn().mockResolvedValue({
          data: newPR,
        }),
        update: jest.fn().mockResolvedValue({
          data: newPR,
        }),
      },
    },
    paginate: jest.fn().mockImplementation((route: string, params: any) => {
      if (route === 'GET /repos/{owner}/{repo}/pulls' && params) {
        return Promise.resolve(pulls);
      }
      if (route === 'GET /repos/{owner}/{repo}/commits/{ref}/check-runs' && params) {
        return Promise.resolve(checks);
      }
      return Promise.resolve('');
    }),
    request: jest.fn().mockImplementation((route: string, params: any) => {
      if (route && params) {
        return Promise.resolve({ data: commit });
      }
      return Promise.resolve('');
    }),
  }),
}));

const githubClient = github.getOctokit('gh_254hgbthgtkjghtjritriotrjotijtoitjqp');
const target = {
  repo: 'Hello-World',
  owner: 'octokit',
};
const params: CombinePullsParams = {
  combineBranchName: 'new-topic',
  branchPrefix: 'dependabot',
  baseBranch: 'main',
  openPR: true,
  mustBeGreen: true,
  ignoreLabel: 'nocombine',
  githubToken: 'gh_254hgbthgtkjghtjritriotrjotijtoitjqp',
};
const baseBranch = 'dependabot/npm_and_yarn/actions/combine-dependabot-pulls/ansi-regex-5.0.1';

describe('combinePRs', () => {
  jest.spyOn(repository, 'createOrUpdatePR');
  jest.spyOn(core, 'warning');
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should create combinable PR', async () => {
    await combinePRs(githubClient, target, params);
    expect(execa).toHaveBeenCalledWith('git', ['push', 'origin', params.combineBranchName]);
    expect(repository.createOrUpdatePR).toHaveBeenCalled();
  });
  it('should not combine pr in combinable PR if branchPrefix is not dependabot', async () => {
    const prParams = { ...params };
    prParams.branchPrefix = 'some-prefix';
    await combinePRs(githubClient, target, prParams);
    expect(core.warning).toHaveBeenLastCalledWith(
      `${baseBranch} does not start with ${prParams.branchPrefix}. Not combining.`,
    );
    expect(execa).toHaveBeenCalledWith('git', ['push', 'origin', prParams.combineBranchName]);
    expect(repository.createOrUpdatePR).toHaveBeenCalled();
  });
  it('should not combine pr in combinable PR if ignoreLabel if a pr label', async () => {
    const prParams = { ...params };
    prParams.ignoreLabel = 'bug';
    await combinePRs(githubClient, target, prParams);
    expect(core.warning).toHaveBeenLastCalledWith(`${baseBranch} has label ${prParams.ignoreLabel}. Not combining.`);
    expect(execa).toHaveBeenCalledWith('git', ['push', 'origin', prParams.combineBranchName]);
    expect(repository.createOrUpdatePR).toHaveBeenCalled();
  });
  it('should not combine pr in combinable PR if a check is not successful', async () => {
    const prParams = { ...params };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(githubClient, 'paginate').mockImplementation((route: any, parameters: string | undefined) => {
      if (route.includes('GET /repos/{owner}/{repo}/commits/{ref}/check-runs') && parameters) {
        const receivedChecks = [...checks];
        receivedChecks[0] = { ...checks[0] };
        receivedChecks[0].conclusion = 'failed';
        return Promise.resolve(receivedChecks);
      }
      return Promise.resolve(pulls);
    });
    await combinePRs(githubClient, target, prParams);
    expect(core.warning).toHaveBeenLastCalledWith(`Checks for ${baseBranch} are not all successful. Not combining.`);
    expect(execa).toHaveBeenCalledWith('git', ['push', 'origin', prParams.combineBranchName]);
    expect(repository.createOrUpdatePR).toHaveBeenCalled();
  });
  it('should not combine pr in combinable PR if not appropriate dependabot title', async () => {
    const prParams = { ...params };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(githubClient, 'paginate').mockImplementation((request: any, parameters: string | undefined) => {
      if (request === 'GET /repos/{owner}/{repo}/pulls' && parameters) {
        const receivedPulls = [...pulls];
        receivedPulls[0] = { ...pulls[0] };
        receivedPulls[0].title = 'some none matching title';
        return Promise.resolve(receivedPulls);
      }
      return Promise.resolve(checks);
    });
    await combinePRs(githubClient, target, prParams);
    expect(core.warning).toHaveBeenLastCalledWith(
      'Failed to extract version bump info from commit message: some none matching title',
    );
    expect(execa).toHaveBeenCalledWith('git', ['push', 'origin', prParams.combineBranchName]);
    expect(repository.createOrUpdatePR).toHaveBeenCalled();
  });
  it('should not combine pr in combinable PR if not appropriate dependabot ref', async () => {
    const prParams = { ...params };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(githubClient, 'paginate').mockImplementation((request: any, parameters: string | undefined) => {
      if (request === 'GET /repos/{owner}/{repo}/pulls' && parameters) {
        const receivedPulls = [...pulls];
        receivedPulls[0] = { ...pulls[0] };
        receivedPulls[0].head.ref = 'dependabot';
        return Promise.resolve(receivedPulls);
      }
      return Promise.resolve(checks);
    });
    await combinePRs(githubClient, target, prParams);
    expect(core.warning).toHaveBeenLastCalledWith('Failed to extract package manager from dependabot');
    expect(execa).toHaveBeenCalledWith('git', ['push', 'origin', prParams.combineBranchName]);
    expect(repository.createOrUpdatePR).toHaveBeenCalled();
  });
  //   it('should throw cherry-pick error', async () => {
  //     const prParams = { ...params };
  // jest.spyOn(gitExec, 'cherryPick').mockRejectedValueOnce(new Error('error: cherry pick failed.'));
  //     await combinePRs(githubClient, target, prParams);
  //     expect(core.warning).toHaveBeenLastCalledWith('Failed to extract package manager from dependabot');
  //     expect(execa).toHaveBeenCalledWith('git', ['push', 'origin', prParams.combineBranchName]);
  //     expect(repository.createOrUpdatePR).toHaveBeenCalled();
  //   });
});

describe('cherryPickPR', () => {
  const pr: PR = {
    lastCommit: { ...commit },
    fromVersion: '5.0.0',
    toVersion: '5.0.1',
    manager: 'npm_and_yarn',
    pkg: 'ansi-regex',
    shortCommitMessage: 'Bump ansi-regex from 5.0.0 to 5.0.1',
  };
  const gitExec: GitCommandExec = new GitCommandExec();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should cherry-pick a commit', async () => {
    jest.spyOn(gitExec, 'cherryPick');
    await cherryPickPR(pr, gitExec);
    expect(gitExec.cherryPick).toHaveBeenCalledWith(pr.lastCommit.sha);
    expect(execa).toHaveBeenCalledTimes(1);
  });
  it('should abort cherry-pick due to error', async () => {
    jest.spyOn(gitExec, 'cherryPick').mockRejectedValueOnce(new Error('error: cherry pick failed.'));
    try {
      await cherryPickPR(pr, gitExec);
    } catch (error) {
      expect(gitExec.cherryPick).toHaveBeenCalledWith(pr.lastCommit.sha);
      expect(execa).toHaveBeenCalledTimes(1);
      expect((error as Error).message).toBe('error: cherry pick failed.');
    }
  });
});

describe('applyPRVersionBump', () => {
  const pr: PR = {
    lastCommit: { ...commit },
    fromVersion: '5.0.0',
    toVersion: '5.0.1',
    manager: 'npm_and_yarn',
    pkg: 'ansi-regex',
    shortCommitMessage: 'some message',
  };
  const diffResult = {
    command: 'git diff --name-only',
    escapedCommand: 'git diff --name-only',
    exitCode: 0,
    stdout: 'e173a8d0070351ba4166edec773a796dbe995f43\tpackage.json,package-lock.json,yarn.lock',
    stderr: '',
    failed: false,
    timedOut: false,
    isCanceled: false,
    killed: false,
  };
  const diffString = JSON.stringify(diffResult);
  const gitExec: GitCommandExec = new GitCommandExec();

  const prpip: PR = {
    lastCommit: { ...pipcommit },
    fromVersion: '6.0.0',
    toVersion: '6.0.1',
    manager: 'pip',
    pkg: 'ansi-regex',
    shortCommitMessage: 'some message',
  };

  const pipdiffResult = {
    command: 'git diff --name-only',
    escapedCommand: 'git diff --name-only',
    exitCode: 0,
    stdout: 'e173a8d0070351ba4166edec773a796dbe995f43\trequirements.txt',
    stderr: '',
    failed: false,
    timedOut: false,
    isCanceled: false,
    killed: false,
  };
  const pipdiffString = JSON.stringify(pipdiffResult);
  const pipgitExec: GitCommandExec = new GitCommandExec();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(gitExec, 'diff').mockResolvedValue(diffString);
    jest.spyOn(pipgitExec, 'diff').mockResolvedValue(pipdiffString);
  });
  it('should apply version bump for given PR by updating yarn.lock', async () => {
    jest.spyOn(fileUtils, 'fileExists').mockImplementation((filePath: string) => {
      if (filePath.includes('package-lock.json')) {
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    });
    await applyPRVersionBump(pr, gitExec);
    expect(execa).toHaveBeenCalled();
    expect(fileUtils.fileExists).toHaveBeenCalledWith('yarn.lock');
  });
  it('should apply version bump for given PR by updating package-lock.json', async () => {
    jest.spyOn(fileUtils, 'fileExists').mockImplementation((filePath: string) => {
      if (filePath.includes('package-lock.json')) {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    });
    await applyPRVersionBump(pr, gitExec);
    expect(execa).toHaveBeenCalled();
    expect(fileUtils.fileExists).toHaveBeenCalledWith('package-lock.json');
  });
  it('should throw error if no package.json and package manager is for node app', async () => {
    const thisPR = { ...pr };
    thisPR.lastCommit = { ...pr.lastCommit };
    thisPR.lastCommit.files[0].filename = 'file1.txt';
    try {
      await applyPRVersionBump(thisPR, gitExec);
    } catch (error) {
      expect((error as Error).message).toBe('Change not found for package.json for ansi-regex.');
      expect(execa).not.toHaveBeenCalled();
      expect(fileUtils.fileExists).not.toHaveBeenCalled();
    }
  });
  it('should throw error if wrong package manager', async () => {
    const thisPR = { ...pr };
    thisPR.manager = 'something-else';
    try {
      await applyPRVersionBump(thisPR, gitExec);
    } catch (error) {
      expect((error as Error).message).toBe('Cannot manually apply update for package manager something-else.');
      expect(execa).not.toHaveBeenCalled();
      expect(fileUtils.fileExists).not.toHaveBeenCalled();
    }
  });

  it('should apply version bump for given PR by updating requirements.txt', async () => {
    jest.spyOn(fileUtils, 'fileExists').mockImplementation((filePath: string) => {
      if (filePath.includes('requirements.txt')) {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    });

    jest.spyOn(fileUtils, 'applyPatchToFile').mockImplementation(() => {
      return Promise.resolve();
    });
    await applyPRVersionBump(prpip, pipgitExec);
    expect(execa).toHaveBeenCalled();
    expect(fileUtils.applyPatchToFile).toHaveBeenCalledWith({
      filename: 'requirements.txt',
      patch: '-29.7\n+29.8',
    });
  });

  it('should NOT apply version bump for given PR by updating requirements.txt', async () => {
    const piperror = { ...prpip };
    piperror.lastCommit.files = [];
    jest.spyOn(fileUtils, 'fileExists').mockImplementation((filePath: string) => {
      if (filePath.includes('requirement.txt')) {
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    });
    await expect(() => applyPRVersionBump(piperror, pipgitExec)).rejects.toThrow(
      'Change not found for requirements.txt for ansi-regex.',
    );
  });
});
