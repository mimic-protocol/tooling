import { environment } from '../../environment'
import { TokenAmount } from '../../tokens'
import { Address, BigInt, Bytes, ChainId } from '../../types'
import { SvmAccountMeta } from '../../types/svm/SvmAccountMeta'
import { Intent, IntentEvent, MaxFee, OperationType } from '../Intent'

import { CallBuilder } from './CallBuilder'

/**
 * Builder for creating SVM Call intents with program call operations.
 * Allows chaining multiple calls and configuring fees and settlement parameters.
 */
export class SvmCallBuilder extends CallBuilder {
  private instructions: SvmInstruction[] = []
  /**
   * Creates a new SvmCallBuilder instance.
   */
  constructor() {
    super(ChainId.SOLANA_MAINNET)
  }

  /**
   * Adds an instruction to the intent.
   * @param instruction - The instruction to add
   * @returns This SvmCallBuilder instance for method chaining
   */
  addInstruction(instruction: SvmInstruction): SvmCallBuilder {
    this.instructions.push(instruction)
    return this
  }

  /**
   * Sets the settler address for this intent.
   * @param settler - The settler address as an Address instance
   * @returns This SvmCallBuilder instance for method chaining
   */
  addSettler(settler: Address): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addSettler(settler))
  }

  /**
   * Sets the settler address from a string.
   * @param settler - The settler address as a hex string
   * @returns This SvmCallBuilder instance for method chaining
   */
  addSettlerAsString(settler: string): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addSettlerAsString(settler))
  }

  /**
   * Sets the deadline for this intent.
   * @param deadline - The deadline as a timestamp
   * @returns This SvmCallBuilder instance for method chaining
   */
  addDeadline(deadline: BigInt): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addDeadline(deadline))
  }

  /**
   * Sets the user address for this intent.
   * @param user - The user address
   * @returns This SvmCallBuilder instance for method chaining
   */
  addUser(user: Address): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addUser(user))
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This SvmCallBuilder instance for method chaining
   */
  addUserAsString(user: string): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addUserAsString(user))
  }

  /**
   * Sets the nonce for this intent.
   * @param nonce - A unique identifier to prevent replay attacks
   * @returns This SvmCallBuilder instance for method chaining
   */
  addNonce(nonce: string): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addNonce(nonce))
  }

  /**
   * Adds a max fee for this intent.
   * @param fee - The max fee token amount (must be on same chain)
   * @returns This SvmCallBuilder instance for method chaining
   */
  addMaxFee(fee: TokenAmount): SvmCallBuilder {
    if (!fee.token.hasChain(this.chainId)) throw new Error('Fee token must be on the same chain')
    this.maxFees.push(fee)
    return this
  }

  /**
   * Sets an event for the intent.
   * @param topic - The topic to be indexed in the event
   * @param data - The event data
   * @returns This SvmCallBuilder instance for method chaining
   */
  addEvent(topic: Bytes, data: Bytes): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addEvent(topic, data))
  }

  /**
   * Sets multiple events for the intent.
   * @param events - The list of events to be added
   * @returns This SvmCallBuilder instance for method chaining
   */
  addEvents(events: IntentEvent[]): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addEvents(events))
  }

  /**
   * Builds and returns the final SvmCall intent.
   * @returns A new SvmCall instance with all configured parameters
   */
  build(): SvmCall {
    return new SvmCall(this.instructions, this.maxFees, this.settler, this.user, this.deadline, this.nonce, this.events)
  }
}

export class SvmInstructionBuilder {
  private programId: Address = Address.zero(32)
  private accountsMeta: SvmAccountMeta[] = []
  private data: Bytes = Bytes.empty()

  setProgram(programId: Address): SvmInstructionBuilder {
    this.programId = programId
    return this
  }

  setAccounts(accountsMeta: SvmAccountMeta[]): SvmInstructionBuilder {
    this.accountsMeta = accountsMeta
    return this
  }

  setDataFromBytes(data: Bytes): SvmInstructionBuilder {
    this.data = data
    return this
  }

  setDataFromHex(data: string): SvmInstructionBuilder {
    return this.setDataFromBytes(Bytes.fromHexString(data))
  }

  instruction(): SvmInstruction {
    return new SvmInstruction(
      this.programId,
      this.accountsMeta,
      this.data
    )
  }
}

@json
export class SvmInstruction {
  constructor(
    public programId: Address,
    public accountsMeta: SvmAccountMeta[],
    public data: Bytes
  ) {}
}

/**
 * Represents a SVM Call intent containing one or more program calls to be executed.
 */
@json
export class SvmCall extends Intent {
  public chainId: ChainId
  public instructions: SvmInstruction[]

  /**
   * Creates a SvmCall intent with a single program call.
   * @param maxFee - The max fee to pay for the call intent
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   * @returns A new Call instance
   */
  static create(
    programId: Address,
    accountsMeta: SvmAccountMeta[],
    data: Bytes,
    maxFee: TokenAmount,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null,
    events: IntentEvent[] | null = null
  ): SvmCall {
    const instruction = new SvmInstruction(programId, accountsMeta, data)
    return new SvmCall([instruction], [maxFee], settler, user, deadline, nonce, events)
  }

  /**
   * Creates a new SvmCall intent.
   * @param instructions - Array of instructions to execute
   * @param maxFees - The list of max fees to pay for the call intent
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   */
  constructor(
    instructions: SvmInstruction[],
    maxFees: TokenAmount[],
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null,
    events: IntentEvent[] | null = null
  ) {
    const fees: MaxFee[] = maxFees.map((fee: TokenAmount) => MaxFee.fromTokenAmount(fee))
    super(OperationType.SvmCall, ChainId.SOLANA_MAINNET, fees, settler, user, deadline, nonce, events)
    if (instructions.length === 0) throw new Error('Call list cannot be empty')
    if (maxFees.length == 0) throw new Error('At least a max fee must be specified')

    this.instructions = instructions
    this.chainId = ChainId.SOLANA_MAINNET
  }

  /**
   * Sends this SvmCall intent to the execution environment.
   */
  public send(): void {
    environment.svmCall(this)
  }
}
