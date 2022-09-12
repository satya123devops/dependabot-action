import { getInput, getBooleanInput } from '@actions/core';

const getInputs = async (): Promise<any> => {
  const branchPrefix = getInput('branchPrefix', { required: false });
  const mustBeGreen = getBooleanInput('mustBeGreen', { required: false });
  const combineBranchName = getInput('combineBranchName', { required: false });
  const ignoreLabel = getInput('ignoreLabel', { required: false });
  const baseBranch = getInput('baseBranch', { required: true });
  const githubToken = getInput('githubToken', { required: false });
  const openPR = getBooleanInput('openPR', { required: false });

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
