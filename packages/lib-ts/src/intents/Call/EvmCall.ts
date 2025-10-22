import { environment } from '../../environment'
import { TokenAmount } from '../../tokens'
import { Address, BigInt, Bytes, ChainId } from '../../types'
import { Intent, IntentBuilder, IntentEvent, MaxFee, OperationType } from '../Intent'

/**
 * Builder for creating EVM Call intents with contract call operations.
 * Allows chaining multiple contract calls and configuring fees and settlement parameters.
 */
export class EvmCallBuilder extends IntentBuilder {
  private chainId: ChainId
  private calls: EvmCallData[] = []

  /**
   * Creates a EvmCallBuilder for the specified EVM blockchain network.
   * @param chainId - The blockchain network identifier
   * @returns A new EvmCallBuilder instance
   */
  static forChain(chainId: ChainId): EvmCallBuilder {
    return new EvmCallBuilder(chainId)
  }

  /**
   * Creates a new EvmCallBuilder instance.
   * @param chainId - The EVM blockchain network identifier
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
   * @returns This EvmCallBuilder instance for method chaining
   */
  addCall(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()): EvmCallBuilder {
    this.calls.push(new EvmCallData(target, data, value))
    return this
  }

  /**
   * Sets the settler address for this intent.
   * @param settler - The settler address as an Address instance
   * @returns This EvmCallBuilder instance for method chaining
   */
  addSettler(settler: Address): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addSettler(settler))
  }

  /**
   * Sets the settler address from a string.
   * @param settler - The settler address as a hex string
   * @returns This EvmCallBuilder instance for method chaining
   */
  addSettlerAsString(settler: string): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addSettlerAsString(settler))
  }

  /**
   * Sets the deadline for this intent.
   * @param deadline - The deadline as a timestamp
   * @returns This EvmCallBuilder instance for method chaining
   */
  addDeadline(deadline: BigInt): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addDeadline(deadline))
  }

  /**
   * Sets the user address for this intent.
   * @param user - The user address
   * @returns This EvmCallBuilder instance for method chaining
   */
  addUser(user: Address): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addUser(user))
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This EvmCallBuilder instance for method chaining
   */
  addUserAsString(user: string): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addUserAsString(user))
  }

  /**
   * Sets the nonce for this intent.
   * @param nonce - A unique identifier to prevent replay attacks
   * @returns This EvmCallBuilder instance for method chaining
   */
  addNonce(nonce: string): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addNonce(nonce))
  }

  /**
   * Adds a max fee for this intent.
   * @param fee - The max fee token amount (must be on same chain)
   * @returns This EvmCallBuilder instance for method chaining
   */
  addMaxFee(fee: TokenAmount): EvmCallBuilder {
    if (!fee.token.hasChain(this.chainId)) throw new Error('Fee token must be on the same chain')
    this.maxFees.push(fee)
    return this
  }

  /**
   * Sets an event for the intent.
   * @param topic - The topic to be indexed in the event
   * @param data - The event data
   * @returns This EvmCallBuilder instance for method chaining
   */
  addEvent(topic: Bytes, data: Bytes): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addEvent(topic, data))
  }

  /**
   * Sets multiple events for the intent.
   * @param events - The list of events to be added
   * @returns This EvmCallBuilder instance for method chaining
   */
  addEvents(events: IntentEvent[]): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addEvents(events))
  }

  /**
   * Builds and returns the final EvmCall intent.
   * @returns A new EvmCall instance with all configured parameters
   */
  build(): EvmCall {
    return new EvmCall(
      this.chainId,
      this.calls,
      this.maxFees,
      this.settler,
      this.user,
      this.deadline,
      this.nonce,
      this.events
    )
  }
}

/**
 * Represents data for a single contract call within a Call intent.
 * Contains the target address, call data, and value to send.
 */
@json
export class EvmCallData {
  public target: string
  public data: string
  public value: string

  /**
   * Creates a new EvmCallData instance.
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
export class EvmCall extends Intent {
  public chainId: ChainId
  public calls: EvmCallData[]

  /**
   * Creates a EvmCall intent with a single contract call.
   * @param chainId - The blockchain network identifier
   * @param target - The contract address to call
   * @param data - The call data
   * @param maxFee - The max fee to pay for the call intent
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
    maxFee: TokenAmount,
    value: BigInt = BigInt.zero(),
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null,
    events: IntentEvent[] | null = null
  ): EvmCall {
    const callData = new EvmCallData(target, data, value)
    return new EvmCall(chainId, [callData], [maxFee], settler, user, deadline, nonce, events)
  }

  /**
   * Creates a new EvmCall intent.
   * @param chainId - The blockchain network identifier
   * @param calls - Array of contract calls to execute
   * @param maxFees - The list of max fees to pay for the call intent
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   */
  constructor(
    chainId: ChainId,
    calls: EvmCallData[],
    maxFees: TokenAmount[],
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null,
    events: IntentEvent[] | null = null
  ) {
    const fees: MaxFee[] = maxFees.map((fee: TokenAmount) => MaxFee.fromTokenAmount(fee))
    super(OperationType.EvmCall, chainId, fees, settler, user, deadline, nonce, events)
    if (calls.length === 0) throw new Error('Call list cannot be empty')
    if (maxFees.length == 0) throw new Error('At least a max fee must be specified')

    this.calls = calls
    this.chainId = chainId
  }

  /**
   * Sends this EvmCall intent to the execution environment.
   */
  public send(): void {
    environment.evmCall(this)
  }
}
