import * as core from '@actions/core';
import * as path from 'path';
import type { GitHub } from '@actions/github/lib/utils';
import execa = require('execa');
import GitCommandExec from './git-command-exec';
import { setupRepository, verifyUpdated, createOrUpdatePR } from './repository';
import { applyPatchToFile, fileExists } from './file-utils';
import {
  DEFAULT_BASE_BRANCH,
  DEFAULT_COMBINE_BRANCH_NAME,
  DEFAULT_MUST_BE_GREEN,
  DEFAULT_BRANCH_PREFIX,
  DEFAULT_IGNORE_LABEL,
  DEFAULT_OPEN_PR,
  PR_TITLE_REGEX,
  PKG_MANAGER_REGEX,
} from './constants';

async function* getCombinablePRs(github: InstanceType<typeof GitHub>, target: Target, params: CombinablePRsParams) {
  const { branchPrefix, ignoreLabel, mustBeGreen } = params;
  const pulls = await github.paginate('GET /repos/{owner}/{repo}/pulls', target);

  // eslint-disable-next-line no-restricted-syntax
  for (const pull of pulls) {
    const { ref } = pull.head;

    if (!ref.startsWith(branchPrefix)) {
      core.warning(`${ref} does not start with ${branchPrefix}. Not combining.`);
      continue;
    }

    const apiRef = { ...target, ref };

    if (mustBeGreen) {
      const checks = await github.paginate('GET /repos/{owner}/{repo}/commits/{ref}/check-runs', apiRef);
      if (checks.some((check) => check.conclusion !== 'success')) {
        core.warning(`Checks for ${ref} are not all successful. Not combining.`);
        continue;
      }
    }

    if (ignoreLabel && pull.labels.some((label) => label.name === ignoreLabel)) {
      core.warning(`${ref} has label ${ignoreLabel}. Not combining.`);
      continue;
    }

    const titleExtraction = pull.title.match(PR_TITLE_REGEX);

    if (titleExtraction == null) {
      core.warning(`Failed to extract version bump info from commit message: ${pull.title}`);
      continue;
    }

    const { data: lastCommit } = await github.request('GET /repos/{owner}/{repo}/commits/{ref}', apiRef);

    const [shortCommitMessage, pkg, fromVersion, toVersion] = titleExtraction;
    const pkgManagerExtraction = ref.match(PKG_MANAGER_REGEX);

    if (!pkgManagerExtraction) {
      core.warning(`Failed to extract package manager from ${ref}`);
      continue;
    }

    const [, manager] = pkgManagerExtraction;

    yield {
      ref,
      number: pull.number,
      title: pull.title,
      lastCommit,
      shortCommitMessage,
      pkg,
      fromVersion,
      toVersion,
      manager,
    };
  }
}

const applyPRVersionBump = async (pr: PR, gitExec: GitCommandExec): Promise<void> => {
  const { pkg, fromVersion, toVersion, manager, lastCommit, shortCommitMessage } = pr;
  core.info(`Manually applying version bump for ${pkg} from ${fromVersion} to ${toVersion} with ${manager}.`);

  switch (manager) {
    case 'pip': {
      core.info(`Updating requirement.txt`);
      const { filename, patch } =
        lastCommit.files.find((file: CommitFile) => (file.filename as string).includes('requirements.txt')) || {};

      core.info(filename);
      core.info(patch);

      if (!filename || !patch) {
        throw new Error(`Change not found for requirements.txt for ${pkg}.`);
      }
      await applyPatchToFile({ filename, patch });
      break;
    }
    case 'npm_and_yarn': {
      const { filename, patch } =
        lastCommit.files.find((file: CommitFile) => (file.filename as string).includes('package.json')) || {};

      if (!filename || !patch) {
        throw new Error(`Change not found for package.json for ${pkg}.`);
      }

      await applyPatchToFile({ filename, patch });

      const dirname = path.dirname(filename);

      if (await fileExists(path.join(dirname, 'package-lock.json'))) {
        core.info(`Updating package-lock.json`);
        await execa('npm', ['install'], {
          cwd: dirname,
        });
        await verifyUpdated('package-lock.json', gitExec);
      } else if (await fileExists(path.join(dirname, 'yarn.lock'))) {
        core.info(`Updating yarn.lock`);
        await execa('yarn', {
          cwd: dirname,
        });
        await verifyUpdated('yarn.lock', gitExec);
      }
      break;
    }
    default: {
      throw new Error(`Cannot manually apply update for package manager ${manager}.`);
    }
  }

  await execa('git', ['add', '.']);

  const authorName = lastCommit.commit.author.name || 'github-actions';
  const authorEmail = lastCommit.commit.author.email || 'github-actions@github.com';
  await execa('git', ['commit', '--author', `${authorName} <${authorEmail}>`, '-m', shortCommitMessage]);
};

