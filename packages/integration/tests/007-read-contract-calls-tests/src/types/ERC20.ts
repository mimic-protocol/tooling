import {
  Address,
  BigInt,
  Bytes,
  CallBuilder,
  ChainId,
  environment,
  evm,
  EvmDecodeParam,
  EvmEncodeParam,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

export class ERC20 {
  private address: Address
  private chainId: ChainId
  private timestamp: Date | null
  private feeTokenAmount: TokenAmount | null

  constructor(
    address: Address,
    chainId: ChainId,
    timestamp: Date | null = null,
    feeTokenAmount: TokenAmount | null = null
  ) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp
    this.feeTokenAmount = feeTokenAmount
  }

  name(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x06fdde03')
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  approve(_spender: Address, _value: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x095ea7b3' +
        evm.encode([EvmEncodeParam.fromValue('address', _spender), EvmEncodeParam.fromValue('uint256', _value)])
    )
    return CallBuilder.fromTokenAmountAndChain(changetype<TokenAmount>(this.feeTokenAmount), this.chainId).addCall(
      this.address,
      encodedData
    )
  }

  totalSupply(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x18160ddd')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  transferFrom(_from: Address, _to: Address, _value: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x23b872dd' +
        evm.encode([
          EvmEncodeParam.fromValue('address', _from),
          EvmEncodeParam.fromValue('address', _to),
          EvmEncodeParam.fromValue('uint256', _value),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(changetype<TokenAmount>(this.feeTokenAmount), this.chainId).addCall(
      this.address,
      encodedData
    )
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

  transfer(_to: Address, _value: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xa9059cbb' + evm.encode([EvmEncodeParam.fromValue('address', _to), EvmEncodeParam.fromValue('uint256', _value)])
    )
    return CallBuilder.fromTokenAmountAndChain(changetype<TokenAmount>(this.feeTokenAmount), this.chainId).addCall(
      this.address,
      encodedData
    )
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
