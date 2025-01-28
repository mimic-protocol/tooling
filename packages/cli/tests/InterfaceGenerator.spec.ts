import { expect } from 'chai'

import { generateAbiInterface } from '../src/InterfaceGenerator'

describe('generateAbiInterface', () => {
  const sampleAbi = [
    {
      type: 'function',
      name: 'getValue',
      stateMutability: 'view',
      inputs: [{ name: 'id', type: 'uint256' }],
      outputs: [{ name: 'value', type: 'string' }],
    },
    {
      type: 'function',
      name: 'setValue',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'id', type: 'uint256' },
        { name: 'value', type: 'string' },
      ],
      outputs: [],
    },
  ] as unknown as Record<string, never>[]

  context('when ABI contains read-only functions', () => {
    it('generates an interface with only view and pure functions', () => {
      const contractName = 'MyContract'
      const result = generateAbiInterface(sampleAbi, contractName)

      expect(result).to.include('export declare namespace MyContract {')
      expect(result).to.include('export function getValue(id: BigInt): string;')
      expect(result).to.not.include('export function setValue(id: BigInt, value: string): void;')
    })
  })

  context('when ABI contains no read-only functions', () => {
    it('returns an empty string', () => {
      const contractName = 'MyContract'
      const result = generateAbiInterface(
        sampleAbi.filter((item) => item.stateMutability !== 'view' && item.stateMutability !== 'pure'),
        contractName
      )

      expect(result).to.equal('')
    })
  })

  context('when ABI is empty', () => {
    it('returns an empty string', () => {
      const contractName = 'EmptyContract'
      const result = generateAbiInterface([], contractName)

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
      const result = generateAbiInterface(tupleInputAbi, contractName)

      expect(result).to.include('export class getTuple_data_Tuple {')
      expect(result).to.include('a: BigInt;')
      expect(result).to.include('b: string;')
      expect(result).to.include('export function getTuple(data: getTuple_data_Tuple): boolean;')
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
      const result = generateAbiInterface(tupleOutputAbi, contractName)

      expect(result).to.include('export class getComplexResult_Return_Tuple {')
      expect(result).to.include('value: string;')
      expect(result).to.include('count: BigInt;')
      expect(result).to.include('export function getComplexResult(id: BigInt): getComplexResult_Return_Tuple;')
    })
  })
})
