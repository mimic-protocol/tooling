import { Address, BigInt, environment } from '@mimicprotocol/lib-ts'

export class ERC20 {
  private address: Address
  private chainId: u64
  private blockNumber: BigInt

  constructor(address: Address, chainId: u64) {
    this.address = address
    this.chainId = chainId
    this.blockNumber = environment.getCurrentBlockNumber(chainId)
  }

  name(): string {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'name', [])
    return result
  }

  totalSupply(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'totalSupply', [])
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'decimals', [])
    return u8.parse(result)
  }

  balanceOf(_owner: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'balanceOf', [_owner])
    return BigInt.fromString(result)
  }

  symbol(): string {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'symbol', [])
    return result
  }

  allowance(_owner: Address, _spender: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'allowance', [
      _owner,
      _spender,
    ])
    return BigInt.fromString(result)
  }
}
