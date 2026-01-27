import { defaultLogger } from '../log'

import { codegen } from './codegen'
import { compile } from './compile'
import { BuildOptions, CommandResult, Logger } from './types'

export async function build(options: BuildOptions, logger: Logger = defaultLogger): Promise<CommandResult> {
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

  if (clean && !codegenResult.success) return { success: false }

  const compileResult = await compile(
    {
      manifestPath,
      taskPath,
      outputDir,
      cwd,
    },
    logger
  )

  return { success: codegenResult.success && compileResult.success }
}
