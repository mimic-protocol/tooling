import { Address, BigInt, environment, EvmCallParam, EvmDecodeParam } from '@mimicprotocol/lib-ts'

export class ERC4626 {
  private address: Address
  private chainId: u64
  private timestamp: Date | null

  constructor(address: Address, chainId: u64, timestamp: Date | null = null) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp
  }

  allowance(owner: Address, spender: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xdd62ed3e' +
        environment.evmEncode([EvmCallParam.fromValue('address', owner), EvmCallParam.fromValue('address', spender)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  asset(): Address {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x38d52e0f')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  balanceOf(account: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x70a08231' + environment.evmEncode([EvmCallParam.fromValue('address', account)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  convertToAssets(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x07a2d13a' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  convertToShares(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc6e6f592' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  decimals(): u8 {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x313ce567')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint8', response))
    return u8.parse(decodedResponse)
  }

  maxDeposit(param0: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x402d267d' + environment.evmEncode([EvmCallParam.fromValue('address', param0)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  maxMint(param0: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc63d75b6' + environment.evmEncode([EvmCallParam.fromValue('address', param0)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  maxRedeem(owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xd905777e' + environment.evmEncode([EvmCallParam.fromValue('address', owner)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  maxWithdraw(owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xce96cb77' + environment.evmEncode([EvmCallParam.fromValue('address', owner)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  name(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x06fdde03')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  previewDeposit(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xef8b30f7' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  previewMint(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xb3d7f6b9' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  previewRedeem(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x4cdad506' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  previewWithdraw(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x0a28a477' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  symbol(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x95d89b41')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  totalAssets(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x01e1d114')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  totalSupply(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x18160ddd')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }
}
