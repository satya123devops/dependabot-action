import { getInput } from '@actions/core';

const getInputs = async (): Promise<any> => {
  const baseBranch = getInput('baseBranch', { required: true });
  const githubToken = getInput('githubToken', { required: true });
  const manifestFileName = getInput('manifestFileName', { required: true });

  return {
    baseBranch,
    githubToken,
    manifestFileName
  };
};

export default getInputs;
