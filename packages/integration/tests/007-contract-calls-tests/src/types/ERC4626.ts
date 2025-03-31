import { Address, BigInt, environment } from '@mimicprotocol/lib-ts'

export class ERC4626 {
  private address: Address
  private chainId: u64
  private blockNumber: BigInt

  constructor(address: Address, chainId: u64) {
    this.address = address
    this.chainId = chainId
    this.blockNumber = environment.getCurrentBlockNumber(chainId)
  }

  allowance(owner: Address, spender: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'allowance', [owner, spender])
    return BigInt.fromString(result)
  }

  asset(): Address {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'asset', [])
    return Address.fromString(result)
  }

  balanceOf(account: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'balanceOf', [account])
    return BigInt.fromString(result)
  }

  convertToAssets(shares: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'convertToAssets', [shares.toBytes()])
    return BigInt.fromString(result)
  }

  convertToShares(assets: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'convertToShares', [assets.toBytes()])
    return BigInt.fromString(result)
  }

  decimals(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'decimals', [])
    return u8.parse(result)
  }

  maxDeposit(param0: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'maxDeposit', [param0])
    return BigInt.fromString(result)
  }

  maxMint(param0: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'maxMint', [param0])
    return BigInt.fromString(result)
  }

  maxRedeem(owner: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'maxRedeem', [owner])
    return BigInt.fromString(result)
  }

  maxWithdraw(owner: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'maxWithdraw', [owner])
    return BigInt.fromString(result)
  }

  name(): string {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'name', [])
    return result
  }

  previewDeposit(assets: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'previewDeposit', [assets.toBytes()])
    return BigInt.fromString(result)
  }

  previewMint(shares: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'previewMint', [shares.toBytes()])
    return BigInt.fromString(result)
  }

  previewRedeem(shares: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'previewRedeem', [shares.toBytes()])
    return BigInt.fromString(result)
  }

  previewWithdraw(assets: BigInt): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'previewWithdraw', [assets.toBytes()])
    return BigInt.fromString(result)
  }

  symbol(): string {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'symbol', [])
    return result
  }

  totalAssets(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'totalAssets', [])
    return BigInt.fromString(result)
  }

  totalSupply(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'totalSupply', [])
    return BigInt.fromString(result)
  }

}