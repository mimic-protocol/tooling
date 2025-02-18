import { expect } from 'chai'

import InterfaceGenerator from '../src/InterfaceGenerator'

import ERC20 from './fixtures/abis/ERC20.json'

const erc20Abi = ERC20 as unknown as Record<string, never>[]

describe('InterfaceGenerator', () => {
  context('when ABI contains read-only functions', () => {
    it('generates an interface with only view and pure functions', () => {
      const contractName = 'MyERC20'
      const result = InterfaceGenerator.generate(erc20Abi, contractName)

      expect(result).to.include(`export class ${contractName} {`)
      expect(result).to.not.include(`static load(address: Address, chainId: u64): ${contractName};`)

      expect(result).to.include('name(')
      expect(result).to.include('symbol(')
      expect(result).to.include('decimals(')
      expect(result).to.include('totalSupply(')
      expect(result).to.include('balanceOf(')
      expect(result).to.not.include('transfer(')
    })
  })

  context('when ABI contains only non read-only functions', () => {
    it('generates an interface with only a constructor and no view/pure methods', () => {
      const contractName = 'MyERC20'
      const nonReadOnlyAbi = erc20Abi.filter((item: any) => {
        return !['view', 'pure'].includes(item.stateMutability)
      })
      const result = InterfaceGenerator.generate(nonReadOnlyAbi, contractName)

      expect(result).to.include(`export class ${contractName} {`)
      expect(result).to.include('constructor(address: Address, chainId: u64) {')
      expect(result).to.not.match(/}\s+\w+\(/)
    })
  })

  context('when ABI is empty', () => {
    it('generates an interface with an empty namespace and a contract with only a constructor', () => {
      const contractName = 'EmptyContract'
      const result = InterfaceGenerator.generate([], contractName)

      expect(result).to.include(`declare namespace ${contractName.toLowerCase()} {`)
      expect(result).to.include(`export class ${contractName} {`)
      expect(result).to.include('constructor(address: Address, chainId: u64) {')
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

    it('generates interface with tuple parameters as unknown', () => {
      const contractName = 'TupleContract'
      const result = InterfaceGenerator.generate(tupleInputAbi, contractName)

      console.log(result)

      expect(result).to.include('getTuple(data: unknown): boolean')
      expect(result).to.not.include('export class GetTupleDataTuple {')
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

    it('generates interface with tuple outputs as unknown', () => {
      const contractName = 'ComplexOutputContract'
      const result = InterfaceGenerator.generate(tupleOutputAbi, contractName)

      expect(result).to.include('getComplexResult(id: BigInt): unknown')
      expect(result).to.not.include('export class GetComplexResultReturnTuple {')
    })
  })
})
