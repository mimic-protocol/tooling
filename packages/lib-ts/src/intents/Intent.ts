import { environment } from '../environment'
import { evm } from '../evm'
import { NULL_ADDRESS } from '../helpers'
import { BlockchainToken, Token, TokenAmount } from '../tokens'
import { Address, BigInt, Bytes, ChainId } from '../types'
import { SvmAccountMeta } from '../types/svm/SvmAccountMeta'

import { EvmCall, EvmCallData } from './Call/EvmCall'
import { SvmCall, SvmInstruction } from './Call/SvmCall'
import { Operation, OperationBuilder, OperationEvent } from './Operation'
import { Swap, SwapTokenIn, SwapTokenOut } from './Swap'
import { Transfer, TransferData } from './Transfer'

const DEFAULT_DEADLINE = 5 * 60 // 5 minutes in seconds

/**
 * Builder for creating intents with one or more operations.
 */
export class IntentBuilder {
  protected settler: Address | null = null
  protected feePayer: Address | null = null
  protected deadline: BigInt | null = null
  protected nonce: string | null = null
  protected maxFees: TokenAmount[] = []
  protected operations: Operation[] = []

  /**
   * Adds an operation to this intent.
   * @param operation - The operation to add
   * @returns This IntentBuilder instance for method chaining
   */
  addOperation(operation: Operation): IntentBuilder {
    this.operations.push(operation)
    return this
  }

  /**
   * Adds multiple operations to this intent.
   * @param operations - The operations to add
   * @returns This IntentBuilder instance for method chaining
   */
  addOperations(operations: Operation[]): IntentBuilder {
    for (let i = 0; i < operations.length; i++) this.addOperation(operations[i])
    return this
  }

  /**
   * Adds a built operation builder to this intent.
   * @param operationBuilder - The operation builder to build and add
   * @returns This IntentBuilder instance for method chaining
   */
  addOperationBuilder(operationBuilder: OperationBuilder): IntentBuilder {
    return this.addOperation(operationBuilder.build())
  }

  /**
   * Adds multiple built operation builders to this intent.
   * @param operationBuilders - The operation builders to build and add
   * @returns This IntentBuilder instance for method chaining
   */
  addOperationsBuilders(operationBuilders: OperationBuilder[]): IntentBuilder {
    for (let i = 0; i < operationBuilders.length; i++) this.addOperationBuilder(operationBuilders[i])
    return this
  }

  /**
   * Adds a single EVM call operation to this intent from raw parameters.
   * @param chainId - The blockchain network identifier
   * @param target - The contract address to call
   * @param data - The encoded call data
   * @param value - The native token value to send
   * @param user - The user that should execute the operation
   * @param events - The operation events to emit
   * @returns This IntentBuilder instance for method chaining
   */
  addEvmCallOperation(
    chainId: ChainId,
    target: Address,
    data: Bytes = Bytes.empty(),
    value: BigInt = BigInt.zero(),
    user: Address | null = null,
    events: OperationEvent[] | null = null
  ): IntentBuilder {
    return this.addOperation(new EvmCall(chainId, [new EvmCallData(target, data, value)], user, events))
  }

  /**
   * Adds a single swap operation to this intent from raw parameters.
   * @param sourceChain - The source blockchain network identifier
   * @param tokenIn - The token to swap from
   * @param amountIn - The amount to swap from
   * @param tokenOut - The token to receive
   * @param minAmountOut - The minimum amount to receive
   * @param recipient - The recipient of the output token
   * @param destinationChain - The destination blockchain network identifier
   * @param user - The user that should execute the operation
   * @param events - The operation events to emit
   * @returns This IntentBuilder instance for method chaining
   */
  addSwapOperation(
    sourceChain: ChainId,
    tokenIn: Token,
    amountIn: BigInt,
    tokenOut: Token,
    minAmountOut: BigInt,
    recipient: Address,
    destinationChain: ChainId = sourceChain,
    user: Address | null = null,
    events: OperationEvent[] | null = null
  ): IntentBuilder {
    const swapIn = SwapTokenIn.fromBigInt(tokenIn, amountIn)
    const swapOut = SwapTokenOut.fromBigInt(tokenOut, minAmountOut, recipient)
    return this.addOperation(new Swap(sourceChain, [swapIn], [swapOut], destinationChain, user, events))
  }

