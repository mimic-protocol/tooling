import { environment } from '../environment'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt, Bytes, ChainId } from '../types'

import { IntentBuilder } from './Intent'
import { Operation, OperationBuilder, OperationEvent, OperationType } from './Operation'

/**
 * Builder for creating Swap intents with token exchange operations.
 * Supports both single-chain and cross-chain swaps with multiple input and output tokens.
 */
export class SwapBuilder extends OperationBuilder {
  protected sourceChain: ChainId
  protected destinationChain: ChainId
  protected tokensIn: SwapTokenIn[] = []
  protected tokensOut: SwapTokenOut[] = []

  /**
   * Creates a SwapBuilder for a single-chain swap.
   * @param chainId - The blockchain network identifier for both source and destination
   * @returns A new SwapBuilder instance
   */
  static forChain(chainId: ChainId): SwapBuilder {
    return new SwapBuilder(chainId, chainId)
  }

  /**
   * Creates a SwapBuilder for a cross-chain swap.
   * @param sourceChain - The source blockchain network identifier
   * @param destinationChain - The destination blockchain network identifier
   * @returns A new SwapBuilder instance
   */
  static forChains(sourceChain: ChainId, destinationChain: ChainId): SwapBuilder {
    return new SwapBuilder(sourceChain, destinationChain)
  }

  /**
   * Creates a new SwapBuilder instance.
   * @param sourceChain - The source blockchain network identifier
   * @param destinationChain - The destination blockchain network identifier
   */
  private constructor(sourceChain: ChainId, destinationChain: ChainId) {
    super()
    this.sourceChain = sourceChain
    this.destinationChain = destinationChain
  }

  /**
   * Adds an input token to the swap.
   * @param tokenIn - The token input configuration
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenIn(tokenIn: SwapTokenIn): SwapBuilder {
    this.tokensIn.push(tokenIn)
    return this
  }

  /**
   * Adds multiple input tokens to the swap.
   * @param tokensIn - Array of token input configurations
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensIn(tokensIn: SwapTokenIn[]): SwapBuilder {
    for (let i = 0; i < tokensIn.length; i++) this.addTokenIn(tokensIn[i])
    return this
  }

  /**
   * Adds the tokens in from another SwapBuilder to this SwapBuilder.
   * @param builder - The SwapBuilder to add the tokens in from
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensInFromBuilder(builder: SwapBuilder): SwapBuilder {
    return this.addTokensIn(builder.getTokensIn())
  }

  /**
   * Adds the tokens in from multiple SwapBuilders to this SwapBuilder.
   * @param builders - The SwapBuilders to add the tokens in from
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensInFromBuilders(builders: SwapBuilder[]): SwapBuilder {
    for (let i = 0; i < builders.length; i++) this.addTokensInFromBuilder(builders[i])
    return this
  }

  /**
   * Returns a copy of the tokens in array.
   * @returns A copy of the tokens in array
   */
  getTokensIn(): SwapTokenIn[] {
    return this.tokensIn.slice(0)
  }

  /**
   * Adds an output token to the swap.
   * @param tokenOut - The token output configuration
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenOut(tokenOut: SwapTokenOut): SwapBuilder {
    this.tokensOut.push(tokenOut)
    return this
  }

  /**
   * Adds multiple output tokens to the swap.
   * @param tokensOut - Array of token output configurations
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensOut(tokensOut: SwapTokenOut[]): SwapBuilder {
    for (let i = 0; i < tokensOut.length; i++) this.addTokenOut(tokensOut[i])
    return this
  }

  /**
   * Adds the tokens out from another SwapBuilder to this SwapBuilder.
   * @param builder - The SwapBuilder to add the tokens out from
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensOutFromBuilder(builder: SwapBuilder): SwapBuilder {
    return this.addTokensOut(builder.getTokensOut())
  }

  /**
   * Adds the tokens out from multiple SwapBuilders to this SwapBuilder.
   * @param builders - The SwapBuilders to add the tokens out from
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensOutFromBuilders(builders: SwapBuilder[]): SwapBuilder {
    for (let i = 0; i < builders.length; i++) this.addTokensOutFromBuilder(builders[i])
    return this
  }

  /**
   * Returns a copy of the tokens out array.
   * @returns A copy of the tokens out array
   */
  getTokensOut(): SwapTokenOut[] {
    return this.tokensOut.slice(0)
  }

