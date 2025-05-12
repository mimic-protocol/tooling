import { expect } from 'chai'

import InputsInterfaceGenerator from '../src/lib/InputsInterfaceGenerator'

describe('InputsInterfaceGenerator', () => {
  describe('generate', () => {
    function expectItIncludes(result: string, ...lines: string[]) {
      const expectedBlock = [
        '}',
        '',
        '// The class name is intentionally lowercase and plural to resemble a namespace when used in a task',
        'export class inputs {',
      ].join('\n')
      expect(result).to.contain('declare namespace input {')
      expect(result).to.contain(expectedBlock)
      for (const line of lines) expect(result).to.contain(line)
    }

    context('when there are inputs', () => {
      context('when the inputs are simple conversions', () => {
        it('generates correctly', () => {
          const inputs = { first: 'uint64', isTrue: 'bool' }
          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(
            result,
            'const first: u64',
            'const isTrue: bool',
            'static get first(): u64',
            'static get isTrue(): bool'
          )
        })
      })

      context('when the inputs convert to class', () => {
        it('generates correctly', () => {
          const inputs = { first: 'bytes32', someAddress: 'address' }
          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(
            result,
            `import { Address, Bytes } from '@mimicprotocol/lib-ts'`,
            'var firstPtr: u32',
            'var someAddressPtr: u32',
            'static get first(): Bytes',
            'static get someAddress(): Address'
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
            'var someAddressPtr: u32',
            'const isTrue: bool',
            'var sPtr: u32',
            'static get first(): i32',
            'static get someAddress(): Address',
            'static get isTrue(): bool',
            'static get s(): string'
          )
        })
      })

      context('when there are big solidity types', () => {
        it('reduces the size', () => {
          const inputs = { first: 'int256' }
          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(result, 'const first: i64', 'static get first(): i64')
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
