# Combine Dependabot Pull Requests

## Introduction

This module defines a GitHub action that combines dependabot pull requests in a GitHub repository into a single pull request.

## Pre-Req

You will first need to create a [Personal Access Token](https://github.com/settings/tokens) (PAT) with repo write permissions to use with this action. The PAT should be stored in a [GitHub Secret within your repository](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository). You can name this secret whatever you wish, but an example could be `COMBINE_PRS_TOKEN`.

You should use the secret with the action as described in the usage instructions below.

## Usage

Usage instructions, including exactly how to use in a workflow, are given in this example:

```YAML
name: "Combine Dependabot Pull Requests"
on:
  workflow_dispatch:
    inputs:
      targetBranch:
        description: 'Optional target branch to raise combined PR against'
        required: false

jobs:
  combine-dependabot-prs:
    runs-on: ubuntu-latest

    permissions:
      actions: write
      contents: write
      pull-requests: write

    steps:
      - name: Checkout Enterprise GitHub Repository
        uses: actions/checkout@v2
        with:
          repository: EliLillyCo/.github
          ref: refs/heads/main
          token: ${{ secrets.GITHUBREADONLY }}
          persist-credentials: false
          path: ./enterprise-workflows

      - name: Combine Dependabot Pull Requests
        uses: ./enterprise-workflows/actions/combine-dependabot-pulls
        with:
          branchPrefix: "dependabot"
          mustBeGreen: true
          combineBranchName: "combined-dependabot-prs"
          githubToken: ${{ secrets.COMBINE_PRS_TOKEN }}
          ignoreLabel: "nocombine"
          baseBranch: "main"
          openPR: true
```

Most of these are default input values that can be customized or omitted.

Your workflow will need to be **merged into your default branch (main or master)** before it can be used to combine PRs.  To run the workflow, execute the following steps from the GitHub UI for your repository:

- Go to the **Actions** tab and click the `Combine Dependabot Pull Requests` workflow.
- Click the gray **Run workflow** button, then the green **Run workflow** button to trigger a workflow run.
- When the workflow succeeds, a new PR will be opened in your repository (or existing PR updated) with the combined dependency bumps.

### Inputs

This action takes in **seven** inputs:

| Input Name        | Input Description                                      | Required      | Default Value         |
| ----------------- | ------------------------------------------------------ | ------------- |---------------------- |
| branchPrefix      | Branch prefix to use to search for PRs to combine      | True          | dependabot            |
| mustBeGreen       | Only combine green PRs (success status for all checks) | True          | true                  |
| combineBranchName | Name of the branch to combine PRs into                 | True          | combined-prs          |
| ignoreLabel       | Exclude PRs with this label                            | True          | nocombine             |
| baseBranch        | Branch to merge pull request into                      | True          | main                  |
| githubToken       | GitHub token to use to create an authenticated client  | True          | `${{ github.token }}` |
| openPR            | Open/update a PR with the branch to combine PRs into   | True          | true                  |

### Outputs

There are no specific outputs except console logs and evidence that the branch to combine PRs into was created/updated and that a pull request into the base branch was opened/updated.

## Code Checks

Code check instructions are detailed in the [TypeScript Action Template README](../typescript-action/README.md#code-checks).

## Credit

This GitHub Action was originally authored by [James DiGioia](https://github.com/mAAdhaTTah) and published in the [GitHub Actions Marketplace](https://github.com/marketplace/actions/combine-dependabot-prs). 

The following modifications were made to support our use case.

- Use the branch to combine PRs into if it already exists.
- If a PR is already opened with the branch to combine dependabot PRs into, update that PR instead of creating a new PR.
- Conversion to TypeScript from JavaScript.
- Refactoring to comply with the coding standards outlined in the Contribution guide referenced in the next section. 

## Contribution

Contributions are welcome! See the [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) for more information.
