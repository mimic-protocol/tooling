import { Address } from '../common'
import { NATIVE_ADDRESS, STANDARD_DECIMALS } from '../constants'

export class Token {
  private _symbol: string
  private _address: Address
  private _chainId: u64
  private _decimals: u8

  static native(chainId: u64): Token {
    if (chainId === 1) return new Token('ETH', NATIVE_ADDRESS, chainId, STANDARD_DECIMALS)
    throw new Error(`Unsupported chainId: ${chainId}`)
  }

  constructor(symbol: string, address: string, chainId: u64, decimals: u8) {
    this._symbol = symbol
    this._address = Address.fromString(address)
    this._chainId = chainId
    this._decimals = decimals
  }

  get symbol(): string {
    return this._symbol
  }

  get address(): Address {
    return this._address.clone()
  }

  get chainId(): u64 {
    return this._chainId
  }

  get decimals(): u8 {
    return this._decimals
  }

  equals(other: Token): boolean {
    const isSameChain = this.chainId === other.chainId
    const isSameAddress = this.address.equals(other.address)
    return isSameChain && isSameAddress
  }

  toString(): string {
    return this.symbol
  }
}
