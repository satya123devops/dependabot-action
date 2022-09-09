import { replaceInFile } from 'replace-in-file';
import { promises as fs } from 'fs';
import { EXTRACT_FROM_REGEX, EXTRACT_TO_REGEX } from './constants';

const applyPatchToFile = async (file: CommitFile): Promise<void> => {
  const [, from] = (file.patch as string).match(EXTRACT_FROM_REGEX) || [];
  const [, to] = (file.patch as string).match(EXTRACT_TO_REGEX) || [];

  if (!from || !to) {
    throw new Error(`Could not extract from or to from patch for ${file.filename}.`);
  }

  await replaceInFile({
    files: file.filename || '',
    from,
    to,
  });
};

const fileExists = (filePath: string): Promise<boolean> =>
  fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

export { fileExists, applyPatchToFile };
