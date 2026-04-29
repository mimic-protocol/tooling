import { environment } from '../../environment'
import { evm } from '../../evm'
import { TokenAmount } from '../../tokens'
import { Address, BigInt, Bytes, ChainId, EvmEncodeParam } from '../../types'
import { IntentBuilder } from '../Intent'
import { Operation, OperationBuilder, OperationEvent, OperationType } from '../Operation'

export enum EvmDynamicArgKind {
  Literal = 0,
  Variable = 1,
}

/**
 * Builder for creating EVM dynamic call operations.
 */
export class EvmDynamicCallBuilder extends OperationBuilder {
  protected chainId: ChainId
  protected calls: EvmDynamicCallData[] = []

  /**
   * Creates an EvmDynamicCallBuilder for the specified EVM blockchain network.
   * @param chainId - The blockchain network identifier
   * @returns A new EvmDynamicCallBuilder instance
   */
  static forChain(chainId: ChainId): EvmDynamicCallBuilder {
    return new EvmDynamicCallBuilder(chainId)
  }

  /**
   * Creates a new EvmDynamicCallBuilder instance.
   * @param chainId - The EVM blockchain network identifier
   */
  private constructor(chainId: ChainId) {
    super()
    this.chainId = chainId
  }

  /**
   * Adds a dynamic contract call to the operation.
   * @param target - The contract address to call
   * @param selector - The function selector to call
   * @param args - The dynamic call arguments
   * @param value - The native token value to send
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addCall(
    target: Address,
    selector: Bytes,
    args: EvmDynamicArg[] = [],
    value: BigInt = BigInt.zero()
  ): EvmDynamicCallBuilder {
    this.calls.push(new EvmDynamicCallData(target, selector, args, value))
    return this
  }

  /**
   * Adds multiple dynamic contract calls to the operation.
   * @param calls - The contract calls to add
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addCalls(calls: EvmDynamicCallData[]): EvmDynamicCallBuilder {
    for (let i = 0; i < calls.length; i++) {
      this.addCall(
        Address.fromString(calls[i].target),
        Bytes.fromHexString(calls[i].selector),
        calls[i].arguments,
        BigInt.fromString(calls[i].value)
      )
    }
    return this
  }

  /**
   * Adds the calls from another EvmDynamicCallBuilder to this EvmDynamicCallBuilder.
   * @param builder - The EvmDynamicCallBuilder to add the calls from
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addCallsFromBuilder(builder: EvmDynamicCallBuilder): EvmDynamicCallBuilder {
    return this.addCalls(builder.getCalls())
  }

  /**
   * Adds the calls from multiple EvmDynamicCallBuilders to this EvmDynamicCallBuilder.
   * @param builders - The EvmDynamicCallBuilders to add the calls from
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addCallsFromBuilders(builders: EvmDynamicCallBuilder[]): EvmDynamicCallBuilder {
    for (let i = 0; i < builders.length; i++) this.addCallsFromBuilder(builders[i])
    return this
  }

  /**
   * Returns a copy of the calls array.
   * @returns A copy of the calls array
   */
  getCalls(): EvmDynamicCallData[] {
    return this.calls.slice(0)
  }

  /**
   * Sets the user address for this operation.
   * @param user - The user address
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addUser(user: Address): EvmDynamicCallBuilder {
    return changetype<EvmDynamicCallBuilder>(super.addUser(user))
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addUserAsString(user: string): EvmDynamicCallBuilder {
    return changetype<EvmDynamicCallBuilder>(super.addUserAsString(user))
  }

  /**
   * Sets an event for the operation.
   * @param topic - The topic to be indexed in the event
   * @param data - The event data
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addEvent(topic: Bytes, data: Bytes): EvmDynamicCallBuilder {
    return changetype<EvmDynamicCallBuilder>(super.addEvent(topic, data))
  }

  /**
   * Sets multiple events for the operation.
   * @param events - The list of events to be added
   * @returns This EvmDynamicCallBuilder instance for method chaining
   */
  addEvents(events: OperationEvent[]): EvmDynamicCallBuilder {
    return changetype<EvmDynamicCallBuilder>(super.addEvents(events))
  }

