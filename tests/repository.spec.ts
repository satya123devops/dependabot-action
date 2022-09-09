import * as github from '@actions/github';
import execa = require('execa');
import GitCommandExec from '../utils/git-command-exec';
import { setupRepository, verifyUpdated, createOrUpdatePR } from '../utils/repository';
import { newPR, pulls } from './data';

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
  }),
}));

jest.mock('execa', () => jest.fn());

const diffResult = {
  command: 'git diff --name-only',
  escapedCommand: 'git diff --name-only',
  exitCode: 0,
  stdout: 'e173a8d0070351ba4166edec773a796dbe995f43\tpackage.json',
  stderr: '',
  failed: false,
  timedOut: false,
  isCanceled: false,
  killed: false,
};
const diffString = JSON.stringify(diffResult);

const gitExec = new GitCommandExec();
const githubClient = github.getOctokit('some-token');

describe('setupRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should setup the repository when combined branch does not exist', async () => {
    jest.spyOn(gitExec, 'branchExists').mockResolvedValue(true);
    await setupRepository('main', 'test-combined-branch', gitExec);
    expect(execa).toHaveBeenCalledTimes(3);
  });
  it('should setup the repository when combined branch exists in the repo', async () => {
    jest.spyOn(gitExec, 'branchExists').mockResolvedValue(false);
    await setupRepository('main', 'combined-dependabot-prs', gitExec);
    expect(execa).toHaveBeenCalledTimes(4);
  });
});

describe('verifyUpdated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(gitExec, 'diff').mockResolvedValue(diffString);
  });
  it('should verify that the given file was updated', async () => {
    await verifyUpdated('package.json', gitExec);
    expect(execa).not.toHaveBeenCalled();
  });
  it('should throw error if the given file was not updated', async () => {
    try {
      await verifyUpdated('package-lock.json', gitExec);
    } catch (error) {
      expect(execa).toHaveBeenCalledTimes(1);
      expect((error as Error).message).toEqual('Failed to update package-lock.json');
    }
  });
});

describe('createOrUpdatePR', () => {
  const target = {
    repo: 'Hello-World',
    owner: 'octokit',
  };
  const params: PRParams = {
    combineBranchName: 'combine-dependabot-prs',
    baseBranch: 'main',
    openPR: true,
  };
  const prString = 'some value';
  it('should get a list of PRs', async () => {
    await createOrUpdatePR(githubClient, target, params, prString);
    expect(githubClient.rest.pulls.list).toBeCalledWith({
      owner: target.owner,
      repo: target.repo,
      head: `${target.owner}:${params.combineBranchName}`,
      base: `${params.baseBranch}`,
      state: 'open',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should update existing PR with updates and not create new PR', async () => {
    await createOrUpdatePR(githubClient, target, params, prString);
    const updateBody = `This PR was updated by the Combine PRs action by combining the following PRs:\n\n${prString}`;
    expect(githubClient.rest.pulls.update).toBeCalledWith({
      owner: target.owner,
      repo: target.repo,
      pull_number: pulls[0].number,
      title: 'Updated PR for combining dependencies',
      maintainer_can_modify: true,
      body: updateBody,
    });
    expect(githubClient.rest.pulls.create).not.toHaveBeenCalled();
  });
  it('should create a new PR with the updates', async () => {
    await createOrUpdatePR(githubClient, target, params, prString, true);
    const body = `This PR was created by the Combine PRs action by combining the following PRs:\n\n${prString}`;
    expect(githubClient.rest.pulls.create).toBeCalledWith({
      owner: target.owner,
      repo: target.repo,
      title: 'Update combined dependencies',
      head: `${params.combineBranchName}`,
      maintainer_can_modify: true,
      base: `${params.baseBranch}`,
      body,
    });
    expect(githubClient.rest.pulls.update).not.toHaveBeenCalled();
  });
});
