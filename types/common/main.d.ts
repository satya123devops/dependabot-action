type CombinePullsParams = {
  branchPrefix: string;
  mustBeGreen: boolean;
  combineBranchName: string;
  ignoreLabel: string;
  baseBranch: string;
  githubToken: string;
  openPR: boolean;
};

type BumpSummary = {
  prString: string;
  error: string;
};

type Target = {
  repo: string;
  owner: string;
};

type CombinablePRsParams = {
  branchPrefix: string;
  ignoreLabel: string;
  mustBeGreen: boolean;
};

type PR = {
  pkg: string;
  fromVersion: string;
  toVersion: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastCommit: any;
  manager: string;
  shortCommitMessage: string;
};

type PRParams = {
  combineBranchName: string;
  baseBranch: string;
  openPR: boolean;
};

type CommitFile = {
  filename?: string;
  additions?: number;
  deletions?: number;
  changes?: number;
  status?: string;
  raw_url?: string;
  blob_url?: string;
  patch?: string;
  sha?: string;
  contents_url?: string;
  previous_filename?: string;
};
