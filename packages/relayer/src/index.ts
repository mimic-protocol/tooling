import fs from 'fs'
import path from 'path'

import Environment from './environment'
import Oracle from './oracle'

export async function executeTask(opts: { dir: string }) {
  const wasmPath = path.join(opts.dir, 'task.wasm')
  const inputsPath = path.join(opts.dir, 'inputs.json')
  const manifestPath = path.join(opts.dir, 'manifest.json')
  const outputPath = path.join('output.json')

  const requestedCalls = JSON.parse(fs.readFileSync(inputsPath, 'utf8'))
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  const environmentCalls = requestedCalls.environment
  const environment = generateEnvironment(environmentCalls)
  const environmentImports = generateEnvironmentImports(environment, environmentCalls, manifest.inputs)

  const oracleCalls = requestedCalls.oracle
  const oracleImports = await generateOracleImports(oracleCalls)

  try {
    const wasmBuffer = fs.readFileSync(wasmPath)
    const wasmModule = new WebAssembly.Module(wasmBuffer)
    const instance = new WebAssembly.Instance(wasmModule, { index: { ...environmentImports, ...oracleImports } })

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
): WebAssembly.ModuleImports {
  const imports: WebAssembly.ModuleImports = {}
  requestedCalls.forEach((requestedCall) => {
    const prop = environment[requestedCall as keyof Environment]
    if (prop === undefined || typeof prop !== 'function') throw new Error(`Invalid requested call "${requestedCall}"`)
    imports[`environment.${requestedCall}`] = prop.bind(environment)
  })

  for (const [key, value] of Object.entries(inputs)) imports[`input.${key}`] = value

  return imports
}

async function generateOracleImports(requestedCalls: string[]): Promise<WebAssembly.ModuleImports> {
  const oracle = new Oracle()
  const imports: WebAssembly.ModuleImports = {}

  for (const requestedCall of requestedCalls) {
    const prop = oracle[requestedCall as keyof Oracle]
    if (prop === undefined || typeof prop !== 'function') throw new Error(`Invalid requested call "${requestedCall}"`)

    const value = await prop()
    imports[`oracle.${requestedCall}`] = () => value
  }

  return imports
}
