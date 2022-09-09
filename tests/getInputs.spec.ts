import getInputs from '../utils/getInputs';

describe('getInputs', () => {
  const params: CombinePullsParams = {
    branchPrefix: 'dependabot',
    mustBeGreen: true,
    openPR: true,
    combineBranchName: 'combined-prs',
    ignoreLabel: 'nocombine',
    baseBranch: 'main',
    githubToken: 'gh_254hgbthgtkjghtjritriotrjotijtoitjqp',
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.INPUT_BRANCHPREFIX = 'dependabot';
    process.env.INPUT_MUSTBEGREEN = 'true';
    process.env.INPUT_OPENPR = 'true';
    process.env.INPUT_COMBINEBRANCHNAME = 'combined-prs';
    process.env.INPUT_IGNORELABEL = 'nocombine';
    process.env.INPUT_BASEBRANCH = 'main';
    process.env.INPUT_GITHUBTOKEN = 'gh_254hgbthgtkjghtjritriotrjotijtoitjqp';
  });

  afterEach(() => {
    process.env.INPUT_BRANCHPREFIX = '';
    process.env.INPUT_MUSTBEGREEN = '';
    process.env.INPUT_OPENPR = '';
    process.env.INPUT_COMBINEBRANCHNAME = '';
    process.env.INPUT_IGNORELABEL = '';
    process.env.INPUT_BASEBRANCH = '';
    process.env.INPUT_GITHUBTOKEN = '';
  });

  it('should work for all input', async () => {
    const obj = { ...params };
    const userInputs = await getInputs();
    expect(userInputs).toStrictEqual(obj);
  });
});
