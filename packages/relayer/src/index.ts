import fs from 'fs'
import path from 'path'

import Environment from './environment'

export async function executeTask(opts: { dir: string }) {
  const wasmPath = path.join(opts.dir, 'task.wasm')
  const inputsPath = path.join(opts.dir, 'environment.json')
  const manifestPath = path.join(opts.dir, 'manifest.json')
  const outputPath = path.join('output.json')

  const requestedCalls = JSON.parse(fs.readFileSync(inputsPath, 'utf8'))
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  const environment = generateEnvironment(requestedCalls)
  const imports = generateEnvironmentImports(environment, requestedCalls, manifest.inputs)

  try {
    const wasmBuffer = fs.readFileSync(wasmPath)
    const wasmModule = new WebAssembly.Module(wasmBuffer)
    const instance = new WebAssembly.Instance(wasmModule, imports)

    if (typeof instance.exports.main === 'function') {
      instance.exports.main()
      fs.writeFileSync(outputPath, JSON.stringify(environment.intents, null, 2))
      console.log('Task executed successfully')
      console.log(`Intents produced: [${environment.intents.join(', ')}]`)
    } else {
      console.log('No main found in exports:', Object.keys(instance.exports))
    }
  } catch (error) {
    console.error('WASM Instantiation Error:', error)
  }
}

function generateEnvironment(requestedCalls: string[]): Environment {
  const environment = new Environment()
  if (requestedCalls.includes('getValue')) environment.setValue(Math.floor(Math.random() * 10))
  return environment
}

function generateEnvironmentImports(
  environment: Environment,
  requestedCalls: string[],
  inputs: WebAssembly.ModuleImports
): WebAssembly.Imports {
  const imports: WebAssembly.ModuleImports = {}
  requestedCalls.forEach((requestedCall) => {
    const prop = environment[requestedCall as keyof Environment]
    if (prop === undefined || typeof prop !== 'function') throw new Error(`Invalid requested call "${requestedCall}"`)
    imports[`environment.${requestedCall}`] = prop.bind(environment)
  })

  for (const [key, value] of Object.entries(inputs)) imports[`input.${key}`] = value

  return { index: imports }
}
