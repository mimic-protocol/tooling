import { environment } from '../environment'
import { TokenAmount } from '../tokens'
import { ChainId } from '../types'
import { Address, BigInt, Bytes } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

/**
 * Builder for creating Call intents with contract call operations.
 * Allows chaining multiple contract calls and configuring fees and settlement parameters.
 */
export class CallBuilder extends IntentBuilder {
  private chainId: ChainId
  private calls: CallData[] = []
  private fee: TokenAmount | null = null

  /**
   * Creates a CallBuilder for the specified blockchain network.
   * @param chainId - The blockchain network identifier
   * @returns A new CallBuilder instance
   */
  static forChain(chainId: ChainId): CallBuilder {
    return new CallBuilder(chainId)
  }

  /**
   * Creates a CallBuilder with a pre-configured fee.
   * @param chainId - The blockchain network identifier
   * @param fee - The fee token amount to be charged for the call
   * @returns A new CallBuilder instance with fee already set
   */
  static forChainWithFee(chainId: ChainId, fee: TokenAmount): CallBuilder {
    const builder = new CallBuilder(chainId)
    builder.addFee(fee)
    return builder
  }

  /**
   * Creates a new CallBuilder instance.
   * @param chainId - The blockchain network identifier
   */
  constructor(chainId: ChainId) {
    super()
    this.chainId = chainId
  }

  /**
   * Adds a contract call to the intent.
   * @param target - The contract address to call
   * @param data - The call data (optional, defaults to empty bytes)
   * @param value - The native token value to send (optional, defaults to zero)
   * @returns This CallBuilder instance for method chaining
   */
  addCall(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()): CallBuilder {
    this.calls.push(new CallData(target, data, value))
    return this
  }

  /**
   * Sets the fee to be charged for executing this call intent.
   * @param fee - The fee token amount (must be on the same chain as the call)
   * @returns This CallBuilder instance for method chaining
   */
  addFee(fee: TokenAmount): CallBuilder {
    if (fee.token.chainId !== this.chainId) throw new Error('Fee token must be on the same chain')
    this.fee = fee
    return this
  }

  /**
   * Sets the settler address for this intent.
   * @param settler - The settler address as an Address instance
   * @returns This CallBuilder instance for method chaining
   */
  addSettler(settler: Address): CallBuilder {
    return changetype<CallBuilder>(super.addSettler(settler))
  }

  /**
   * Sets the settler address from a string.
   * @param settler - The settler address as a hex string
   * @returns This CallBuilder instance for method chaining
   */
  addSettlerAsString(settler: string): CallBuilder {
    return changetype<CallBuilder>(super.addSettlerAsString(settler))
  }

  /**
   * Sets the deadline for this intent.
   * @param deadline - The deadline as a timestamp
   * @returns This CallBuilder instance for method chaining
   */
  addDeadline(deadline: BigInt): CallBuilder {
    return changetype<CallBuilder>(super.addDeadline(deadline))
  }

  /**
   * Sets the user address for this intent.
   * @param user - The user address
   * @returns This CallBuilder instance for method chaining
   */
  addUser(user: Address): CallBuilder {
    return changetype<CallBuilder>(super.addUser(user))
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This CallBuilder instance for method chaining
   */
  addUserAsString(user: string): CallBuilder {
    return changetype<CallBuilder>(super.addUserAsString(user))
  }

  /**
   * Sets the nonce for this intent.
   * @param nonce - A unique identifier to prevent replay attacks
   * @returns This CallBuilder instance for method chaining
   */
  addNonce(nonce: string): CallBuilder {
    return changetype<CallBuilder>(super.addNonce(nonce))
  }

  /**
   * Builds and returns the final Call intent.
   * @returns A new Call instance with all configured parameters
   */
  build(): Call {
    if (!this.fee) throw new Error('Call fee must be specified')
    return new Call(
      this.chainId,
      this.calls,
      this.fee as TokenAmount,
      this.settler,
      this.user,
      this.deadline,
      this.nonce
    )
  }
}

/**
 * Represents data for a single contract call within a Call intent.
 * Contains the target address, call data, and value to send.
 */
@json
export class CallData {
  public target: string
  public data: string
  public value: string

  /**
   * Creates a new CallData instance.
   * @param target - The contract address to call
   * @param data - The call data (optional, defaults to empty bytes)
   * @param value - The native token value to send (optional, defaults to zero)
   */
  constructor(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()) {
    this.target = target.toString()
    this.data = data.toHexString()
    this.value = value.toString()
  }
}

/**
 * Represents a Call intent containing one or more contract calls to be executed.
 */
@json
export class Call extends Intent {
  public chainId: ChainId
  public calls: CallData[]
  public feeToken: string
  public feeAmount: string

  /**
   * Creates a Call intent with a single contract call.
   * @param chainId - The blockchain network identifier
   * @param target - The contract address to call
   * @param data - The call data
   * @param fee - The fee token amount to be charged
   * @param value - The native token value to send (optional, defaults to zero)
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   * @returns A new Call instance
   */
  static create(
    chainId: ChainId,
    target: Address,
    data: Bytes,
    fee: TokenAmount,
    value: BigInt = BigInt.zero(),
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ): Call {
    const callData = new CallData(target, data, value)
    return new Call(chainId, [callData], fee, settler, user, deadline, nonce)
  }

  /**
   * Creates a new Call intent.
   * @param chainId - The blockchain network identifier
   * @param calls - Array of contract calls to execute
   * @param fee - The fee token amount to be charged
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   */
  constructor(
    chainId: ChainId,
    calls: CallData[],
    fee: TokenAmount,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ) {
    super(OperationType.Call, chainId, settler, user, deadline, nonce)

    if (calls.length === 0) throw new Error('Call list cannot be empty')

    this.calls = calls
    this.feeToken = fee.token.address.toString()
    this.feeAmount = fee.amount.toString()
    this.chainId = chainId
  }

  /**
   * Sends this Call intent to the execution environment.
   */
  public send(): void {
    environment.call(this)
  }
}
