const repoPRFetch = async (): Promise<string> => {
    const orgName = process.env.GITHUB_REPOSITORY_ORG_NAME;
    const repoName = process.env.GITHUB_REPOSITORY_REPO_NAME;
    //const repoPRFetchURL = `https://api.github.com/repos/${orgName}/${repoName}/pulls?state=all`;
    const repoPRFetchURL = `https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After/pulls?state=all`;
    return repoPRFetchURL;
  };
  
  export default repoPRFetch;
  