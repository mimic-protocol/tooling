import { Address, BigInt, environment, EvmCallParam, EvmDecodeParam } from '@mimicprotocol/lib-ts'

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
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x06fdde03')
    const result = environment.evmDecode(new EvmDecodeParam('string', response))
    return result
  }

  totalSupply(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x18160ddd')
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x313ce567')
    const result = environment.evmDecode(new EvmDecodeParam('uint8', response))
    return u8.parse(result)
  }

  balanceOf(_owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x70a08231' + environment.evmEncode([EvmCallParam.fromValue('address', _owner)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  symbol(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x95d89b41')
    const result = environment.evmDecode(new EvmDecodeParam('string', response))
    return result
  }

  allowance(_owner: Address, _spender: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xdd62ed3e' +
        environment.evmEncode([EvmCallParam.fromValue('address', _owner), EvmCallParam.fromValue('address', _spender)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }
}
