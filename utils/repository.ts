import * as core from '@actions/core';
import type { GitHub } from '@actions/github/lib/utils';
import terminalLink from 'terminal-link';
import GitCommandExec from './git-command-exec';

const setupRepository = async (
  baseBranch: string,
  combineBranchName: string,
  gitExec: GitCommandExec,
): Promise<void> => {
  await gitExec.fetch();
  await gitExec.checkout(baseBranch);

  const branchExists = await gitExec.branchExists(combineBranchName);
  if (branchExists) {
    await gitExec.checkout(combineBranchName);
  } else {
    await gitExec.createBranch(combineBranchName, baseBranch);
    await gitExec.checkout(combineBranchName);
  }
};

const verifyUpdated = async (filename: string, gitExec: GitCommandExec): Promise<void> => {
  const diffString = await gitExec.diff();
  const diffResult = JSON.parse(diffString);
  if (!diffResult.stdout.includes(`${filename}`)) {
    await gitExec.reset();
    throw new Error(`Failed to update ${filename}`);
  }
};

const createOrUpdatePR = async (
  github: InstanceType<typeof GitHub>,
  target: Target,
  params: PRParams,
  prString: string,
  prTesting = false,
): Promise<void> => {
  const { openPR, combineBranchName, baseBranch } = params;
  if (openPR) {
    const body = `This PR was created by the Combine PRs action by combining the following PRs:\n\n${prString}`;
    const updateBody = `This PR was updated by the Combine PRs action by combining the following PRs:\n\n${prString}`;
    let prNumber = -1;

    const { data: prs } = await github.rest.pulls.list({
      owner: target.owner,
      repo: target.repo,
      head: `${target.owner}:${combineBranchName}`,
      base: baseBranch,
      state: 'open',
    });

    if (prs && prs.length > 0) {
      prNumber = prs[0].number;
    }

    if (prNumber > -1 && !prTesting) {
      const response = await github.rest.pulls.update({
        owner: target.owner,
        repo: target.repo,
        pull_number: prNumber,
        title: 'Updated PR for combining dependencies',
        maintainer_can_modify: true,
        body: updateBody,
      });

      core.info(terminalLink(`Successfully Updated PR`, response.data.html_url));
    } else {
      const response = await github.rest.pulls.create({
        owner: target.owner,
        repo: target.repo,
        title: 'Update combined dependencies',
        head: combineBranchName,
        maintainer_can_modify: true,
        base: baseBranch,
        body,
      });

      core.info(terminalLink(`Successfully opened PR`, response.data.html_url));
    }
  }
};

export { setupRepository, verifyUpdated, createOrUpdatePR };