  /**
   * Adds an input token from a TokenAmount.
   * @param tokenAmount - The token amount to swap from (must be on source chain)
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenInFromTokenAmount(tokenAmount: TokenAmount): SwapBuilder {
    if (!tokenAmount.token.hasChain(this.sourceChain)) throw new Error('Tokens in must be on the same chain')
    return this.addTokenIn(SwapTokenIn.fromTokenAmount(tokenAmount))
  }

  /**
   * Adds multiple input tokens from TokenAmounts.
   * @param tokenAmounts - Array of token amounts to swap from (must be on source chain)
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensInFromTokenAmounts(tokenAmounts: TokenAmount[]): SwapBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) this.addTokenInFromTokenAmount(tokenAmounts[i])
    return this
  }

  /**
   * Adds an input token from a decimal string amount.
   * @param token - The token to swap from (must be on source chain)
   * @param amount - The amount as a decimal string
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenInFromStringDecimal(token: Token, amount: string): SwapBuilder {
    if (!token.hasChain(this.sourceChain)) throw new Error('Tokens in must be on the source chain')
    return this.addTokenIn(SwapTokenIn.fromStringDecimal(token, amount))
  }

  /**
   * Adds an output token from a TokenAmount.
   * @param tokenAmount - The minimum token amount to receive (must be on destination chain)
   * @param recipient - The address to receive the tokens
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenOutFromTokenAmount(tokenAmount: TokenAmount, recipient: Address): SwapBuilder {
    if (!tokenAmount.token.hasChain(this.destinationChain))
      throw new Error('Tokens out must be on the destination chain')
    return this.addTokenOut(SwapTokenOut.fromTokenAmount(tokenAmount, recipient))
  }

  /**
   * Adds multiple output tokens from TokenAmounts.
   * @param tokenAmounts - Array of minimum token amounts to receive (must be on destination chain)
   * @param recipient - The address to receive the tokens
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensOutFromTokenAmounts(tokenAmounts: TokenAmount[], recipient: Address): SwapBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) this.addTokenOutFromTokenAmount(tokenAmounts[i], recipient)
    return this
  }

  /**
   * Adds an output token from a decimal string amount.
   * @param token - The token to receive (must be on destination chain)
   * @param amount - The minimum amount as a decimal string
   * @param recipient - The address to receive the tokens
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenOutFromStringDecimal(token: Token, amount: string, recipient: Address): SwapBuilder {
    if (!token.hasChain(this.destinationChain)) throw new Error('Tokens out must be on the destination chain')
    return this.addTokenOut(SwapTokenOut.fromStringDecimal(token, amount, recipient))
  }

  /**
   * Sets the user address for this intent.
   * @param user - The user address
   * @returns This SwapBuilder instance for method chaining
   */
  addUser(user: Address): SwapBuilder {
    return changetype<SwapBuilder>(super.addUser(user))
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This SwapBuilder instance for method chaining
   */
  addUserAsString(user: string): SwapBuilder {
    return changetype<SwapBuilder>(super.addUserAsString(user))
  }

  /**
   * Sets an event for the intent.
   * @param topic - The topic to be indexed in the event
   * @param data - The event data
   * @returns This SwapBuilder instance for method chaining
   */
  addEvent(topic: Bytes, data: Bytes): SwapBuilder {
    return changetype<SwapBuilder>(super.addEvent(topic, data))
  }

  /**
   * Sets multiple events for the intent.
   * @param events - The list of events to be added
   * @returns This SwapBuilder instance for method chaining
   */
  addEvents(events: OperationEvent[]): SwapBuilder {
    return changetype<SwapBuilder>(super.addEvents(events))
  }

  /**
   * Builds and returns the final Swap intent.
   * @returns A new Swap instance with all configured parameters
   */
  build(): Swap {
    if (this.tokensIn.length === 0 || this.tokensOut.length === 0) throw new Error('Tokens in and out are required')

    return new Swap(this.sourceChain, this.tokensIn, this.tokensOut, this.destinationChain, this.user, this.events)
  }

  /**
   * Builds this operation and sends it inside an intent with the provided fee data.
   * @param maxFee - The max fee to pay for the intent (optional for swaps)
   * @param feePayer - The fee payer for the intent (optional)
   */
  send(maxFee: TokenAmount | null = null, feePayer: Address | null = null): void {
    this.build().send(maxFee, feePayer)
  }
}

/**
 * Represents an input token configuration for a swap operation.
 * Specifies the token address and amount to be swapped.
 */
@json
export class SwapTokenIn {
  token: string
  amount: string

  /**
   * Creates a TokenIn from a TokenAmount.
   * @param tokenAmount - The token amount to swap from
   * @returns A new TokenIn instance
   */
  static fromTokenAmount(tokenAmount: TokenAmount): SwapTokenIn {
    return new SwapTokenIn(tokenAmount.token.address, tokenAmount.amount)
  }

