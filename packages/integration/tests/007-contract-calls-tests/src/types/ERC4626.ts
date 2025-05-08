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
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  asset(): Address {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x38d52e0f')
    const result = environment.evmDecode(new EvmDecodeParam('address', response))
    return Address.fromString(result)
  }

  balanceOf(account: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x70a08231' + environment.evmEncode([EvmCallParam.fromValue('address', account)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  convertToAssets(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x07a2d13a' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  convertToShares(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc6e6f592' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x313ce567')
    const result = environment.evmDecode(new EvmDecodeParam('uint8', response))
    return u8.parse(result)
  }

  maxDeposit(param0: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x402d267d' + environment.evmEncode([EvmCallParam.fromValue('address', param0)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  maxMint(param0: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc63d75b6' + environment.evmEncode([EvmCallParam.fromValue('address', param0)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  maxRedeem(owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xd905777e' + environment.evmEncode([EvmCallParam.fromValue('address', owner)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  maxWithdraw(owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xce96cb77' + environment.evmEncode([EvmCallParam.fromValue('address', owner)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  name(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x06fdde03')
    const result = environment.evmDecode(new EvmDecodeParam('string', response))
    return result
  }

  previewDeposit(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xef8b30f7' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  previewMint(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xb3d7f6b9' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  previewRedeem(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x4cdad506' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  previewWithdraw(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x0a28a477' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  symbol(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x95d89b41')
    const result = environment.evmDecode(new EvmDecodeParam('string', response))
    return result
  }

  totalAssets(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x01e1d114')
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }

  totalSupply(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x18160ddd')
    const result = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(result)
  }
}
