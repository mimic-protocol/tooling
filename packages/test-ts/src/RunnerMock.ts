import { z } from '@mimicprotocol/sdk'
import * as fs from 'fs'
import { join } from 'path'

import { MockConfig, MockResponseValue, ParameterizedResponse } from './types'
import { MockConfigValidator, ParameterizedResponseValidator } from './validators'

const LITTLE_ENDIAN = true

export default class RunnerMock {
  private instance: WebAssembly.Instance
  private mockFolder: string
  private ENV_IMPORTS = {
    abort: (msgPtr: number, filePtr: number, line: number, col: number) => {
      const msg = this.getStringFromMemory(msgPtr)
      const file = this.getStringFromMemory(filePtr)
      throw Error(`${msg} in ${file} (line ${line}, column ${col})`)
    },
  }
  private LOG_IMPORTS = {
    _log: (level: number, msgPtr: number) => {
      const msg = this.getStringFromMemory(msgPtr)
      switch (level) {
        case 0:
          throw new Error(`[CRITICAL] ${msg}`)
        case 1:
          console.error(`[ERROR] ${msg}`)
          break
        case 2:
          console.warn(`[WARNING] ${msg}`)
          break
        case 3:
          console.info(`[INFO] ${msg}`)
          break
        case 4:
          console.debug(`[DEBUG] ${msg}`)
          break
        default:
          throw new Error(`Invalid log level: ${level}`)
      }
    },
  }

  constructor(taskFolder: string, mockFolder?: string) {
    this.mockFolder = mockFolder || join(taskFolder, '..')
    this.instance = this.initializeWasmInstance(taskFolder)
  }

  private initializeWasmInstance(taskFolder: string): WebAssembly.Instance {
    try {
      const taskPath = join(taskFolder, 'task.wasm')

      let { inputs, ...mock } = this.readJsonFile<MockConfig>(join(this.mockFolder, 'mock.json'), MockConfigValidator)
      inputs = inputs || {}
      for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'object' && value !== null) {
          inputs[key] = JSON.stringify(value)
        }
      }
      const imports = this.generateImports(mock, inputs as WebAssembly.ModuleImports)

      const wasmBuffer = fs.readFileSync(taskPath)
      const wasmModule = new WebAssembly.Module(wasmBuffer as never)
      const instance = new WebAssembly.Instance(wasmModule, imports)

      this.patchStringInputs(inputs as WebAssembly.ModuleImports, imports, instance)

