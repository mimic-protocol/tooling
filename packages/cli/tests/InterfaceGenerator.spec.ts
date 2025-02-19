/* eslint-disable no-secrets/no-secrets */
import { expect } from 'chai'

import InterfaceGenerator from '../src/InterfaceGenerator'

import ERC20 from './fixtures/abis/ERC20.json'

const erc20Abi = ERC20 as unknown as Record<string, never>[]

describe('InterfaceGenerator', () => {
  context('when ABI contains read-only functions', () => {
    it('generates an interface with only view and pure functions', () => {
      const result = InterfaceGenerator.generate(erc20Abi, 'MyERC20')

      expect(result).to.include(`
export class MyERC20 {
  address: Address;
  chainId: u64;

  constructor(address: Address, chainId: u64) {
    this.address = address;
    this.chainId = chainId;
  }`)

      expect(result).to.include(`
  name(): string {
    const result = myerc20.name(JSON.stringify(new MyERC20NameParams(this.address, this.chainId)));
    return result;
  }`)

      expect(result).to.include(`
  balanceOf(_owner: Address): BigInt {
    const result = myerc20.balanceOf(JSON.stringify(new MyERC20BalanceOfParams(this.address, this.chainId, _owner)));
    return BigInt.fromString(result);
  }`)

      expect(result).to.not.include('transfer')
      expect(result).to.not.include('approve')
    })
  })

  context('when ABI contains only non read-only functions', () => {
    it('returns an empty string', () => {
      const nonReadOnlyAbi = erc20Abi.filter((item) => !['view', 'pure'].includes(item.stateMutability))
      const result = InterfaceGenerator.generate(nonReadOnlyAbi, 'MyERC20')
      expect(result).to.equal('')
    })
  })

  context('when ABI is empty', () => {
    it('returns an empty string', () => {
      const result = InterfaceGenerator.generate([], 'EmptyContract')
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

    it('generates interface with tuple parameters as unknown', () => {
      const contractName = 'TupleContract'
      const result = InterfaceGenerator.generate(tupleInputAbi, contractName)

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

  context('when generating parameter classes', () => {
    it('generates correct parameter classes structure', () => {
      const result = InterfaceGenerator.generate(erc20Abi, 'MyERC20')

      expect(result).to.include(`
@json
class MyERC20BaseParams {
  address: string;
  chain_id: u64;

  constructor(address: Address, chainId: u64) {
    this.address = address.toHexString();
    this.chain_id = chainId;
  }
}`)

      expect(result).to.include(`
@json
class MyERC20BalanceOfParams extends MyERC20BaseParams {
  _owner: string;

  constructor(address: Address, chainId: u64, _owner: Address) {
    super(address, chainId);
    this._owner = _owner.toHexString();
  }
}`)

      expect(result).to.include(`
@json
class MyERC20TotalSupplyParams extends MyERC20BaseParams {

  constructor(address: Address, chainId: u64) {
    super(address, chainId);
  }
}`)
    })
  })

  context('when generating namespace', () => {
    it('generates correct namespace structure', () => {
      const result = InterfaceGenerator.generate(erc20Abi, 'MyERC20')

      expect(result).to.include(`
declare namespace myerc20 {
  export function name(params: string): string;
  export function totalSupply(params: string): string;
  export function decimals(params: string): string;
  export function balanceOf(params: string): string;
  export function symbol(params: string): string;
  export function allowance(params: string): string;
}`)
    })
  })

  context('when generating imports', () => {
    it('includes required imports', () => {
      const result = InterfaceGenerator.generate(erc20Abi, 'MyERC20')

      expect(result).to.include(`import { Address, BigInt, JSON } from '@mimicprotocol/lib-ts'`)
    })
  })
})
