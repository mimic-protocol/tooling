import eslintConfigMimic from 'eslint-config-mimic'

// IGNORE bin folder
eslintConfigMimic[0].ignores.push('bin/**')

// Remove react rules
delete eslintConfigMimic[1].plugins.react
Object.keys(eslintConfigMimic[1].rules)
  .filter(rule => rule.includes("react"))
  .forEach(rule => delete eslintConfigMimic[1].rules[rule])

export default eslintConfigMimic