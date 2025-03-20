import * as fs from 'fs'
import { join } from 'path'

let instance: WebAssembly.Instance

export default {
  run(taskFolder: string): void {
    const taskPath = join(taskFolder, 'task.wasm')
    const environment = JSON.parse(fs.readFileSync(join(taskFolder, 'environment.json'), 'utf8'))
    const manifest = JSON.parse(fs.readFileSync(join(taskFolder, 'manifest.json'), 'utf8'))
    const mock = JSON.parse(fs.readFileSync(join(taskFolder, '../mock.json'), 'utf8'))
    const imports = generateImports(environment, mock, manifest.inputs)

    try {
      const wasmBuffer = fs.readFileSync(taskPath)
      const wasmModule = new WebAssembly.Module(wasmBuffer)
      instance = new WebAssembly.Instance(wasmModule, imports)

      if (typeof instance.exports.main === 'function') {
        instance.exports.main()
      } else {
        throw Error('No main found in exports:' + Object.keys(instance.exports))
      }
    } catch (error) {
      console.error('WASM Instantiation Error:', error)
    }
  },
}

function logFn(call: string) {
  return (ptr: number) => {
    const string = getStringFromMemory(ptr)
    console.log(call, string)
  }
}

function generateImports(
  requestedCalls: string[],
  mock: Record<string, unknown>,
  inputs: WebAssembly.ModuleImports
): WebAssembly.Imports {
  const imports: WebAssembly.ModuleImports = {}
  for (const call of requestedCalls) {
    if (mock[call] === 'log') imports[call] = logFn(call)
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

function getStringFromMemory(ptr: number): string {
  const memory = instance.exports.memory as WebAssembly.Memory
  const memoryBuffer = new Uint8Array(memory.buffer)
  const view = new DataView(memory.buffer)
  const length = view.getInt32(ptr - 4, true) // `true` means little-endian
  const bytes = memoryBuffer.subarray(ptr, ptr + length)
  return new TextDecoder('utf-16le').decode(bytes)
}
