import { Address, BigInt, environment } from '@mimicprotocol/lib-ts'

export class ERC4626 {
  private address: Address
  private chainId: u64
  private timestamp: i64

  constructor(address: Address, chainId: u64, timestamp: Date | null = null) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp ? timestamp.getTime() / 1000 : -1
  }

  allowance(owner: Address, spender: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'allowance', [owner, spender])
    return BigInt.fromString(result)
  }

  asset(): Address {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'asset', [])
    return Address.fromString(result)
  }

  balanceOf(account: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'balanceOf', [account])
    return BigInt.fromString(result)
  }

  convertToAssets(shares: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'convertToAssets', [
      shares.toBytes(),
    ])
    return BigInt.fromString(result)
  }

  convertToShares(assets: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'convertToShares', [
      assets.toBytes(),
    ])
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'decimals', [])
    return u8.parse(result)
  }

  maxDeposit(param0: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'maxDeposit', [param0])
    return BigInt.fromString(result)
  }

  maxMint(param0: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'maxMint', [param0])
    return BigInt.fromString(result)
  }

  maxRedeem(owner: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'maxRedeem', [owner])
    return BigInt.fromString(result)
  }

  maxWithdraw(owner: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'maxWithdraw', [owner])
    return BigInt.fromString(result)
  }

  name(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'name', [])
    return result
  }

  previewDeposit(assets: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'previewDeposit', [
      assets.toBytes(),
    ])
    return BigInt.fromString(result)
  }

  previewMint(shares: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'previewMint', [
      shares.toBytes(),
    ])
    return BigInt.fromString(result)
  }

  previewRedeem(shares: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'previewRedeem', [
      shares.toBytes(),
    ])
    return BigInt.fromString(result)
  }

  previewWithdraw(assets: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'previewWithdraw', [
      assets.toBytes(),
    ])
    return BigInt.fromString(result)
  }

  symbol(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'symbol', [])
    return result
  }

  totalAssets(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'totalAssets', [])
    return BigInt.fromString(result)
  }

  totalSupply(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'totalSupply', [])
    return BigInt.fromString(result)
  }
}