  /**
   * Creates a TokenIn from a 32-bit integer amount.
   * @param token - The token to swap from
   * @param amount - The amount as a whole number
   * @returns A new TokenIn instance
   */
  static fromI32(token: Token, amount: i32): SwapTokenIn {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount))
  }

  /**
   * Creates a TokenIn from a BigInt amount.
   * @param token - The token to swap from
   * @param amount - The amount in the token's smallest unit
   * @returns A new TokenIn instance
   */
  static fromBigInt(token: Token, amount: BigInt): SwapTokenIn {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount))
  }

  /**
   * Creates a TokenIn from a decimal string amount.
   * @param token - The token to swap from
   * @param amount - The amount as a decimal string
   * @returns A new TokenIn instance
   */
  static fromStringDecimal(token: Token, amount: string): SwapTokenIn {
    return this.fromTokenAmount(TokenAmount.fromStringDecimal(token, amount))
  }

  /**
   * Creates a new TokenIn instance.
   * @param token - The token address
   * @param amount - The amount in the token's smallest unit
   */
  constructor(token: Address, amount: BigInt) {
    this.token = token.toString()
    this.amount = amount.toString()
  }
}

/**
 * Represents an output token configuration for a swap operation.
 * Specifies the token address, minimum amount to receive, and recipient.
 */
@json
export class SwapTokenOut {
  token: string
  minAmount: string
  recipient: string

  /**
   * Creates a TokenOut from a TokenAmount.
   * @param tokenAmount - The minimum token amount to receive
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromTokenAmount(tokenAmount: TokenAmount, recipient: Address): SwapTokenOut {
    return new SwapTokenOut(tokenAmount.token.address, tokenAmount.amount, recipient)
  }

  /**
   * Creates a TokenOut from a 32-bit integer amount.
   * @param token - The token to receive
   * @param amount - The minimum amount as a whole number
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromI32(token: Token, amount: i32, recipient: Address): SwapTokenOut {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount), recipient)
  }

  /**
   * Creates a TokenOut from a BigInt amount.
   * @param token - The token to receive
   * @param amount - The minimum amount in the token's smallest unit
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromBigInt(token: Token, amount: BigInt, recipient: Address): SwapTokenOut {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount), recipient)
  }

  /**
   * Creates a TokenOut from a decimal string amount.
   * @param token - The token to receive
   * @param amount - The minimum amount as a decimal string
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromStringDecimal(token: Token, amount: string, recipient: Address): SwapTokenOut {
    return this.fromTokenAmount(TokenAmount.fromStringDecimal(token, amount), recipient)
  }

  /**
   * Creates a new TokenOut instance.
   * @param token - The token address
   * @param minAmount - The minimum amount in the token's smallest unit
   * @param recipient - The address to receive the tokens
   */
  constructor(token: Address, minAmount: BigInt, recipient: Address) {
    this.token = token.toString()
    this.minAmount = minAmount.toString()
    this.recipient = recipient.toString()
  }
}

/**
 * Represents a Swap intent for exchanging tokens between blockchain networks.
 */
@json
export class Swap extends Operation {
  /**
   * Creates a simple single-chain swap intent.
   * @param chainId - The blockchain network identifier
   * @param tokenIn - The input token
   * @param amountIn - The amount to swap from
   * @param tokenOut - The output token
   * @param minAmountOut - The minimum amount to receive
   * @param settler - The settler address (optional)
   * @param recipient - The recipient address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   * @returns A new Swap instance
   */

  /**
   * Creates a new Swap intent.
   * @param sourceChain - The source blockchain network identifier
   * @param tokensIn - Array of input token configurations
   * @param tokensOut - Array of output token configurations
   * @param destinationChain - The destination blockchain network identifier
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   * @param maxFees - The list of max fees to pay for the swap intent (optional)
   */
  constructor(
    public sourceChain: ChainId,
    public tokensIn: SwapTokenIn[],
    public tokensOut: SwapTokenOut[],
    public destinationChain: ChainId,
    user: Address | null = null,
    events: OperationEvent[] | null = null
  ) {
    super(OperationType.Swap, sourceChain, user, events)
    if (tokensIn.length === 0) throw new Error('TokenIn list cannot be empty')
    if (tokensOut.length === 0) throw new Error('TokenOut list cannot be empty')
  }

  /**
   * Sends this Swap intent to the execution environment.
   * @param maxFee - The max fee to pay for the intent (optional for swaps)
   * @param feePayer - The fee payer for the intent (optional)
   */
  send(maxFee: TokenAmount | null = null, feePayer: Address | null = null): void {
    const intentBuilder = new IntentBuilder().addOperation(this)
    if (maxFee) intentBuilder.addMaxFee(maxFee)
    if (feePayer) intentBuilder.addFeePayer(feePayer)
    environment.sendIntent(intentBuilder.build())
  }
}
