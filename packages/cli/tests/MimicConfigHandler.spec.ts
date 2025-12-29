import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import MimicConfigHandler from '../src/lib/MimicConfigHandler'
import { MimicConfigValidator } from '../src/validators'

describe('MimicConfigHandler', () => {
  const mimicConfig = {
    tasks: [
      { name: 'swap-task', manifest: './tasks/swap/manifest.yaml', entry: './tasks/swap/src/task.ts' },
      { name: 'transfer-task', manifest: './tasks/transfer/manifest.yaml', entry: './tasks/transfer/src/task.ts' },
    ],
  }

  describe('exists', () => {
    context('when mimic.yaml exists in the directory', () => {
      it('returns true', () => {
        const tempDir = path.join(__dirname, 'temp-workspace-test')
        fs.mkdirSync(tempDir, { recursive: true })
        fs.writeFileSync(path.join(tempDir, 'mimic.yaml'), 'tasks: []')

        try {
          expect(MimicConfigHandler.exists(tempDir)).to.be.true
        } finally {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
      })
    })

    context('when mimic.yaml does not exist in the directory', () => {
      it('returns false', () => {
        const tempDir = path.join(__dirname, 'temp-empty-dir')
        fs.mkdirSync(tempDir, { recursive: true })

        try {
          expect(MimicConfigHandler.exists(tempDir)).to.be.false
        } finally {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
      })
    })
  })

  describe('validate', () => {
    context('when the mimic config is valid', () => {
      context('when everything is present', () => {
        it('returns the parsed mimic config', () => {
          const parsedMimicConfig = MimicConfigValidator.parse(mimicConfig)

          expect(parsedMimicConfig).to.not.be.undefined
          expect(parsedMimicConfig.tasks).to.have.length(2)
        })
      })

      context('when dealing with tasks', () => {
        context('when tasks have optional fields', () => {
          it('returns the parsed mimic config with all fields', () => {
            const mimicConfigWithOptionals = {
              ...mimicConfig,
              tasks: [{ ...mimicConfig.tasks[0], output: './build/swap', types: './types/swap' }],
            }
            const parsedMimicConfig = MimicConfigValidator.parse(mimicConfigWithOptionals)

            expect(parsedMimicConfig).to.not.be.undefined
            expect(parsedMimicConfig.tasks[0].output).to.equal('./build/swap')
            expect(parsedMimicConfig.tasks[0].types).to.equal('./types/swap')
          })
        })

        context('when tasks do not have optional fields', () => {
          it('returns the parsed mimic config with undefined optional fields', () => {
            const parsedMimicConfig = MimicConfigValidator.parse(mimicConfig)

            expect(parsedMimicConfig).to.not.be.undefined
            expect(parsedMimicConfig.tasks[0].output).to.be.undefined
            expect(parsedMimicConfig.tasks[0].types).to.be.undefined
          })
        })
      })
    })

    context('when the mimic config is not valid', () => {
      const itReturnsAnError = (w: unknown, ...errors: string[]) => {
        it('returns an error', () => {
          for (const error of errors) expect(() => MimicConfigValidator.parse(w)).to.throw(error)
        })
      }

      context('when the tasks array is empty', () => {
        itReturnsAnError({ ...mimicConfig, tasks: [] }, 'At least one task must be defined')
      })

      context('when task name is missing', () => {
        itReturnsAnError(
          { ...mimicConfig, tasks: [{ manifest: './manifest.yaml', entry: './src/task.ts' }] },
          'Required'
        )
      })

      context('when task manifest is missing', () => {
        itReturnsAnError({ ...mimicConfig, tasks: [{ name: 'task', entry: './src/task.ts' }] }, 'Required')
      })

      context('when task entry is missing', () => {
        itReturnsAnError({ ...mimicConfig, tasks: [{ name: 'task', manifest: './manifest.yaml' }] }, 'Required')
      })
    })
  })

  describe('getTasks', () => {
    context('when dealing with optional fields', () => {
      context('when optional fields are provided', () => {
        it('returns tasks with the provided values', () => {
          const mimicConfigWithOptionals = {
            ...mimicConfig,
            tasks: [{ ...mimicConfig.tasks[0], output: './custom-build', types: './custom-types' }],
          }

          const tasks = MimicConfigHandler.getTasks(mimicConfigWithOptionals)

          expect(tasks).to.have.length(1)
          expect(tasks[0].output).to.equal('./custom-build')
          expect(tasks[0].types).to.equal('./custom-types')
        })
      })

      context('when optional fields are not provided', () => {
        it('returns tasks with computed default values', () => {
          const tasks = MimicConfigHandler.getTasks(mimicConfig)

          expect(tasks).to.have.length(2)
          expect(tasks[0].output).to.equal('build/swap-task')
          expect(tasks[0].types).to.equal('tasks/swap/src/types')
          expect(tasks[1].output).to.equal('build/transfer-task')
          expect(tasks[1].types).to.equal('tasks/transfer/src/types')
        })
      })

      context('when some tasks have optional fields and some do not', () => {
        it('applies defaults only to tasks missing optional fields', () => {
          const mixedMimicConfig = {
            ...mimicConfig,
            tasks: [mimicConfig.tasks[0], { ...mimicConfig.tasks[1], output: './custom-output' }],
          }

          const tasks = MimicConfigHandler.getTasks(mixedMimicConfig)

          expect(tasks).to.have.length(2)
          expect(tasks[0].output).to.equal('build/swap-task')
          expect(tasks[0].types).to.equal('tasks/swap/src/types')
          expect(tasks[1].output).to.equal('./custom-output')
          expect(tasks[1].types).to.equal('tasks/transfer/src/types')
        })
      })
    })
  })
})
