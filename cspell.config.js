export default {
  words: ['ksware', 'kingsware', 'pinia', 'maxlength', 'gridlist', 'hlist', 'vlist', 'daterange'],
  ignorePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '*.md',
    '*.toml',
    '.gitignore',
    'package-lock.json',
    '.mailmap',
    'docs-scraper',
    'dependenciesChange',
    'example',
    'packages/constant/CN_dict.ts',
    'packages/utils/const.ts',
  ],

  ignoreRegExpList: ['/["\']icon(-[\\w]+)+["\' ]/i'],
};