const cherryPickPR = async (pr: PR, gitExec: GitCommandExec): Promise<string> => {
  const { pkg, fromVersion, toVersion, lastCommit } = pr;
  core.info(`Cherry-picking ${pkg} from ${fromVersion} to ${toVersion}.`);
  try {
    const results = await gitExec.cherryPick(lastCommit.sha);
    return results;
  } catch (err) {
    await execa('git', ['cherry-pick', '--abort'], {
      stdout: 'ignore',
      reject: false,
    });

    throw err;
  }
};

const combinePRs = async (
  github: InstanceType<typeof GitHub>,
  target: Target,
  params: CombinePullsParams,
): Promise<void> => {
  const {
    baseBranch = DEFAULT_BASE_BRANCH,
    combineBranchName = DEFAULT_COMBINE_BRANCH_NAME,
    mustBeGreen = DEFAULT_MUST_BE_GREEN,
    branchPrefix = DEFAULT_BRANCH_PREFIX,
    ignoreLabel = DEFAULT_IGNORE_LABEL,
    openPR = DEFAULT_OPEN_PR,
  } = params;
  const bumpOutput: BumpSummary = {
    prString: '',
    error: '',
  };
  const gitExec: GitCommandExec = new GitCommandExec();

  core.info(`Setting up repository for committing.`);
  await setupRepository(baseBranch, combineBranchName, gitExec);
  core.info(`Combining PRs in repo ${target.owner}/${target.repo}.`);

  const combinablePRs = getCombinablePRs(github, target, { branchPrefix, ignoreLabel, mustBeGreen });

  // eslint-disable-next-line no-restricted-syntax
  for await (const pr of combinablePRs) {
    await core.group(`Updating ${pr.pkg} from ${pr.fromVersion} to ${pr.toVersion}.`, async () => {
      try {
        try {
          await cherryPickPR(pr, gitExec);
        } catch (err) {
          if (!(err as Error).message.includes('CONFLICT')) {
            throw err;
          }

          core.warning(`Cherry-pick for ${pr.pkg} failed due to conflict.`);
          await applyPRVersionBump(pr, gitExec);
        }

        core.info(`Successfully updated ${pr.pkg} from ${pr.fromVersion} to ${pr.toVersion}.`);
        bumpOutput.prString += `* #${pr.number} ${pr.title}\n`;
      } catch (err) {
        const errorMessage = `Failed to apply "${pr.title}" due to error:\n\n${(err as Error).message || err}`;
        bumpOutput.error += errorMessage;
        core.error(errorMessage);
      }
    });
  }

  const results = await execa('git', ['push', 'origin', combineBranchName]);
  if (results.stderr.includes('Everything up-to-date')) {
    return;
  }

  const prParams = { openPR, combineBranchName, baseBranch };

  await createOrUpdatePR(github, target, prParams, bumpOutput.prString);
};

export { combinePRs, applyPRVersionBump, cherryPickPR };
