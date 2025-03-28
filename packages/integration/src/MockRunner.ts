import * as fs from 'fs'
import { join } from 'path'
import type { ZodType } from 'zod'

import {
  MockConfig,
  MockConfigValidator,
  MockResponseValue,
  ParameterizedResponse,
  ParameterizedResponseValidator,
} from './types'

const LITTLE_ENDIAN = true

export default class MockRunner {
  private instance: WebAssembly.Instance
  private taskFolder: string
  private ENV_IMPORTS = {
    abort: (msgPtr: number, filePtr: number, line: number, col: number) => {
      const msg = this.getStringFromMemory(msgPtr)
      const file = this.getStringFromMemory(filePtr)
      throw Error(`${msg} in ${file} (line ${line}, column ${col})`)
    },
    'console.log': (ptr: number) => {
      const text = this.getStringFromMemory(ptr)
      console.log('[WASM LOG]:', text)
    },
  }

  constructor(taskFolder: string) {
    this.taskFolder = taskFolder
    this.instance = this.initializeWasmInstance(taskFolder)
  }

  private initializeWasmInstance(taskFolder: string): WebAssembly.Instance {
    try {
      const taskPath = join(taskFolder, 'task.wasm')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const manifest = this.readJsonFile<any>(join(taskFolder, 'manifest.json'))
      const mock = this.readJsonFile<MockConfig>(join(taskFolder, '../mock.json'), MockConfigValidator)
      const imports = this.generateImports(mock, manifest.inputs)

      const wasmBuffer = fs.readFileSync(taskPath)
      const wasmModule = new WebAssembly.Module(wasmBuffer)
      return new WebAssembly.Instance(wasmModule, imports)
    } catch (error) {
      throw new Error(`Failed to initialize WASM instance: ${error}`)
    }
  }

  private readJsonFile<T>(filePath: string, validator?: ZodType<T>): T {
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
      throw Error(`WASM Execution Error - ${error}`)
    }
  }

  private createLogFn(call: string) {
    return (ptr: number) => {
      const params = this.getStringFromMemory(ptr)
      this.logToFile(call, params)
    }
  }

  private logToFile(call: string, params: string) {
    const logFile = join(this.taskFolder, 'test.log')
    fs.appendFileSync(logFile, `${call}: ${params}\n`)
  }

  private generateImports(mock: MockConfig, inputs: WebAssembly.ModuleImports): WebAssembly.Imports {
    const environmentImports: WebAssembly.ModuleImports = {}
    const variableImports: WebAssembly.ModuleImports = {}

    for (const [functionName, mockValue] of Object.entries(mock)) {
      environmentImports[functionName] = this.createMockFunction(functionName, mockValue)
    }

    for (const [key, value] of Object.entries(inputs)) {
      variableImports[`input.${key}`] = value
    }

    return {
      environment: environmentImports,
      env: this.ENV_IMPORTS,
      index: variableImports,
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

      if (param in config.paramResponses) {
        return this.writeStringToMemory(config.paramResponses[param])
      }

      if ('default' in config && config.default !== undefined) {
        return this.writeStringToMemory(config.default)
      }

      throw new Error(
        `No response defined for parameter "${param}" in function "${functionName}" and no default value provided`
      )
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

  private writeStringToMemory(str: string): number {
    const memory = this.instance.exports.memory as WebAssembly.Memory
    const malloc = this.instance.exports.__new as CallableFunction

    if (!malloc) {
      throw new Error('__new function not found in WebAssembly exports')
    }

    const ptr = malloc(str.length * 2, 2) as number
    const uint16View = new Uint16Array(memory.buffer, ptr, str.length)
    uint16View.set(Array.from(str, (char) => char.charCodeAt(0)))

    return ptr
  }
}
