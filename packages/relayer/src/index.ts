import fs from 'fs'
import path from 'path'

export function executeTask(opts: { dir: string }) {
  const wasmPath = path.join(opts.dir, 'task.wasm')
  const inputsPath = path.join(opts.dir, 'inputs.json')
  const outputPath = path.join('output.json')

  const output: any[] = []
  const imports: any = {
    index: {
      environment: {
        create: (value: number): void => {
          console.log(`>>> environment.create(${value})`)
          output.push(value)
        },
      }
    }
  }

  const inputData = JSON.parse(fs.readFileSync(inputsPath, 'utf8'))
  if (inputData.environmentCalls?.includes('getNumber')) {
    imports.index.environment.getNumber = (): number => {
      console.log('>>> getNumber called')
      return Math.floor(Math.random() * 10)
    }
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
