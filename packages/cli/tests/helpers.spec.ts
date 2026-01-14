import { Command } from '@oclif/core'
import { expect } from 'chai'
import * as sinon from 'sinon'

import { filterTasks } from '../src/helpers'
import { RequiredTaskConfig } from '../src/types'

describe('filterTasks', () => {
  let mockCommand: Command
  let warnSpy: sinon.SinonSpy
  let errorStub: sinon.SinonStub

  const createTask = (name: string): RequiredTaskConfig => ({
    name,
    manifest: `./tasks/${name}/manifest.yaml`,
    task: `./tasks/${name}/src/task.ts`,
    output: `build/${name}`,
    types: `./tasks/${name}/src/types`,
  })

  const tasks: RequiredTaskConfig[] = [createTask('swap-task'), createTask('transfer-task'), createTask('call-task')]

  beforeEach('setup mocks', () => {
    errorStub = sinon.stub().throws(new Error('Command error'))
    mockCommand = {
      error: errorStub,
    } as unknown as Command

    warnSpy = sinon.spy(console, 'warn')
  })

  afterEach('restore mocks', () => {
    warnSpy.restore()
  })

  context('when no filter flags are provided', () => {
    it('returns all tasks', () => {
      const result = filterTasks(mockCommand, tasks)

      expect(result).to.have.length(3)
      expect(result).to.deep.equal(tasks)
      expect(warnSpy.called).to.be.false
    })
  })

  context('when --include flag is provided', () => {
    context('when all task names are valid', () => {
      context('when including a single task', () => {
        it('returns only the included task', () => {
          const result = filterTasks(mockCommand, tasks, ['swap-task'])

          expect(result).to.have.length(1)
          expect(result[0].name).to.equal('swap-task')
          expect(warnSpy.called).to.be.false
        })
      })

      context('when including multiple tasks', () => {
        it('returns all included tasks', () => {
          const result = filterTasks(mockCommand, tasks, ['swap-task', 'transfer-task'])

          expect(result).to.have.length(2)
          expect(result.map((t) => t.name)).to.include.members(['swap-task', 'transfer-task'])
          expect(warnSpy.called).to.be.false
        })
      })
    })

    context('when some task names are invalid', () => {
      it('logs a warning and returns valid tasks', () => {
        const result = filterTasks(mockCommand, tasks, ['swap-task', 'invalid-task'])

        expect(result).to.have.length(1)
        expect(result[0].name).to.equal('swap-task')
        expect(warnSpy.calledOnce).to.be.true
        expect(warnSpy.firstCall.args[0]).to.include('invalid-task')
      })
    })

    context('when all task names are invalid', () => {
      it('logs a warning and returns empty array', () => {
        const result = filterTasks(mockCommand, tasks, ['invalid-task-1', 'invalid-task-2'])

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
          const result = filterTasks(mockCommand, tasks, undefined, ['swap-task'])

          expect(result).to.have.length(2)
          expect(result.map((t) => t.name)).to.include.members(['transfer-task', 'call-task'])
          expect(result.map((t) => t.name)).to.not.include('swap-task')
          expect(warnSpy.called).to.be.false
        })
      })

      context('when excluding multiple tasks', () => {
        it('returns tasks except the excluded ones', () => {
          const result = filterTasks(mockCommand, tasks, undefined, ['swap-task', 'transfer-task'])

          expect(result).to.have.length(1)
          expect(result[0].name).to.equal('call-task')
          expect(warnSpy.called).to.be.false
        })
      })
    })

    context('when some task names are invalid', () => {
      it('logs a warning and excludes valid tasks', () => {
        const result = filterTasks(mockCommand, tasks, undefined, ['swap-task', 'invalid-task'])

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
        filterTasks(mockCommand, tasks, ['swap-task'], ['transfer-task'])
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