  /**
   * Adds a single transfer operation to this intent from raw parameters.
   * @param token - The token to transfer
   * @param amount - The amount to transfer
   * @param recipient - The recipient of the transfer
   * @param user - The user that should execute the operation
   * @param events - The operation events to emit
   * @returns This IntentBuilder instance for method chaining
   */
  addTransferOperation(
    token: Token,
    amount: BigInt,
    recipient: Address,
    user: Address | null = null,
    events: OperationEvent[] | null = null
  ): IntentBuilder {
    if (!(token instanceof BlockchainToken)) throw new Error('Transfer token must be a blockchain token')
    const transferAmount = TokenAmount.fromBigInt(token, amount)
    const transferData = TransferData.fromTokenAmount(transferAmount, recipient)
    const chainId = changetype<BlockchainToken>(token).chainId
    return this.addOperation(new Transfer(chainId, [transferData], user, events))
  }

  /**
   * Adds a single SVM call operation to this intent from raw parameters.
   * @param programId - The program address to call
   * @param accountsMeta - The accounts metadata for the instruction
   * @param data - The encoded instruction data
   * @param user - The user that should execute the operation
   * @param events - The operation events to emit
   * @returns This IntentBuilder instance for method chaining
   */
  addSvmCallOperation(
    programId: Address,
    accountsMeta: SvmAccountMeta[],
    data: Bytes,
    user: Address | null = null,
    events: OperationEvent[] | null = null
  ): IntentBuilder {
    return this.addOperation(new SvmCall([SvmInstruction.create(programId, accountsMeta, data)], user, events))
  }

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
   * Sets the fee payer address for this intent.
   * @param feePayer - The fee payer address as an Address instance
   * @returns This IntentBuilder instance for method chaining
   */
  addFeePayer(feePayer: Address): IntentBuilder {
    this.feePayer = feePayer
    return this
  }

  /**
   * Sets the fee payer address from a string.
   * @param feePayer - The fee payer address as a hex string
   * @returns This IntentBuilder instance for method chaining
   */
  addFeePayerAsString(feePayer: string): IntentBuilder {
    return this.addFeePayer(Address.fromString(feePayer))
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
   * Sets the nonce for this intent.
   * @param nonce - The nonce to be set for the intent
   * @returns This IntentBuilder instance for method chaining
   */
  addNonce(nonce: string): IntentBuilder {
    this.nonce = nonce
    return this
  }

  /**
   * Adds a max fee for this intent.
   * @param fee - The max fee token amount
   * @returns This IntentBuilder instance for method chaining
   */
  addMaxFee(fee: TokenAmount): IntentBuilder {
    this.maxFees.push(fee)
    return this
  }

  /**
   * Builds and returns the final intent.
   * @returns A new intent
   */
  build(): Intent {
    return new Intent(this.maxFees, this.settler, this.feePayer, this.deadline, this.nonce, this.operations)
  }

  /**
   * Builds and sends the final intent.
   */
  send(): void {
    this.build().send()
  }
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

let INTENT_INDEX: u32 = 0

/**
 * Represents a sendable intent containing one or more operations plus intent-level metadata.
 */
@json
export class Intent {
  public settler: string = ''
  public feePayer: string = ''
  public deadline: string = ''
  public nonce: string = ''
  public maxFees: MaxFee[] = []
  public operations: Operation[]

  /**
   * Creates a new intent.
   * @param maxFees - The list of max fees to pay for the intent
   * @param settler - The settler address
   * @param feePayer - The fee payer address
   * @param deadline - The deadline timestamp
   * @param nonce - The nonce for replay protection
   * @param operations - The operations to execute
   */
  constructor(
    maxFees: TokenAmount[] | null = null,
    settler: Address | null = null,
    feePayer: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null,
    operations: Operation[] | null = null
  ) {
    const context = environment.getContext()
    this.operations = operations || []
    if (this.operations.length === 0) throw new Error('Operation list cannot be empty')

    this.maxFees = maxFees ? maxFees.map((fee: TokenAmount) => MaxFee.fromTokenAmount(fee)) : []
    const defaultChainId = this.operations[0].chainId
    this.settler = settler ? settler.toString() : context.findSettler(defaultChainId).toString()
    this.feePayer = feePayer ? feePayer.toString() : context.user.toString()
    this.deadline = deadline ? deadline.toString() : (context.timestamp / 1000 + DEFAULT_DEADLINE).toString()
    this.nonce = nonce
      ? nonce
      : evm.keccak(`${context.triggerSig}${context.timestamp}${context.triggerPayload.data}${++INTENT_INDEX}`)

    if (!this.settler || this.settler == NULL_ADDRESS) throw new Error('A settler contract must be specified')
    if (!this.feePayer || this.feePayer == NULL_ADDRESS) throw new Error('A fee payer must be specified')
  }

  /**
   * Sends this intent to the execution environment.
   */
  send(): void {
    environment.sendIntent(this)
  }
}
