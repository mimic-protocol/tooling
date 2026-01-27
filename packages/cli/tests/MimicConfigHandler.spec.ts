import { Command } from '@oclif/core'
import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import * as sinon from 'sinon'

import MimicConfigHandler from '../src/lib/MimicConfigHandler'
import { RequiredTaskConfig } from '../src/types'
import { MimicConfigValidator } from '../src/validators'

describe('MimicConfigHandler', () => {
  const mimicConfig = {
    tasks: [
      { name: 'swap-task', manifest: './tasks/swap/manifest.yaml', task: './tasks/swap/src/task.ts' },
      { name: 'transfer-task', manifest: './tasks/transfer/manifest.yaml', task: './tasks/transfer/src/task.ts' },
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
          { ...mimicConfig, tasks: [{ manifest: './manifest.yaml', task: './src/task.ts' }] },
          'Required'
        )
      })

      context('when task manifest is missing', () => {
        itReturnsAnError({ ...mimicConfig, tasks: [{ name: 'task', task: './src/task.ts' }] }, 'Required')
      })

      context('when task task is missing', () => {
        itReturnsAnError({ ...mimicConfig, tasks: [{ name: 'task', manifest: './manifest.yaml' }] }, 'Required')
      })
    })
  })

  describe('normalizeTaskConfigs', () => {
    context('when dealing with optional fields', () => {
      context('when optional fields are provided', () => {
        it('returns tasks with the provided values', () => {
          const mimicConfigWithOptionals = {
            ...mimicConfig,
            tasks: [{ ...mimicConfig.tasks[0], output: './custom-build', types: './custom-types' }],
          }

          const tasks = MimicConfigHandler.normalizeTaskConfigs(mimicConfigWithOptionals)

          expect(tasks).to.have.length(1)
          expect(tasks[0].output).to.equal('./custom-build')
          expect(tasks[0].types).to.equal('./custom-types')
        })
      })

      context('when optional fields are not provided', () => {
        it('returns tasks with computed default values', () => {
          const tasks = MimicConfigHandler.normalizeTaskConfigs(mimicConfig)

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

          const tasks = MimicConfigHandler.normalizeTaskConfigs(mixedMimicConfig)

          expect(tasks).to.have.length(2)
          expect(tasks[0].output).to.equal('build/swap-task')
          expect(tasks[0].types).to.equal('tasks/swap/src/types')
          expect(tasks[1].output).to.equal('./custom-output')
          expect(tasks[1].types).to.equal('tasks/transfer/src/types')
        })
      })
    })
  })

  describe('getFilteredTasks', () => {
    let mockCommand: Command
    let warnSpy: sinon.SinonSpy
    let errorStub: sinon.SinonStub
    let loadOrDefaultStub: sinon.SinonStub

    const createTask = (name: string): RequiredTaskConfig => ({
      name,
      manifest: `./tasks/${name}/manifest.yaml`,
      task: `./tasks/${name}/src/task.ts`,
      output: `build/${name}`,
      types: `./tasks/${name}/src/types`,
    })

    const tasks: RequiredTaskConfig[] = [createTask('swap-task'), createTask('transfer-task'), createTask('call-task')]

    const defaultTask = {
      manifest: 'manifest.yaml',
      task: 'src/task.ts',
      output: './build',
      types: './src/types',
    }

    beforeEach('setup mocks', () => {
      errorStub = sinon.stub().throws(new Error('Command error'))
      mockCommand = {
        error: errorStub,
      } as unknown as Command

      warnSpy = sinon.spy(console, 'warn')
      loadOrDefaultStub = sinon.stub(MimicConfigHandler, 'loadOrDefault').returns(tasks)
    })

    afterEach('restore mocks', () => {
      warnSpy.restore()
      loadOrDefaultStub.restore()
    })

    context('when no filter flags are provided', () => {
      it('returns all tasks', () => {
        const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
          defaultTask,
        })

        expect(result).to.have.length(3)
        expect(result).to.deep.equal(tasks)
        expect(warnSpy.called).to.be.false
        expect(loadOrDefaultStub.calledOnce).to.be.true
      })
    })

    context('when --include flag is provided', () => {
      context('when all task names are valid', () => {
        context('when including a single task', () => {
          it('returns only the included task', () => {
            const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
              defaultTask,
              include: ['swap-task'],
            })

            expect(result).to.have.length(1)
            expect(result[0].name).to.equal('swap-task')
            expect(warnSpy.called).to.be.false
          })
        })

        context('when including multiple tasks', () => {
          it('returns all included tasks', () => {
            const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
              defaultTask,
              include: ['swap-task', 'transfer-task'],
            })

            expect(result).to.have.length(2)
            expect(result.map((t) => t.name)).to.include.members(['swap-task', 'transfer-task'])
            expect(warnSpy.called).to.be.false
          })
        })
      })

      context('when some task names are invalid', () => {
        it('logs a warning and returns valid tasks', () => {
          const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
            defaultTask,
            include: ['swap-task', 'invalid-task'],
          })

          expect(result).to.have.length(1)
          expect(result[0].name).to.equal('swap-task')
          expect(warnSpy.calledOnce).to.be.true
          expect(warnSpy.firstCall.args[0]).to.include('invalid-task')
        })
      })

      context('when all task names are invalid', () => {
        it('logs a warning and returns empty array', () => {
          const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
            defaultTask,
            include: ['invalid-task-1', 'invalid-task-2'],
          })

          expect(result).to.have.length(0)
          expect(warnSpy.calledTwice).to.be.true
          expect(warnSpy.firstCall.args[0]).to.include('invalid-task-1')
          expect(warnSpy.secondCall.args[0]).to.include('No valid tasks to include')
        })
      })
    })

    context('when --exclude flag is provided', () => {
      context('when all task names are valid', () => {
        context('when excluding a single task', () => {
          it('returns tasks except the excluded one', () => {
            const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
              defaultTask,
              exclude: ['swap-task'],
            })

            expect(result).to.have.length(2)
            expect(result.map((t) => t.name)).to.include.members(['transfer-task', 'call-task'])
            expect(result.map((t) => t.name)).to.not.include('swap-task')
            expect(warnSpy.called).to.be.false
          })
        })

        context('when excluding multiple tasks', () => {
          it('returns tasks except the excluded ones', () => {
            const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
              defaultTask,
              exclude: ['swap-task', 'transfer-task'],
            })

            expect(result).to.have.length(1)
            expect(result[0].name).to.equal('call-task')
            expect(warnSpy.called).to.be.false
          })
        })
      })

      context('when some task names are invalid', () => {
        it('logs a warning and excludes valid tasks', () => {
          const result = MimicConfigHandler.getFilteredTasks(mockCommand, {
            defaultTask,
            exclude: ['swap-task', 'invalid-task'],
          })

          expect(result).to.have.length(2)
          expect(result.map((t) => t.name)).to.include.members(['transfer-task', 'call-task'])
          expect(result.map((t) => t.name)).to.not.include('swap-task')
          expect(warnSpy.calledOnce).to.be.true
          expect(warnSpy.firstCall.args[0]).to.include('invalid-task')
        })
      })
    })

    context('when both flags are provided', () => {
      it('throws a ConflictingFlags error', () => {
        expect(() => {
          MimicConfigHandler.getFilteredTasks(mockCommand, {
            defaultTask,
            include: ['swap-task'],
            exclude: ['transfer-task'],
          })
        }).to.throw('Command error')

        expect(errorStub.calledOnce).to.be.true
        expect(errorStub.firstCall.args[0]).to.equal('Cannot use both --include and --exclude flags simultaneously')
        expect(errorStub.firstCall.args[1]).to.deep.equal({
          code: 'ConflictingFlags',
          suggestions: ['Use either --include or --exclude, but not both'],
        })
      })
    })
  })
})
