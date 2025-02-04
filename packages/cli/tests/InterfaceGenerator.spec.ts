import { expect } from 'chai'

import InterfaceGenerator from '../src/InterfaceGenerator'

import ERC20 from './fixtures/abis/ERC20.json'

const erc20Abi = ERC20 as unknown as Record<string, never>[]

describe('InterfaceGenerator', () => {
  context('when ABI contains read-only functions', () => {
    it('generates an interface with only view and pure functions', () => {
      const contractName = 'MyERC20'
      const result = InterfaceGenerator.generate(erc20Abi, contractName)

      expect(result).to.include(`export declare namespace ${contractName} {`)
      expect(result).to.include('export function name(')
      expect(result).to.include('export function symbol(')
      expect(result).to.include('export function decimals(')
      expect(result).to.include('export function totalSupply(')
      expect(result).to.include('export function balanceOf(')
      expect(result).to.not.include('export function transfer(')
    })
  })

  context('when ABI contains only non read-only functions', () => {
    it('returns an empty string', () => {
      const contractName = 'MyERC20'
      const nonReadOnlyAbi = erc20Abi.filter((item: Record<string, never>) => {
        return !['view', 'pure'].includes(item.stateMutability)
      })
      const result = InterfaceGenerator.generate(nonReadOnlyAbi, contractName)
      expect(result).to.equal('')
    })
  })

  context('when ABI is empty', () => {
    it('returns an empty string', () => {
      const contractName = 'EmptyContract'
      const result = InterfaceGenerator.generate([], contractName)
      expect(result).to.equal('')
    })
  })

  context('when ABI has tuples in inputs', () => {
    const tupleInputAbi = [
      {
        type: 'function',
        name: 'getTuple',
        stateMutability: 'view',
        inputs: [
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'a', type: 'uint256' },
              { name: 'b', type: 'string' },
            ],
          },
        ],
        outputs: [{ name: 'result', type: 'bool' }],
      },
    ] as unknown as Record<string, never>[]

    it('generates tuple definitions and includes them in the interface', () => {
      const contractName = 'TupleContract'
      const result = InterfaceGenerator.generate(tupleInputAbi, contractName)

      expect(result).to.include('export class GetTupleDataTuple {')
      expect(result).to.include('a: BigInt;')
      expect(result).to.include('b: string;')
      expect(result).to.include('export function getTuple(data: GetTupleDataTuple): boolean;')
    })
  })

  context('when ABI has tuples in outputs', () => {
    const tupleOutputAbi = [
      {
        type: 'function',
        name: 'getComplexResult',
        stateMutability: 'view',
        inputs: [{ name: 'id', type: 'uint256' }],
        outputs: [
          {
            name: '',
            type: 'tuple',
            components: [
              { name: 'value', type: 'string' },
              { name: 'count', type: 'uint256' },
            ],
          },
        ],
      },
    ] as unknown as Record<string, never>[]

    it('generates tuple definitions and includes them in the interface', () => {
      const contractName = 'ComplexOutputContract'
      const result = InterfaceGenerator.generate(tupleOutputAbi, contractName)

      expect(result).to.include('export class GetComplexResultReturnTuple {')
      expect(result).to.include('value: string;')
      expect(result).to.include('count: BigInt;')
      expect(result).to.include('export function getComplexResult(id: BigInt): GetComplexResultReturnTuple;')
    })
  })
})
