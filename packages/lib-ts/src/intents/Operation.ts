import { environment } from '../environment'
import { NULL_ADDRESS } from '../helpers'
import { Address, Bytes, ChainId } from '../types'

export enum OperationType {
  Swap,
  Transfer,
  EvmCall,
  SvmCall,
}

/**
 * Represents an operation event.
 * Specifies the topic and data for the event. The topic is an indexed parameter for the EVM events.
 */
@json
export class OperationEvent {
  topic: string
  data: string

  /**
   * Creates a new Operation Event instance.
   * @param topic - the topic that is going to be index in the event
   * @param data - The event data
   */
  constructor(topic: Bytes, data: Bytes) {
    this.topic = topic.toHexString()
    this.data = data.toHexString()
  }
}

/**
 * Base builder for creating operations.
 */
export abstract class OperationBuilder {
  protected user: Address | null = null
  protected events: OperationEvent[] = []

  abstract build(): Operation

  /**
   * Sets the user address for this intent.
   * @param user - The user address
   * @returns This OperationBuilder instance for method chaining
   */
  addUser(user: Address): OperationBuilder {
    this.user = user
    return this
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This OperationBuilder instance for method chaining
   */
  addUserAsString(user: string): OperationBuilder {
    return this.addUser(Address.fromString(user))
  }

  /**
   * Sets an event for the intent.
   * @param topic - The topic to be indexed in the event
   * @param data - The event data
   * @returns This OperationBuilder instance for method chaining
   */
  addEvent(topic: Bytes, data: Bytes): OperationBuilder {
    const event = new OperationEvent(topic, data)
    this.events.push(event)
    return this
  }

  /**
   * Sets multiple events for the intent.
   * @param events - The list of events to be added
   * @returns This OperationBuilder instance for method chaining
   */
  addEvents(events: OperationEvent[]): OperationBuilder {
    for (let i = 0; i < events.length; i++) {
      this.events.push(events[i])
    }
    return this
  }
}

@json
export abstract class Operation {
  public opType: OperationType
  public chainId: ChainId
  public user: string
  public events: OperationEvent[]

  /**
   * Creates a new operation.
   * @param opType - The type of operation to be created
   * @param chainId - The source chain id for the operation
   * @param user - The user address (optional)
   * @param events - The list of events for the operation (optional)
   */
  protected constructor(
    opType: OperationType,
    chainId: ChainId,
    user: Address | null,
    events: OperationEvent[] | null
  ) {
    const context = environment.getContext()
    this.opType = opType
    this.chainId = chainId
    this.user = user ? user.toString() : context.user.toString()
    this.events = events || []
    if (!this.user || this.user == NULL_ADDRESS) throw new Error('A user must be specified')
  }
}
