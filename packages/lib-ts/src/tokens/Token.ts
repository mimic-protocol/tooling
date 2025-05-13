import { environment } from '../environment'
import { join, NATIVE_ADDRESS, parseCSV, Serializable, serialize, STANDARD_DECIMALS } from '../helpers'
import { Address, EvmDecodeParam } from '../types'

export class Token implements Serializable {
  public static readonly EMPTY_DECIMALS: u8 = u8.MAX_VALUE
  public static readonly EMPTY_SYMBOL: string = ''
  private static readonly SERIALIZED_PREFIX: string = 'Token'
  private _symbol: string
  private _address: Address
  private _chainId: u64
  private _decimals: u8
  private _timestamp: Date | null = null

  static native(chainId: u64): Token {
    if (chainId === 1) return new Token(NATIVE_ADDRESS, chainId, STANDARD_DECIMALS, 'ETH')
    throw new Error(`Unsupported chainId: ${chainId}`)
  }

  static parse(serialized: string): Token {
    const isToken = serialized.startsWith(`${Token.SERIALIZED_PREFIX}(`) && serialized.endsWith(')')
    if (!isToken) throw new Error('Invalid serialized token')

    const elements = parseCSV(serialized.slice(Token.SERIALIZED_PREFIX.length + 1, -1))
    const areNull = elements.some((element) => element === null)
    if (areNull) throw new Error('Invalid serialized token')

    const address = elements[0]!
    const chainId = u64.parse(elements[1]!)

    return new Token(address, chainId)
  }

  constructor(
    address: string,
    chainId: u64,
    decimals: u8 = Token.EMPTY_DECIMALS,
    symbol: string = Token.EMPTY_SYMBOL,
    timestamp: Date | null = null
  ) {
    this._symbol = symbol
    this._address = Address.fromString(address)
    this._chainId = chainId
    this._decimals = decimals
    this._timestamp = timestamp
  }

  get symbol(): string {
    if (this._symbol === Token.EMPTY_SYMBOL) {
      const response = environment.contractCall(this.address, this.chainId, this._timestamp, '0x95d89b41')
      this._symbol = environment.evmDecode(new EvmDecodeParam('string', response))
    }
    return this._symbol
  }

  get address(): Address {
    return this._address.clone()
  }

  get chainId(): u64 {
    return this._chainId
  }

  get decimals(): u8 {
    if (this._decimals == Token.EMPTY_DECIMALS) {
      const result = environment.contractCall(this.address, this.chainId, this._timestamp, '0x313ce567')
      this._decimals = u8.parse(environment.evmDecode(new EvmDecodeParam('uint256', result)))
    }
    return this._decimals
  }

  set decimals(value: u8) {
    this._decimals = value
  }

  set symbol(value: string) {
    this._symbol = value
  }

  set timestamp(value: Date) {
    this._timestamp = value
  }

  equals(other: Token): boolean {
    const isSameChain = this.chainId === other.chainId
    const isSameAddress = this.address.equals(other.address)
    return isSameChain && isSameAddress
  }

  toString(): string {
    return this.symbol
  }

  serialize(): string {
    return `${Token.SERIALIZED_PREFIX}(${join([serialize(this.address), serialize(this.chainId)])})`
  }
}
