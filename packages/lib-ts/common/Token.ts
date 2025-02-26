import { Address } from './Address'

export class Token {
  private symbol: string
  private address: Address
  private chainId: u64
  private decimals: u8

  constructor(symbol: string, address: Address, chainId: u64, decimals: u8) {
    this.symbol = symbol
    this.address = address.clone()
    this.chainId = chainId
    this.decimals = decimals
  }

  getSymbol(): string {
    return this.symbol
  }

  getAddress(): Address {
    return this.address.clone()
  }

  getChainId(): u64 {
    return this.chainId
  }

  getDecimals(): u8 {
    return this.decimals
  }
}
