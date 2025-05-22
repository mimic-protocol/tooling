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
            'var first: string',
            'var someAddress: string',
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
            'var someAddress: string',
            'const isTrue: bool',
            'var s: string',
            'static get first(): i32',
            'static get someAddress(): Address',
            'static get isTrue(): bool',
            'static get s(): string'
          )
        })
      })

      context('when generating all int and uint types', () => {
        it('generates the correct field and getter types', () => {
          const inputs: Record<string, string> = {}
          const expectedSnippets: string[] = []

          function mapToNativeOrBigInt(
            size: number,
            isUnsigned: boolean
          ): {
            getter: string
            field: string
            declaration: string
          } {
            const prefix = isUnsigned ? 'u' : 'i'

            if (size <= 8) return { getter: `${prefix}8`, field: `${prefix}8`, declaration: 'const' }
            if (size <= 16) return { getter: `${prefix}16`, field: `${prefix}16`, declaration: 'const' }
            if (size <= 32) return { getter: `${prefix}32`, field: `${prefix}32`, declaration: 'const' }
            if (size <= 64) return { getter: `${prefix}64`, field: `${prefix}64`, declaration: 'const' }

            return { getter: 'BigInt', field: 'string | null', declaration: 'var' }
          }

          for (let size = 8; size <= 256; size += 8) {
            const intKey = `signed${size}`
            const uintKey = `unsigned${size}`

            inputs[intKey] = `int${size}`
            inputs[uintKey] = `uint${size}`

            const intTypes = mapToNativeOrBigInt(size, false)
            const uintTypes = mapToNativeOrBigInt(size, true)

            expectedSnippets.push(
              `${intTypes.declaration} ${intKey}: ${intTypes.field}`,
              `static get ${intKey}(): ${intTypes.getter}`,

              `${uintTypes.declaration} ${uintKey}: ${uintTypes.field}`,
              `static get ${uintKey}(): ${uintTypes.getter}`
            )
          }

          const result = InputsInterfaceGenerator.generate(inputs)
          expectItIncludes(result, ...expectedSnippets)
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
