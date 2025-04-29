import { Address, BigInt, CallParam, environment, evmEncode } from '@mimicprotocol/lib-ts'

export class ERC20 {
  private address: Address
  private chainId: u64
  private timestamp: Date | null

  constructor(address: Address, chainId: u64, timestamp: Date | null = null) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp
  }

  name(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x06fdde03', []))
    return result
  }

  totalSupply(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x18160ddd', []))
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x313ce567', []))
    return u8.parse(result)
  }

  balanceOf(_owner: Address): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0x70a08231', [new CallParam('address', _owner)])
    )
    return BigInt.fromString(result)
  }

  symbol(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x95d89b41', []))
    return result
  }

  allowance(_owner: Address, _spender: Address): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0xdd62ed3e', [new CallParam('address', _owner), new CallParam('address', _spender)])
    )
    return BigInt.fromString(result)
  }
}
