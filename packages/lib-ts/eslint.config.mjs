import eslintConfigMimic from 'eslint-config-mimic';

export default [
  ...eslintConfigMimic,
  {
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
];
