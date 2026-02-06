import { Command } from '@oclif/core'
import { expect } from 'chai'
import * as fs from 'fs'
import * as sinon from 'sinon'

import Functions, { FunctionConfigSchema, MimicConfigSchema } from '../../src/commands/functions'

describe('Functions', () => {
  const basePath = `${__dirname}/../fixtures`
  const configFilePath = `${basePath}/mimic.yaml`
  const validConfig = {
    tasks: [
      {
        name: 'task1',
        manifest: 'manifest.yaml',
        function: 'src/function.ts',
        'build-directory': './build',
        'types-directory': './src/types',
      },
      {
        name: 'task2',
        manifest: 'src/task2/manifest.yaml',
        function: 'src/task2/function.ts',
        'build-directory': './build/task2',
        'types-directory': './src/task2/types',
      },
    ],
  }

  describe('FunctionConfigSchema', () => {
    context('when all required fields are present', () => {
      it('validates successfully', () => {
        const config = validConfig.tasks[0]
        expect(() => FunctionConfigSchema.parse(config)).to.not.throw()
      })
    })

    context('when required fields are missing', () => {
      context('when name is missing', () => {
        it('throws error', () => {
          const config = { ...validConfig.tasks[0], name: '' }
          expect(() => FunctionConfigSchema.parse(config)).to.throw()
        })
      })

      context('when manifest is missing', () => {
        it('throws error', () => {
          const config = { ...validConfig.tasks[0], manifest: '' }
          expect(() => FunctionConfigSchema.parse(config)).to.throw()
        })
      })
      context('when function is missing', () => {
        it('throws error', () => {
          const config = { ...validConfig.tasks[0], function: '' }
          expect(() => FunctionConfigSchema.parse(config)).to.throw()
        })
      })
      context('when build-directory is missing', () => {
        it('throws error', () => {
          const config = { ...validConfig.tasks[0], 'build-directory': '' }
          expect(() => FunctionConfigSchema.parse(config)).to.throw()
        })
      })
      context('when types-directory is missing', () => {
        it('throws error', () => {
          const config = { ...validConfig.tasks[0], 'types-directory': '' }
          expect(() => FunctionConfigSchema.parse(config)).to.throw()
        })
      })
    })
  })

  describe('MimicConfigSchema', () => {
    context('when config has valid tasks array', () => {
      it('validates successfully with single task', () => {
        const config = { tasks: [validConfig.tasks[0]] }
        expect(() => MimicConfigSchema.parse(config)).to.not.throw()
      })

      it('validates successfully with multiple tasks', () => {
        expect(() => MimicConfigSchema.parse(validConfig)).to.not.throw()
      })
    })

    context('when tasks array is empty', () => {
      it('throws validation error', () => {
        const config = { tasks: [] }
        expect(() => MimicConfigSchema.parse(config)).to.throw()
      })
    })

    context('when tasks array is missing', () => {
      it('throws validation error', () => {
        const config = {}
        expect(() => MimicConfigSchema.parse(config)).to.throw()
      })
    })

    context('when a task in the array is invalid', () => {
      it('throws validation error for invalid task', () => {
        const config = {
          tasks: [
            validConfig.tasks[0],
            { ...validConfig.tasks[1], name: '' }, // Invalid: empty name
          ],
        }
        expect(() => MimicConfigSchema.parse(config)).to.throw()
      })
    })
  })

  describe('filterFunctions', () => {
    let cmdStub: sinon.SinonStubbedInstance<Command>

    beforeEach(() => {
      cmdStub = sinon.createStubInstance(Command)
    })

    context('when config file does not exist', () => {
      const flags = {
        'config-file': `${basePath}/nonexistent-mimic.yaml`,
        include: [],
        exclude: [],
      }

      context('when no flags are provided', () => {
        it('returns default', () => {
          const result = Functions.filterFunctions(cmdStub, flags)

          expect(result).to.have.lengthOf(1)
          expect(result[0].name).to.equal('')
          expect(result[0].manifest).to.equal('manifest.yaml')
          expect(result[0].function).to.equal('src/function.ts')
          expect(result[0]['build-directory']).to.equal('./build')
          expect(result[0]['types-directory']).to.equal('./src/types')
        })
      })

      context('when flags are provided', () => {
        it('returns default config with overridden manifest', () => {
          const result = Functions.filterFunctions(cmdStub, {
            'config-file': `${basePath}/nonexistent-mimic.yaml`,
            manifest: 'custom-manifest.yaml',
            include: [],
            exclude: [],
          })

          expect(result[0].manifest).to.equal('custom-manifest.yaml')
        })

        it('returns default config with overridden types-directory', () => {
          const result = Functions.filterFunctions(cmdStub, {
            'config-file': `${basePath}/nonexistent-mimic.yaml`,
            'types-directory': './custom/types',
            include: [],
            exclude: [],
          })

          expect(result[0]['types-directory']).to.equal('./custom/types')
        })

        it('returns default config with overridden build-directory', () => {
          const result = Functions.filterFunctions(cmdStub, {
            'config-file': `${basePath}/nonexistent-mimic.yaml`,
            'build-directory': './custom/build',
            include: [],
            exclude: [],
          })

          expect(result[0]['build-directory']).to.equal('./custom/build')
        })

        it('returns default config with overridden function', () => {
          const result = Functions.filterFunctions(cmdStub, {
            'config-file': `${basePath}/nonexistent-mimic.yaml`,
            function: 'src/custom/function.ts',
            include: [],
            exclude: [],
          })

          expect(result[0].function).to.equal('src/custom/function.ts')
        })
      })
    })

    context('when config file exists', () => {
      beforeEach(() => {
        fs.mkdirSync(basePath, { recursive: true })
        fs.writeFileSync(
          configFilePath,
          `
tasks:
  - name: task1
    manifest: manifest.yaml
    function: src/function.ts
    build-directory: ./build
    types-directory: ./src/types
  - name: task2
    manifest: src/task2/manifest.yaml
    function: src/task2/function.ts
    build-directory: ./build/task2
    types-directory: ./src/task2/types
        `
        )
      })

      afterEach(() => {
        if (fs.existsSync(configFilePath)) fs.unlinkSync(configFilePath)
      })

      context('when config is valid', () => {
        it('returns all tasks', () => {
          const flags = {
            'config-file': configFilePath,
            include: [],
            exclude: [],
          }

          const result = Functions.filterFunctions(cmdStub, flags)

          expect(result).to.have.lengthOf(2)
          expect(result[0].name).to.equal('task1')
          expect(result[1].name).to.equal('task2')
        })

        context('when include filter is provided', () => {
          it('returns only included tasks', () => {
            const flags = {
              'config-file': configFilePath,
              include: ['task1'],
              exclude: [],
            }

            const result = Functions.filterFunctions(cmdStub, flags)

            expect(result).to.have.lengthOf(1)
            expect(result[0].name).to.equal('task1')
          })

          it('returns multiple included tasks', () => {
            const flags = {
              'config-file': configFilePath,
              include: ['task1', 'task2'],
              exclude: [],
            }

            const result = Functions.filterFunctions(cmdStub, flags)

            expect(result).to.have.lengthOf(2)
          })

          it('returns empty array when included task does not exist', () => {
            const flags = {
              'config-file': configFilePath,
              include: ['nonexistent'],
              exclude: [],
            }

            const result = Functions.filterFunctions(cmdStub, flags)

            expect(result).to.have.lengthOf(0)
          })
        })

        context('when exclude filter is provided', () => {
          it('excludes specified tasks', () => {
            const flags = {
              'config-file': configFilePath,
              include: [],
              exclude: ['task1'],
            }

            const result = Functions.filterFunctions(cmdStub, flags)

            expect(result).to.have.lengthOf(1)
            expect(result[0].name).to.equal('task2')
          })

          it('excludes multiple tasks', () => {
            const flags = {
              'config-file': configFilePath,
              include: [],
              exclude: ['task1', 'task2'],
            }

            const result = Functions.filterFunctions(cmdStub, flags)

            expect(result).to.have.lengthOf(0)
          })

          it('returns all tasks when excluding non-existent task', () => {
            const flags = {
              'config-file': configFilePath,
              include: [],
              exclude: ['nonexistent'],
            }

            const result = Functions.filterFunctions(cmdStub, flags)

            expect(result).to.have.lengthOf(2)
          })
        })

        context('when config is invalid', () => {
          beforeEach(() => {
            fs.writeFileSync(
              configFilePath,
              `tasks:
  - name: task1
    manifest: manifest.yaml`
            )
          })

          it('throws error with validation message', () => {
            const flags = {
              'config-file': configFilePath,
              include: [],
              exclude: [],
            }

            expect(() => Functions.filterFunctions(cmdStub, flags)).to.throw()
            expect(cmdStub.error.calledOnce).to.be.true
          })

          it('displays helpful error message for missing fields', () => {
            const flags = {
              'config-file': configFilePath,
              include: [],
              exclude: [],
            }

            try {
              Functions.filterFunctions(cmdStub, flags)
            } catch {
              expect(cmdStub.error.calledOnce).to.be.true
              const errorCall = cmdStub.error.getCall(0)
              expect(errorCall.args[0]).to.include('Invalid mimic.yaml configuration')
            }
          })
        })

        context('when YAML is malformed', () => {
          beforeEach(() => {
            fs.writeFileSync(
              configFilePath,
              `tasks:
  - name: task1
    invalid yaml: [`
            )
          })

          it('throws error when parsing YAML', () => {
            const flags = {
              'config-file': configFilePath,
              include: [],
              exclude: [],
            }

            expect(() => Functions.filterFunctions(cmdStub, flags)).to.throw()
          })
        })
      })
    })
  })
})