      return instance
    } catch (error) {
      throw new Error(`Failed to initialize WASM instance: ${error}`)
    }
  }

  private readJsonFile<T>(filePath: string, validator?: z.ZodType<T>): T {
    try {
      const rawData = fs.readFileSync(filePath, 'utf8')
      const parsedData = JSON.parse(rawData)

      if (validator) {
        const result = validator.safeParse(parsedData)

        if (!result.success) {
          const formattedError = result.error.format()
          throw new Error(`Invalid JSON data in ${filePath}: ${JSON.stringify(formattedError, null, 2)}`)
        }

        return result.data
      }

      return parsedData as T
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`)
      }
      throw new Error(`Failed to read or validate JSON file ${filePath}: ${error}`)
    }
  }

  run(fnName = 'main'): void {
    try {
      const fn = this.instance.exports[fnName]
      if (typeof fn === 'function') {
        fn()
      } else {
        const availableExports = Object.keys(this.instance.exports).join(', ')
        throw Error(`No "${fnName}" found in exports. Available exports: ${availableExports}`)
      }
    } catch (error) {
      throw Error(`Task Execution Error - ${error}`)
    }
  }

  private createLogFn(call: string) {
    return (ptr: number) => {
      const params = this.getStringFromMemory(ptr)
      this.logToFile(call, params)
    }
  }

  private logToFile(call: string, params: string) {
    const logFile = join(this.mockFolder, 'test.log')
    fs.appendFileSync(logFile, `${call}: ${params}\n`)
  }

  private generateImports(mock: MockConfig, inputs: WebAssembly.ModuleImports): WebAssembly.Imports {
    const importModules: Record<string, WebAssembly.ModuleImports> = {}

    const variableImports: WebAssembly.ModuleImports = {}
    for (const moduleName of ['environment', 'evm', 'svm'] as const) {
      const moduleMocks = mock[moduleName] ?? {}
      const moduleImports: WebAssembly.ModuleImports = this.getDefaultModuleImports(moduleName)

      for (const [functionName, mockValue] of Object.entries(moduleMocks)) {
        moduleImports[functionName] = this.createMockFunction(functionName, mockValue)
      }

      importModules[moduleName] = moduleImports
    }

    for (const [key, value] of Object.entries(inputs)) {
      variableImports[`input.${key}`] =
        typeof value === 'string' ? new WebAssembly.Global({ value: 'i32', mutable: true }, 0) : value
    }

    return {
      ...importModules,
      env: this.ENV_IMPORTS,
      log: this.LOG_IMPORTS,
      index: variableImports,
    }
  }

  private getDefaultModuleImports(moduleName: string): WebAssembly.ModuleImports {
    if (moduleName === 'evm') return this.getDefaultEvmImports()
    if (moduleName === 'svm') return this.getDefaultSvmImports()
    if (moduleName === 'environment') return this.getDefaultEnvImports()
    return {}
  }

  private getDefaultEnvImports(): WebAssembly.ModuleImports {
    return {
      _evmCall: this.createLogFn('_evmCall'),
      _svmCall: this.createLogFn('_svmCall'),
      _swap: this.createLogFn('_swap'),
      _transfer: this.createLogFn('_transfer'),
      _tokenPriceQuery: this.createMockFunction('_tokenPriceQuery', { default: '' }),
      _relevantTokensQuery: this.createMockFunction('_relevantTokensQuery', { default: '' }),
      _evmCallQuery: this.createMockFunction('_evmCallQuery', { default: '' }),
      _svmAccountsInfoQuery: this.createMockFunction('_svmAccountsInfoQuery', { default: '' }),
      _getContext: this.createMockFunction('_getContext', { default: '' }),
    }
  }

  private getDefaultEvmImports(): WebAssembly.ModuleImports {
    return {
      _encode: this.createMockFunction('_encode', { default: '0x' }),
      _decode: this.createMockFunction('_decode', { default: '0x' }),
      _keccak: this.createMockFunction('_keccak', { default: '0xabcd' }),
    }
  }

  private getDefaultSvmImports(): WebAssembly.ModuleImports {
    return {
      _findProgramAddress: this.createMockFunction('_findProgramAddress', { default: '' }),
    }
  }

  private patchStringInputs(
    inputs: WebAssembly.ModuleImports,
    imports: WebAssembly.Imports,
    instance: WebAssembly.Instance
  ): void {
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string') {
        const ptr = this.writeStringToMemory(value, instance)
        ;(imports.index![`input.${key}`] as WebAssembly.Global).value = ptr
      }
    }
  }

  private createMockFunction(functionName: string, mockValue: MockResponseValue): CallableFunction {
    if (mockValue === 'log') {
      return this.createLogFn(functionName)
    } else if (this.isParameterizedResponse(mockValue)) {
      return this.createParameterizedFunction(functionName, mockValue)
    } else {
      return this.createConstantFunction(String(mockValue))
    }
  }

  private isParameterizedResponse(value: unknown): value is ParameterizedResponse {
    const result = ParameterizedResponseValidator.safeParse(value)
    return result.success
  }

  private createConstantFunction(value: string): CallableFunction {
    return () => this.writeStringToMemory(value)
  }

  private createParameterizedFunction(functionName: string, config: ParameterizedResponse): CallableFunction {
    return (ptr: number) => {
      const param = this.getStringFromMemory(ptr)
      let result: number

      if (config.paramResponse && param in config.paramResponse) {
        result = this.writeStringToMemory(config.paramResponse[param])
      } else if ('default' in config && config.default !== undefined) {
        result = this.writeStringToMemory(config.default)
      } else {
        throw new Error(`No response defined for parameter "${param}" in function "${functionName}".`)
      }

      if (config.log === true) {
        this.logToFile(functionName, param)
      }

      return result
    }
  }

  private getStringFromMemory(ptr: number): string {
    const memory = this.instance.exports.memory as WebAssembly.Memory
    const memoryBuffer = new Uint8Array(memory.buffer)
    const view = new DataView(memory.buffer)
    const length = view.getInt32(ptr - 4, LITTLE_ENDIAN)
    const bytes = memoryBuffer.subarray(ptr, ptr + length)
    return new TextDecoder('utf-16le').decode(bytes)
  }

  private writeStringToMemory(str: string, instance = this.instance): number {
    const memory = instance.exports.memory as WebAssembly.Memory
    const malloc = instance.exports.__new as CallableFunction

    if (!malloc) throw new Error('__new function not found in WebAssembly exports')

    const ptr = malloc(str.length * 2, 2) as number
    const uint16View = new Uint16Array(memory.buffer, ptr, str.length)
    uint16View.set(Array.from(str, (char) => char.charCodeAt(0)))

    return ptr
  }
}
