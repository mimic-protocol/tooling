import * as fs from 'fs'
import { join } from 'path'
export default class MockRunner {
  private instance: WebAssembly.Instance
  private taskFolder: string

  constructor(taskFolder: string) {
    const taskPath = join(taskFolder, 'task.wasm')
    const environment = JSON.parse(fs.readFileSync(join(taskFolder, 'environment.json'), 'utf8'))
    const manifest = JSON.parse(fs.readFileSync(join(taskFolder, 'manifest.json'), 'utf8'))
    const mock = JSON.parse(fs.readFileSync(join(taskFolder, '../mock.json'), 'utf8'))
    const imports = this.generateImports(environment, mock, manifest.inputs)
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

  private generateImports(
    requestedCalls: string[],
    mock: Record<string, unknown>,
    inputs: WebAssembly.ModuleImports
  ): WebAssembly.Imports {
    const imports: WebAssembly.ModuleImports = {}
    for (const call of requestedCalls) {
      if (mock[call] === 'log') imports[call] = this.createLogFn(call)
      else imports[call] = () => mock[call]
    }
    for (const [key, value] of Object.entries(inputs)) imports[`input.${key}`] = value

    const envInports = {
      abort: (msg: string, file: string, line: number, col: number) => {
        throw Error(`${msg} - ${file} - ${line} - ${col}`)
      },
    }

    return { environment: imports, env: envInports }
  }

  private getStringFromMemory(ptr: number): string {
    const memory = this.instance.exports.memory as WebAssembly.Memory
    const memoryBuffer = new Uint8Array(memory.buffer)
    const view = new DataView(memory.buffer)
    const length = view.getInt32(ptr - 4, true) // `true` means little-endian
    const bytes = memoryBuffer.subarray(ptr, ptr + length)
    return new TextDecoder('utf-16le').decode(bytes)
  }
}
