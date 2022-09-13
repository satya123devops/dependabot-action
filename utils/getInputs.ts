import { getInput } from '@actions/core';

const getInputs = async (): Promise<any> => {
  const baseBranch = getInput('baseBranch', { required: true });
  const githubToken = getInput('githubToken', { required: true });

  return {
    baseBranch,
    githubToken,
  };
};

export default getInputs;
