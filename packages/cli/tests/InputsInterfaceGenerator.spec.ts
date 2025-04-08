import { expect } from 'chai'

import InputsInterfaceGenerator from '../src/lib/InputsInterfaceGenerator'

describe('InputsInterfaceGenerator', () => {
  describe('generate', () => {
    function expectItIncludes(result: string, ...lines: string[]) {
      expect(result).to.contain('export declare namespace input {')
      expect(result).to.contain('}')
      for (const line of lines) expect(result).to.contain(line)
    }

    context('when there are inputs', () => {
      context('when the inputs are simple conversions', () => {
        it('generates correctly', () => {
          const inputs = { first: 'uint64', isTrue: 'bool' }
          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(result, 'const first: u64', 'const isTrue: bool')
        })
      })

      context('when the inputs convert to class', () => {
        it('generates correctly', () => {
          const inputs = { first: 'bytes32', someAddress: 'address' }
          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(
            result,
            `import { Address, Bytes } from '@mimicprotocol/lib-ts'`,
            'const first: Bytes',
            'const someAddress: Address'
          )
        })
      })

      context('when there is a mix of inputs', () => {
        it('generates correctly', () => {
          const inputs = { first: 'int32', someAddress: 'address', isTrue: 'bool', s: 'string' }
          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(
            result,
            `import { Address } from '@mimicprotocol/lib-ts'`,
            'const first: i32',
            'const someAddress: Address',
            'const isTrue: bool',
            'const s: string'
          )
        })
      })

      context('when there are big solidity types', () => {
        it('reduces the size', () => {
          const inputs = { first: 'int256' }
          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(result, 'const first: i64')
        })
      })
    })

    context('when there are no inputs', () => {
      it('generates an empty string', () => {
        const result = InputsInterfaceGenerator.generate({})
        expect(result).to.be.equal('')
      })
    })
  })
})
