import { environment } from '../../environment'
import { TokenAmount } from '../../tokens'
import { Address, Bytes, ChainId } from '../../types'
import { SvmAccountMeta } from '../../types/svm/SvmAccountMeta'
import { IntentBuilder } from '../Intent'
import { Operation, OperationBuilder, OperationEvent, OperationType } from '../Operation'

/**
 * Builder for creating SVM Call intents with program call operations.
 * Allows chaining multiple calls and configuring fees and settlement parameters.
 */
export class SvmCallBuilder extends OperationBuilder {
  protected chainId: ChainId
  protected instructions: SvmInstruction[] = []

  /**
   * Creates a SvmCallBuilder for Solana mainnet.
   * @returns A new SvmCallBuilder instance
   */
  static forChain(): SvmCallBuilder {
    return new SvmCallBuilder()
  }

  /**
   * Creates a new SvmCallBuilder instance.
   */
  private constructor() {
    super()
    this.chainId = ChainId.SOLANA_MAINNET
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
   * Adds multiple instructions to the intent.
   * @param instructions - The instructions to add
   * @returns This SvmCallBuilder instance for method chaining
   */
  addInstructions(instructions: SvmInstruction[]): SvmCallBuilder {
    for (let i = 0; i < instructions.length; i++) this.addInstruction(instructions[i])
    return this
  }

  /**
   * Adds the instructions from another SvmCallBuilder to this SvmCallBuilder.
   * @param builder - The SvmCallBuilder to add the instructions from
   * @returns This SvmCallBuilder instance for method chaining
   */
  addInstructionsFromBuilder(builder: SvmCallBuilder): SvmCallBuilder {
    return this.addInstructions(builder.getInstructions())
  }

  /**
   * Adds the instructions from multiple SvmCallBuilders to this SvmCallBuilder.
   * @param builders - The SvmCallBuilders to add the instructions from
   * @returns This SvmCallBuilder instance for method chaining
   */
  addInstructionsFromBuilders(builders: SvmCallBuilder[]): SvmCallBuilder {
    for (let i = 0; i < builders.length; i++) this.addInstructionsFromBuilder(builders[i])
    return this
  }

  /**
   * Returns a copy of the instructions array.
   * @returns A copy of the instructions array
   */
  getInstructions(): SvmInstruction[] {
    return this.instructions.slice(0)
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
  addEvents(events: OperationEvent[]): SvmCallBuilder {
    return changetype<SvmCallBuilder>(super.addEvents(events))
  }

  /**
   * Builds and returns the final SvmCall intent.
   * @returns A new SvmCall instance with all configured parameters
   */
  build(): SvmCall {
    return new SvmCall(this.instructions, this.user, this.events)
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

export class SvmInstructionBuilder {
  protected programId: Address = Address.zero(32)
  protected accountsMeta: SvmAccountMeta[] = []
  protected data: Bytes = Bytes.empty()

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
    return new SvmInstruction(this.programId.toBase58String(), this.accountsMeta, this.data.toHexString())
  }
}

@json
export class SvmInstruction {
  constructor(
    public programId: string,
    public accountsMeta: SvmAccountMeta[],
    public data: string
  ) {}
}

/**
 * Represents a SVM Call intent containing one or more program calls to be executed.
 */
@json
export class SvmCall extends Operation {
  public instructions: SvmInstruction[]

  /**
   * Creates a new SvmCall intent.
   * @param instructions - Array of instructions to execute
   * @param maxFees - The list of max fees to pay for the call intent
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   */
  constructor(instructions: SvmInstruction[], user: Address | null = null, events: OperationEvent[] | null = null) {
    super(OperationType.SvmCall, ChainId.SOLANA_MAINNET, user, events)
    if (instructions.length === 0) throw new Error('Call list cannot be empty')
    this.instructions = instructions
  }

  /**
   * Sends this SvmCall intent to the execution environment.
   * @param maxFee - The max fee to pay for the intent
   * @param feePayer - The fee payer for the intent (optional)
   */
  public send(maxFee: TokenAmount, feePayer: Address | null = null): void {
    const intentBuilder = new IntentBuilder().addMaxFee(maxFee).addOperation(this)
    if (feePayer) intentBuilder.addFeePayer(feePayer)
    environment.sendIntent(intentBuilder.build())
  }
}
