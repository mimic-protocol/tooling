import { Address, BigInt, ChainId, environment, evm, EvmDecodeParam, EvmEncodeParam } from '@mimicprotocol/lib-ts'

export class ERC20 {
  private address: Address
  private chainId: ChainId
  private timestamp: Date | null

  constructor(address: Address, chainId: ChainId, timestamp: Date | null = null) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp
  }

  name(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x06fdde03')
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  totalSupply(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x18160ddd')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  decimals(): u8 {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x313ce567')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint8', response))
    return u8.parse(decodedResponse)
  }

  balanceOf(_owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x70a08231' + evm.encode([EvmEncodeParam.fromValue('address', _owner)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  symbol(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x95d89b41')
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  allowance(_owner: Address, _spender: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xdd62ed3e' +
        evm.encode([EvmEncodeParam.fromValue('address', _owner), EvmEncodeParam.fromValue('address', _spender)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }
}