  /**
   * Builds and returns the final EvmDynamicCall operation.
   * @returns A new EvmDynamicCall instance with all configured parameters
   */
  build(): EvmDynamicCall {
    return new EvmDynamicCall(this.chainId, this.calls, this.user, this.events)
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
 * Represents a single dynamic argument in a dynamic call.
 */
@json
export class EvmDynamicArg {
  public kind: EvmDynamicArgKind
  public data: string
  public isDynamic: bool

  /**
   * Creates a literal dynamic argument from ABI-encoded parameters.
   * @param parameters - The ABI parameters to encode as a literal argument
   * @param isDynamic - Whether the resolved argument is ABI-dynamic
   * @returns A new literal dynamic argument
   */
  static literal(parameters: EvmEncodeParam[], isDynamic: bool): EvmDynamicArg {
    return new EvmDynamicArg(EvmDynamicArgKind.Literal, Bytes.fromHexString(evm.encode(parameters)), isDynamic)
  }

  /**
   * Creates a variable reference dynamic argument.
   * @param opIndex - The referenced operation index
   * @param subIndex - The referenced output index within the operation
   * @param isDynamic - Whether the resolved argument is ABI-dynamic
   * @returns A new variable dynamic argument
   */
  static variable(opIndex: u32, subIndex: u32, isDynamic: bool): EvmDynamicArg {
    return new EvmDynamicArg(
      EvmDynamicArgKind.Variable,
      Bytes.fromHexString(
        evm.encode([
          EvmEncodeParam.fromValue('uint256', BigInt.fromU32(opIndex)),
          EvmEncodeParam.fromValue('uint256', BigInt.fromU32(subIndex)),
        ])
      ),
      isDynamic
    )
  }

  /**
   * Creates a new EvmDynamicArg instance.
   * @param kind - The argument resolution strategy
   * @param data - The ABI-encoded argument data
   * @param isDynamic - Whether the resolved argument is ABI-dynamic
   */
  constructor(kind: EvmDynamicArgKind, data: Bytes, isDynamic: bool) {
    this.kind = kind
    this.data = data.toHexString()
    this.isDynamic = isDynamic
  }
}

/**
 * Represents data for a single dynamic contract call within an EVM dynamic call operation.
 */
@json
export class EvmDynamicCallData {
  public target: string
  public value: string
  public selector: string
  public arguments: EvmDynamicArg[]

  /**
   * Creates a new EvmDynamicCallData instance.
   * @param target - The contract address to call
   * @param selector - The function selector to call
   * @param args - The dynamic arguments for the call
   * @param value - The native token value to send
   */
  constructor(target: Address, selector: Bytes, args: EvmDynamicArg[] = [], value: BigInt = BigInt.zero()) {
    if (selector.length !== 4) throw new Error('Selector must be 4 bytes')
    this.target = target.toString()
    this.value = value.toString()
    this.selector = selector.toHexString()
    this.arguments = new Array<EvmDynamicArg>(args.length)
    for (let i = 0; i < args.length; i++) {
      const argument = args[i]
      this.arguments[i] = new EvmDynamicArg(argument.kind, Bytes.fromHexString(argument.data), argument.isDynamic)
    }
  }
}

/**
 * Represents an EVM dynamic call operation containing one or more dynamic contract calls.
 */
@json
export class EvmDynamicCall extends Operation {
  public calls: EvmDynamicCallData[]

  /**
   * Creates a new EvmDynamicCall operation.
   * @param chainId - The blockchain network identifier
   * @param calls - Array of dynamic contract calls to execute
   * @param user - The user address
   * @param events - The operation events to emit
   */
  constructor(
    chainId: ChainId,
    calls: EvmDynamicCallData[],
    user: Address | null = null,
    events: OperationEvent[] | null = null
  ) {
    super(OperationType.EvmDynamicCall, chainId, user, events)
    if (calls.length === 0) throw new Error('Call list cannot be empty')
    this.calls = calls
  }

  /**
   * Sends this EvmDynamicCall operation wrapped in an intent.
   * @param maxFee - The max fee to pay for the intent
   * @param feePayer - The fee payer for the intent (optional)
   */
  public send(maxFee: TokenAmount, feePayer: Address | null = null): void {
    const intentBuilder = new IntentBuilder().addMaxFee(maxFee).addOperation(this)
    if (feePayer) intentBuilder.addFeePayer(feePayer)
    environment.sendIntent(intentBuilder.build())
  }
}
