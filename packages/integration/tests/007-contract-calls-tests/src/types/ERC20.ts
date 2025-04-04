import { Address, BigInt, environment } from '@mimicprotocol/lib-ts'

export class ERC20 {
  private address: Address
  private chainId: u64
  private timestamp: i64

  constructor(address: Address, chainId: u64, timestamp: Date | null = null) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp ? timestamp.getTime() : -1
  }

  name(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'name', [])
    return result
  }

  totalSupply(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'totalSupply', [])
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'decimals', [])
    return u8.parse(result)
  }

  balanceOf(_owner: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'balanceOf', [_owner])
    return BigInt.fromString(result)
  }

  symbol(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'symbol', [])
    return result
  }

  allowance(_owner: Address, _spender: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'allowance', [_owner, _spender])
    return BigInt.fromString(result)
  }
}
