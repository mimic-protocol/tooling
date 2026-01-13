import { defaultLogger } from '../log'

import { codegen } from './codegen'
import { compile } from './compile'
import { BuildOptions, BuildResult, Logger } from './types'

export async function build(options: BuildOptions, logger: Logger = defaultLogger): Promise<BuildResult> {
  const { manifestPath, taskPath, outputDir, typesDir, clean, confirmClean, cwd } = options

  const codegenResult = await codegen(
    {
      manifestPath,
      outputDir: typesDir,
      clean,
      confirmClean,
    },
    logger
  )

  if (clean && !codegenResult.success) {
    return {
      codegen: codegenResult,
      compile: { wasmPath: '', manifestJsonPath: '', success: false },
      success: false,
    }
  }

  const compileResult = await compile(
    {
      manifestPath,
      taskPath,
      outputDir,
      cwd,
    },
    logger
  )

  return {
    codegen: codegenResult,
    compile: compileResult,
    success: codegenResult.success && compileResult.success,
  }
}
