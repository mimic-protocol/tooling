import eslintConfigMimic from 'eslint-config-mimic'

// Remove react rules
delete eslintConfigMimic[1].plugins.react
Object.keys(eslintConfigMimic[1].rules)
  .filter(rule => rule.includes('react'))
  .forEach(rule => delete eslintConfigMimic[1].rules[rule])

export default [
  ...eslintConfigMimic,
  {
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
];
