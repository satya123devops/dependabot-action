/* eslint-disable no-useless-escape */
const DEFAULT_BASE_BRANCH = 'main';
const DEFAULT_COMBINE_BRANCH_NAME = 'combine-prs';
const DEFAULT_MUST_BE_GREEN = true;
const DEFAULT_BRANCH_PREFIX = 'dependabot';
const DEFAULT_IGNORE_LABEL = 'nocombine';
const DEFAULT_OPEN_PR = true;
const EXTRACT_FROM_REGEX = /^\-(.*)$/m;
const EXTRACT_TO_REGEX = /^\+(.*)$/m;
const PKG_MANAGER_REGEX = /dependabot\/([\w-]+)/;
const PR_TITLE_REGEX = /bump ([\w-@\/]+) from ([\w\.-]+) to ([\w\.-]+)/i;

export {
  DEFAULT_BASE_BRANCH,
  DEFAULT_COMBINE_BRANCH_NAME,
  DEFAULT_MUST_BE_GREEN,
  DEFAULT_BRANCH_PREFIX,
  DEFAULT_IGNORE_LABEL,
  DEFAULT_OPEN_PR,
  EXTRACT_FROM_REGEX,
  EXTRACT_TO_REGEX,
  PKG_MANAGER_REGEX,
  PR_TITLE_REGEX,
};
