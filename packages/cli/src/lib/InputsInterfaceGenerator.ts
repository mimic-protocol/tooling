export default {
  generate(inputs: Record<string, string>): string {
    if (Object.entries(inputs).length == 0) return ''
    const convertedInputs = convertInputs(inputs)
    const inputsMapping = generateInputsMapping(convertedInputs)
    const imports = generateImports(convertedInputs)
    return `
${imports}

export declare namespace input {
  ${inputsMapping}
}`.trim()
  },
}

function convertInputs(inputs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(inputs).map(([name, type]) => [name, convertType(type)]))
}

function generateImports(inputs: Record<string, string>): string {
  const importedTypes = Object.values(inputs).filter((e) => e === 'Address' || e === 'Bytes')
  if (importedTypes.length == 0) return ''
  return `import { ${[...importedTypes].sort().join(', ')} } from '@mimicprotocol/lib-ts'`
}

function generateInputsMapping(inputs: Record<string, string>): string {
  return Object.entries(inputs)
    .map(([name, type]) => `const ${name}: ${type}`)
    .join('\n  ')
}

function convertType(type: string): string {
  if (type.includes('uint')) type = type.replace('int', '')
  if (type.includes('int')) type = type.replace('nt', '')
  if (type.includes('address')) type = 'Address'
  if (type.includes('bytes')) type = 'Bytes'
  type = type.replace(/128|256/gm, '64')
  return type
}
