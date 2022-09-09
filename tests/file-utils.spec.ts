import * as path from 'path';
import { replaceInFile } from 'replace-in-file';
import { fileExists, applyPatchToFile } from '../utils/file-utils';

jest.mock('replace-in-file');

describe('fileExists', () => {
  const dirname = __dirname;
  it('should return true when given file exists', async () => {
    const fileName = 'file-utils.spec.ts';
    const exists = await fileExists(path.join(dirname, fileName));
    expect(exists).toBe(true);
  });
  it('should return false when given file does not exists', async () => {
    const fileName = 'aFileUtilsSpec.ts';
    const exists = await fileExists(path.join(dirname, fileName));
    expect(exists).toBe(false);
  });
});

describe('applyPatchToFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should apply patch to file', async () => {
    // Sample files property from response of Get a commit according to
    // https://docs.github.com/en/rest/reference/repos#get-a-commit
    const changedFile = {
      filename: 'file1.txt',
      patch: '-1.29.7\n+1.29.8',
    };
    await applyPatchToFile(changedFile);
    expect(replaceInFile).toHaveBeenCalledWith({ files: 'file1.txt', from: '1.29.7', to: '1.29.8' });
  });
  it('should apply patch to nameless file', async () => {
    const changedFile = {
      filename: '',
      patch: '-1.29.7\n+1.29.8',
    };
    await applyPatchToFile(changedFile);
    expect(replaceInFile).toHaveBeenCalledWith({ files: '', from: '1.29.7', to: '1.29.8' });
  });
  it('should not apply patch to file, but report error', async () => {
    const changedFile = {
      filename: 'file1.txt',
      patch: '@@ -29,7 +29,7 @@\n.....',
    };
    try {
      await applyPatchToFile(changedFile);
    } catch (error) {
      expect((error as Error).message).toStrictEqual('Could not extract from or to from patch for file1.txt.');
      expect(replaceInFile).not.toHaveBeenCalledWith({ files: 'file1.txt', from: '1.29.7', to: '1.29.8' });
    }
  });
});
