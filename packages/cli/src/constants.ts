import { RequiredTaskConfig } from './types'

export const DEFAULT_TASK_NAME = 'default'

export const DEFAULT_TASK: Omit<RequiredTaskConfig, 'name'> = {
  manifest: 'manifest.yaml',
  task: 'src/task.ts',
  types: './src/types',
  output: './build',
}
