import * as fs from 'fs'
import { join } from 'path'

const LITTLE_ENDIAN = true

const ENV_IMPORTS = {
  abort: (msg: string, file: string, line: number, col: number) => {
    throw Error(`${msg} - ${file} - ${line} - ${col}`)
  },
}

export default class MockRunner {
  private instance: WebAssembly.Instance
  private taskFolder: string

  constructor(taskFolder: string) {
    const taskPath = join(taskFolder, 'task.wasm')
    const manifest = JSON.parse(fs.readFileSync(join(taskFolder, 'manifest.json'), 'utf8'))
    const mock = JSON.parse(fs.readFileSync(join(taskFolder, '../mock.json'), 'utf8'))
    const imports = this.generateImports(mock, manifest.inputs)
    const wasmBuffer = fs.readFileSync(taskPath)
    const wasmModule = new WebAssembly.Module(wasmBuffer)
    this.instance = new WebAssembly.Instance(wasmModule, imports)
    this.taskFolder = taskFolder
  }

  run(fnName = 'main'): void {
    try {
      let fn = this.instance.exports[fnName]
      if (typeof fn === 'function') fn()
      else throw Error(`No ${fnName} found in exports:` + Object.keys(this.instance.exports))
    } catch (error) {
      console.error('WASM Instantiation Error:', error)
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

  private generateImports(mock: Record<string, unknown>, inputs: WebAssembly.ModuleImports): WebAssembly.Imports {
    const environmentImports: WebAssembly.ModuleImports = {}
    const variableImports: WebAssembly.ModuleImports = {}
    for (const [call, value] of Object.entries(mock)) {
      if (value === 'log') environmentImports[call] = this.createLogFn(call)
      else environmentImports[call] = () => value
    }
    for (const [key, value] of Object.entries(inputs)) variableImports[`input.${key}`] = value

    return { environment: environmentImports, env: ENV_IMPORTS, index: variableImports }
  }

  private getStringFromMemory(ptr: number): string {
    const memory = this.instance.exports.memory as WebAssembly.Memory
    const memoryBuffer = new Uint8Array(memory.buffer)
    const view = new DataView(memory.buffer)
    const length = view.getInt32(ptr - 4, LITTLE_ENDIAN)
    const bytes = memoryBuffer.subarray(ptr, ptr + length)
    return new TextDecoder('utf-16le').decode(bytes)
  }
}
