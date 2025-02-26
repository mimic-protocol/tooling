import { Address } from './Address'

export class Token {
  private _symbol: string
  private _address: Address
  private _chainId: u64
  private _decimals: u8

  constructor(symbol: string, address: Address, chainId: u64, decimals: u8) {
    this._symbol = symbol
    this._address = address.clone()
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
}
