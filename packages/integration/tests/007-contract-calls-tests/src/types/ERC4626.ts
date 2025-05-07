import { Address, BigInt, environment, EvmCallParam } from '@mimicprotocol/lib-ts'

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
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xdd62ed3e' +
        environment.evmEncode([EvmCallParam.fromValue('address', owner), EvmCallParam.fromValue('address', spender)])
    )
    return BigInt.fromString(result)
  }

  asset(): Address {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x38d52e0f')
    return Address.fromString(result)
  }

  balanceOf(account: Address): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x70a08231' + environment.evmEncode([EvmCallParam.fromValue('address', account)])
    )
    return BigInt.fromString(result)
  }

  convertToAssets(shares: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x07a2d13a' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    return BigInt.fromString(result)
  }

  convertToShares(assets: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc6e6f592' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x313ce567')
    return u8.parse(result)
  }

  maxDeposit(param0: Address): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x402d267d' + environment.evmEncode([EvmCallParam.fromValue('address', param0)])
    )
    return BigInt.fromString(result)
  }

  maxMint(param0: Address): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc63d75b6' + environment.evmEncode([EvmCallParam.fromValue('address', param0)])
    )
    return BigInt.fromString(result)
  }

  maxRedeem(owner: Address): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xd905777e' + environment.evmEncode([EvmCallParam.fromValue('address', owner)])
    )
    return BigInt.fromString(result)
  }

  maxWithdraw(owner: Address): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xce96cb77' + environment.evmEncode([EvmCallParam.fromValue('address', owner)])
    )
    return BigInt.fromString(result)
  }

  name(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x06fdde03')
    return result
  }

  previewDeposit(assets: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xef8b30f7' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    return BigInt.fromString(result)
  }

  previewMint(shares: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xb3d7f6b9' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    return BigInt.fromString(result)
  }

  previewRedeem(shares: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x4cdad506' + environment.evmEncode([EvmCallParam.fromValue('uint256', shares)])
    )
    return BigInt.fromString(result)
  }

  previewWithdraw(assets: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x0a28a477' + environment.evmEncode([EvmCallParam.fromValue('uint256', assets)])
    )
    return BigInt.fromString(result)
  }

  symbol(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x95d89b41')
    return result
  }

  totalAssets(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x01e1d114')
    return BigInt.fromString(result)
  }

  totalSupply(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x18160ddd')
    return BigInt.fromString(result)
  }
}
