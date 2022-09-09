import { getInput, getBooleanInput } from '@actions/core';

const getInputs = async (): Promise<CombinePullsParams> => {
  const branchPrefix = getInput('branchPrefix', { required: true });
  const mustBeGreen = getBooleanInput('mustBeGreen', { required: true });
  const combineBranchName = getInput('combineBranchName', { required: true });
  const ignoreLabel = getInput('ignoreLabel', { required: true });
  const baseBranch = getInput('baseBranch', { required: true });
  const githubToken = getInput('githubToken', { required: true });
  const openPR = getBooleanInput('openPR', { required: true });

  return {
    branchPrefix,
    mustBeGreen,
    combineBranchName,
    ignoreLabel,
    baseBranch,
    githubToken,
    openPR,
  };
};

export default getInputs;
