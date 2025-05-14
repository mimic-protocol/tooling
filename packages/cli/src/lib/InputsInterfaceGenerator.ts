export default {
  generate(inputs: Record<string, string>): string {
    if (Object.entries(inputs).length == 0) return ''
    const convertedInputs = convertInputs(inputs)
    const inputsMapping = generateInputsMapping(convertedInputs)
    const imports = generateImports(convertedInputs)
    const inputsClass = generateInputsClass(convertedInputs)
    return [
      imports,
      '',
      'declare namespace input {',
      `  ${inputsMapping}`,
      '}',
      '',
      '// The class name is intentionally lowercase and plural to resemble a namespace when used in a task',
      'export class inputs {',
      `  ${inputsClass}`,
      '}',
    ]
      .join('\n')
      .trim()
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
    .map(([name, type]) =>
      type === 'string' || type === 'Address' || type === 'Bytes'
        ? `var ${name}: string | null`
        : `const ${name}: ${type}`
    )
    .join('\n  ')
}

function generateInputsClass(inputs: Record<string, string>): string {
  return Object.entries(inputs)
    .map(([name, type]) => generateGetter(name, type))
    .join('\n\n  ')
}

function convertType(type: string): string {
  if (type.includes('uint')) type = type.replace('int', '')
  if (type.includes('int')) type = type.replace('nt', '')
  if (type.includes('address')) type = 'Address'
  if (type.includes('bytes')) type = 'Bytes'
  type = type.replace(/128|256/gm, '64')
  return type
}

function generateGetter(name: string, type: string): string {
  const str = `input.${name}`
  let returnStr: string

  if (type === 'string') returnStr = `${str}!`
  else if (type === 'Address') returnStr = `Address.fromString(${str}!)`
  else if (type === 'Bytes') returnStr = `Bytes.fromHexString(${str}!)`
  else returnStr = str

  return `static get ${name}(): ${type} {
    return ${returnStr}
  }`
}
