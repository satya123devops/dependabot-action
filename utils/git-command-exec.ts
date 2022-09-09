import * as core from '@actions/core';
import execa = require('execa');

export default class GitCommandExec {
  exec = execa;

  module: string;

  constructor() {
    this.module = 'git';
  }

  async fetch(): Promise<string> {
    const res = await this.exec(this.module, ['fetch', '--all']);
    return JSON.stringify(res);
  }

  async branchExists(combineBranchName: string): Promise<boolean> {
    const branchExists = await this.exec(this.module, ['ls-remote', '--heads', 'origin', combineBranchName]);
    core.info(`branch-exists: "${JSON.stringify(branchExists)}"`);
    if (branchExists && branchExists.exitCode === 0 && branchExists.stdout.includes(combineBranchName)) {
      return true;
    }
    return false;
  }

  async checkout(thisBranch: string): Promise<string> {
    const res = await this.exec(this.module, ['checkout', thisBranch]);
    return JSON.stringify(res);
  }

  async cherryPick(sha: string): Promise<string> {
    const results = await this.exec(this.module, ['cherry-pick', sha], {
      stderr: 'ignore',
    });
    return JSON.stringify(results);
  }

  async createBranch(newBranch: string, baseBranch: string): Promise<string> {
    const res = await this.exec(this.module, ['branch', newBranch, baseBranch]);
    return JSON.stringify(res);
  }

  async diff(): Promise<string> {
    const res = await this.exec(this.module, ['diff', '--name-only']);
    const diffResult = JSON.stringify(res);
    core.info(`git-diff: ${diffResult}`);
    return diffResult;
  }

  async reset(): Promise<void> {
    await this.exec(this.module, ['reset', '--hard']);
  }
}
