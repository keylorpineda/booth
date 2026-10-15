/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'api',
        'web',
        'shared',
        'db',
        'auth',
        'catalog',
        'orders',
        'storefront',
        'dashboard',
        'i18n',
        'ui',
        'deps',
        'deps-dev',
        'ci',
        'repo',
        'release',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'body-max-line-length': [1, 'always', 100],
  },
};
