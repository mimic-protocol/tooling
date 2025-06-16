import type { AbiParameter } from '../../types'

export enum NameContext {
  FUNCTION_PARAMETER = 'function_parameter',
  LOCAL_VARIABLE = 'local_variable',
  CLASS_PROPERTY = 'class_property',
}

export default class NameManager {
  private static readonly RESERVED_BY_CONTEXT = {
    [NameContext.FUNCTION_PARAMETER]: new Set([
      'response',
      'decodedResponse',
      'selector',
      'callArgs',
      'contractCallCode',
      'inputs',
      'methodParams',
      'returnType',
      'lines',
    ]),
    [NameContext.LOCAL_VARIABLE]: new Set(['data', 'parts', 'response', 'decodedResponse', 'selector']),
    [NameContext.CLASS_PROPERTY]: new Set([
      'constructor',
      'parse',
      'toEvmEncodeParams',
      'address',
      'chainId',
      'timestamp',
    ]),
  }

  private static readonly INTERNAL_NAME_PATTERNS = [/^item\d+$/, /^s\d+$/]

  public static resolveNameConflicts(names: string[], context: NameContext): string[] {
    const usedNames = new Set<string>()

    return names.map((originalName) => {
      let escapedName = this.escapeName(originalName, context)

      let counter = 1
      while (usedNames.has(escapedName)) {
        const suffix = this.getSuffixForContext(context)
        escapedName = `${originalName}${suffix}${counter}`
        counter++
      }

      usedNames.add(escapedName)
      return escapedName
    })
  }

  public static resolveParameterNames(
    parameters: AbiParameter[],
    context: NameContext,
    defaultPrefix: string = 'param'
  ): AbiParameter[] {
    const originalNames = parameters.map((param, index) =>
      param.name && param.name.length > 0 ? param.name : `${defaultPrefix}${index}`
    )
    const resolvedNames = this.resolveNameConflicts(originalNames, context)
    return parameters.map((param, index) => ({
      ...param,
      escapedName: resolvedNames[index],
    }))
  }

  private static hasConflict(name: string, context: NameContext): boolean {
    if (this.RESERVED_BY_CONTEXT[context]?.has(name)) return true

    return this.INTERNAL_NAME_PATTERNS.some((pattern) => pattern.test(name))
  }

  private static escapeName(name: string, context: NameContext): string {
    if (!this.hasConflict(name, context)) return name

    const suffix = this.getSuffixForContext(context)
    let escapedName = `${name}${suffix}`

    let counter = 1
    while (this.hasConflict(escapedName, context)) {
      escapedName = `${name}${suffix}${counter}`
      counter++
    }

    return escapedName
  }

  private static getSuffixForContext(context: NameContext): string {
    switch (context) {
      case NameContext.FUNCTION_PARAMETER:
        return '_param'
      case NameContext.LOCAL_VARIABLE:
        return '_var'
      case NameContext.CLASS_PROPERTY:
        return '_prop'
      default:
        return '_safe'
    }
  }
}
