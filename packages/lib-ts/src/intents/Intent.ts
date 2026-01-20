import { environment } from '../environment'
import { evm } from '../evm'
import { NULL_ADDRESS } from '../helpers'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt, Bytes, ChainId } from '../types'

export enum OperationType {
  Swap,
  Transfer,
  EvmCall,
  SvmCall,
}

const DEFAULT_DEADLINE = 5 * 60 // 5 minutes in seconds

/**
 * Base builder for creating intents.
 */
export abstract class IntentBuilder {
  protected user: Address | null = null
  protected settler: Address | null = null
  protected deadline: BigInt | null = null
  protected nonce: string | null = null
  protected maxFees: TokenAmount[] = []
  protected events: IntentEvent[] = []

  /**
   * Sets the settler address for this intent.
   * @param settler - The settler address as an Address instance
   * @returns This IntentBuilder instance for method chaining
   */
  addSettler(settler: Address): IntentBuilder {
    this.settler = settler
    return this
  }

  /**
   * Sets the settler address from a string.
   * @param settler - The settler address as a hex string
   * @returns This IntentBuilder instance for method chaining
   */
  addSettlerAsString(settler: string): IntentBuilder {
    return this.addSettler(Address.fromString(settler))
  }

  /**
   * Sets the deadline for this intent.
   * @param deadline - The deadline as a timestamp
   * @returns This IntentBuilder instance for method chaining
   */
  addDeadline(deadline: BigInt): IntentBuilder {
    this.deadline = deadline
    return this
  }

  /**
   * Sets the user address for this intent.
   * @param user - The user address
   * @returns This IntentBuilder instance for method chaining
   */
  addUser(user: Address): IntentBuilder {
    this.user = user
    return this
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This IntentBuilder instance for method chaining
   */
  addUserAsString(user: string): IntentBuilder {
    return this.addUser(Address.fromString(user))
  }

  /**
   * Sets the nonce for this intent.
   * @param nonce - The nonce to be set for the intent
   * @returns This IntentBuilder instance for method chaining
   */
  addNonce(nonce: string): IntentBuilder {
    this.nonce = nonce
    return this
  }

  /**
   * Sets an event for the intent.
   * @param topic - The topic to be indexed in the event
   * @param data - The event data
   * @returns This IntentBuilder instance for method chaining
   */
  addEvent(topic: Bytes, data: Bytes): IntentBuilder {
    const event = new IntentEvent(topic, data)
    this.events.push(event)
    return this
  }

  /**
   * Sets multiple events for the intent.
   * @param events - The list of events to be added
   * @returns This IntentBuilder instance for method chaining
   */
  addEvents(events: IntentEvent[]): IntentBuilder {
    for (let i = 0; i < events.length; i++) {
      this.events.push(events[i])
    }
    return this
  }

  /**
   * Adds a max fee for this intent.
   * @param fee - The max fee token amount (must be on same chain)
   * @returns This IntentBuilder instance for method chaining
   */
  abstract addMaxFee(fee: TokenAmount): IntentBuilder

  /**
   * Builds and returns the final intent.
   * @returns A new intent
   */
  abstract build(): Intent
}

/**
 * Represents an intent max fee.
 * Specifies the token address and the max amount to be paid for the intent.
 */
@json
export class MaxFee {
  token: string
  amount: string

  /**
   * Creates a MaxFee from a TokenAmount.
   * @param tokenAmount - The token amount to be used as max fee
   * @returns A new MaxFee instance
   */
  static fromTokenAmount(tokenAmount: TokenAmount): MaxFee {
    return new MaxFee(tokenAmount.token.address, tokenAmount.amount)
  }

  /**
   * Creates a MaxFee from a 32-bit integer amount.
   * @param token - The max fee token
   * @param amount - The max fee amount
   * @returns A new MaxFee instance
   */
  static fromI32(token: Token, amount: i32): MaxFee {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount))
  }

  /**
   * Creates a MaxFee from a BigInt amount.
   * @param token - The max fee token
   * @param amount - The max fee amount in the token's smallest unit
   * @returns A new MaxFee instance
   */
  static fromBigInt(token: Token, amount: BigInt): MaxFee {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount))
  }

  /**
   * Creates a MaxFee from a decimal string amount.
   * @param token - The max fee token
   * @param amount - The max fee amount as a decimal string
   * @returns A new MaxFee instance
   */
  static fromStringDecimal(token: Token, amount: string): MaxFee {
    return this.fromTokenAmount(TokenAmount.fromStringDecimal(token, amount))
  }

  /**
   * Creates a new MaxFee instance.
   * @param token - The max fee token address
   * @param amount - The max fee amount
   */
  constructor(token: Address, amount: BigInt) {
    this.token = token.toString()
    this.amount = amount.toString()
  }
}

/**
 * Represents an intent event.
 * Specifies the topic and data for the event. The topic is an indexed parameter for the EVM events.
 */
@json
export class IntentEvent {
  topic: string
  data: string

  /**
   * Creates a new Intent Event instance.
   * @param topic - the topic that is going to be index in the event
   * @param data - The event data
   */
  constructor(topic: Bytes, data: Bytes) {
    this.topic = topic.toHexString()
    this.data = data.toHexString()
  }
}

let INTENT_INDEX: u32 = 0
@json
export abstract class Intent {
  public op: OperationType
  public settler: string
  public user: string
  public deadline: string
  public nonce: string
  public maxFees: MaxFee[]
  public events: IntentEvent[]

  /**
   * Creates a new intent.
   * @param op - The type of intent to be created
   * @param chainId - The chain ID for fetch the settler
   * @param maxFees - The list of max fees to pay for the intent (optional)
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   */
  protected constructor(
    op: OperationType,
    chainId: ChainId,
    maxFees: MaxFee[] | null,
    settler: Address | null,
    user: Address | null,
    deadline: BigInt | null,
    nonce: string | null,
    events: IntentEvent[] | null
  ) {
    const context = environment.getContext()
    this.op = op
    this.maxFees = maxFees || []
    this.settler = settler ? settler.toString() : context.findSettler(chainId).toString()
    this.deadline = deadline ? deadline.toString() : (context.timestamp / 1000 + DEFAULT_DEADLINE).toString()
    this.user = user ? user.toString() : context.user.toString()
    this.events = events || []
    this.nonce = nonce
      ? nonce
      : evm.keccak(`${context.triggerSig}${context.timestamp}${context.trigger.data}${++INTENT_INDEX}`)

    if (!this.user || this.user == NULL_ADDRESS) throw new Error('A user must be specified')
    if (!this.settler || this.settler == NULL_ADDRESS) throw new Error('A settler contract must be specified')
  }

  /**
   * Sends this intent to the execution environment.
   */
  abstract send(): void
}
