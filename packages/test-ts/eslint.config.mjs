import eslintConfigMimic from 'eslint-config-mimic'

// Remove rules
delete eslintConfigMimic[1].plugins.react
Object.keys(eslintConfigMimic[1].rules)
  .filter(rule => rule.includes('react') || rule.includes("no-namespace"))
  .forEach(rule => delete eslintConfigMimic[1].rules[rule])

export default eslintConfigMimic