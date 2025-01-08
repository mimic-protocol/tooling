import fs from 'fs'
import path from 'path'

import Environment from './classes/environment'

export async function executeTask(opts: { dir: string }) {
  const wasmPath = path.join(opts.dir, 'task.wasm')
  const inputsPath = path.join(opts.dir, 'inputs.json')
  const outputPath = path.join('output.json')

  const output: number[] = []
  const inputData = JSON.parse(fs.readFileSync(inputsPath, 'utf8'))
  const environment = new Environment()

  const environmentImports: Record<string, Function> = {}
  for (const call of inputData.environmentCalls || []) {
    switch (call) {
      case 'getNumber':
        environmentImports[`environment.${call}`] = environment.getNumber
        break
      case 'create':
        environmentImports[`environment.${call}`] = (value: number) => environment.create(value, output)
        break
      default:
        throw new Error('Unknown environment call: ' + call)
    }
  }

  const imports: WebAssembly.Imports = {
    index: environmentImports,
  }

  try {
    const wasmBuffer = fs.readFileSync(wasmPath)
    const wasmModule = new WebAssembly.Module(wasmBuffer)
    const instance = new WebAssembly.Instance(wasmModule, imports)

    if (typeof instance.exports.main === 'function') {
      instance.exports.main()
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
      console.log('Task executed successfully')
    } else {
      console.log('No main found in exports:', Object.keys(instance.exports))
    }
  } catch (error) {
    console.error('WASM Instantiation Error:', error)
  }
}
