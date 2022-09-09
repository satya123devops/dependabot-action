module.exports = {
  root: true,
  extends: ['airbnb-base', 'eslint:recommended', 'plugin:prettier/recommended', 'prettier'],
  plugins: ['prettier', 'jest'],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  env: {
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['prettier', '@typescript-eslint', 'jest'],
      extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'prettier',
      ],
      rules: {
        'prettier/prettier': ['error'],
        'no-continue': ['off'],
        'no-await-in-loop': ['off'],
        // octokit/rest requires parameters that are not in camelcase
        camelcase: [
          'off',
          {
            properties: 'never',
          },
        ],
      },
      env: {
        node: true,
        jest: true,
      },
      parserOptions: {
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
    },
  ],
};
