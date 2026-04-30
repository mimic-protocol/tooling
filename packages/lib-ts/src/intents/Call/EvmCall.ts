import { environment } from '../../environment'
import { TokenAmount } from '../../tokens'
import { Address, BigInt, Bytes, ChainId } from '../../types'
import { IntentBuilder } from '../Intent'
import { Operation, OperationBuilder, OperationEvent, OperationType } from '../Operation'

/**
 * Builder for creating EVM call operations.
 */
export class EvmCallBuilder extends OperationBuilder {
  protected chainId: ChainId
  protected calls: EvmCallData[] = []

  /**
   * Creates an EvmCallBuilder for the specified EVM blockchain network.
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
  private constructor(chainId: ChainId) {
    super()
    this.chainId = chainId
  }

  /**
   * Adds a contract call to the operation.
   * @param target - The contract address to call
   * @param data - The call data
   * @param value - The native token value to send
   * @returns This EvmCallBuilder instance for method chaining
   */
  addCall(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()): EvmCallBuilder {
    this.calls.push(new EvmCallData(target, data, value))
    return this
  }

  /**
   * Adds multiple contract calls to the operation.
   * @param calls - The contract calls to add
   * @returns This EvmCallBuilder instance for method chaining
   */
  addCalls(calls: EvmCallData[]): EvmCallBuilder {
    for (let i = 0; i < calls.length; i++)
      this.addCall(
        Address.fromString(calls[i].target),
        Bytes.fromHexString(calls[i].data),
        BigInt.fromString(calls[i].value)
      )
    return this
  }

  /**
   * Adds the calls from another EvmCallBuilder to this EvmCallBuilder.
   * @param builder - The EvmCallBuilder to add the calls from
   * @returns This EvmCallBuilder instance for method chaining
   */
  addCallsFromBuilder(builder: EvmCallBuilder): EvmCallBuilder {
    return this.addCalls(builder.getCalls())
  }

  /**
   * Adds the calls from multiple EvmCallBuilders to this EvmCallBuilder.
   * @param builders - The EvmCallBuilders to add the calls from
   * @returns This EvmCallBuilder instance for method chaining
   */
  addCallsFromBuilders(builders: EvmCallBuilder[]): EvmCallBuilder {
    for (let i = 0; i < builders.length; i++) this.addCallsFromBuilder(builders[i])
    return this
  }

  /**
   * Returns a copy of the calls array.
   * @returns A copy of the calls array
   */
  getCalls(): EvmCallData[] {
    return this.calls.slice(0)
  }

  /**
   * Sets the user address for this operation.
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
   * Sets an event for the operation.
   * @param topic - The topic to be indexed in the event
   * @param data - The event data
   * @returns This EvmCallBuilder instance for method chaining
   */
  addEvent(topic: Bytes, data: Bytes): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addEvent(topic, data))
  }

  /**
   * Sets multiple events for the operation.
   * @param events - The list of events to be added
   * @returns This EvmCallBuilder instance for method chaining
   */
  addEvents(events: OperationEvent[]): EvmCallBuilder {
    return changetype<EvmCallBuilder>(super.addEvents(events))
  }

  /**
   * Builds and returns the final EvmCall operation.
   * @returns A new EvmCall instance with all configured parameters
   */
  build(): EvmCall {
    return new EvmCall(this.chainId, this.calls, this.user, this.events)
  }

  /**
   * Builds this operation and sends it inside an intent with the provided fee data.
   * @param maxFee - The max fee to pay for the intent
   * @param feePayer - The fee payer for the intent (optional)
   */
  send(maxFee: TokenAmount, feePayer: Address | null = null): void {
    this.build().send(maxFee, feePayer)
  }
}

/**
 * Represents data for a single contract call within an EVM call operation.
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
   * @param data - The call data
   * @param value - The native token value to send
   */
  constructor(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()) {
    this.target = target.toString()
    this.data = data.toHexString()
    this.value = value.toString()
  }
}

/**
 * Represents an EVM call operation containing one or more contract calls to be executed.
 */
@json
export class EvmCall extends Operation {
  public calls: EvmCallData[]

  /**
   * Creates a new EvmCall operation.
   * @param chainId - The blockchain network identifier
   * @param calls - Array of contract calls to execute
   * @param user - The user address
   * @param events - The operation events to emit
   */
  constructor(
    chainId: ChainId,
    calls: EvmCallData[],
    user: Address | null = null,
    events: OperationEvent[] | null = null
  ) {
    super(OperationType.EvmCall, chainId, user, events)
    if (calls.length === 0) throw new Error('Call list cannot be empty')
    this.calls = calls
  }

  /**
   * Sends this EvmCall operation wrapped in an intent.
   * @param maxFee - The max fee to pay for the intent
   * @param feePayer - The fee payer for the intent (optional)
   */
  public send(maxFee: TokenAmount, feePayer: Address | null = null): void {
    const intentBuilder = new IntentBuilder().addMaxFee(maxFee).addOperation(this)
    if (feePayer) intentBuilder.addFeePayer(feePayer)
    environment.sendIntent(intentBuilder.build())
  }
}
