import { environment } from '../environment'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt, ChainId } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

/**
 * Builder for creating Swap intents with token exchange operations.
 * Supports both single-chain and cross-chain swaps with multiple input and output tokens.
 */
export class SwapBuilder extends IntentBuilder {
  private sourceChain: ChainId
  private destinationChain: ChainId
  private tokensIn: TokenIn[] = []
  private tokensOut: TokenOut[] = []

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
  constructor(sourceChain: ChainId, destinationChain: ChainId) {
    super()
    this.sourceChain = sourceChain
    this.destinationChain = destinationChain
  }

  /**
   * Adds an input token to the swap.
   * @param tokenIn - The token input configuration
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenIn(tokenIn: TokenIn): SwapBuilder {
    this.tokensIn.push(tokenIn)
    return this
  }

  /**
   * Adds multiple input tokens to the swap.
   * @param tokensIn - Array of token input configurations
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensIn(tokensIn: TokenIn[]): SwapBuilder {
    for (let i = 0; i < tokensIn.length; i++) this.addTokenIn(tokensIn[i])
    return this
  }

  /**
   * Adds an output token to the swap.
   * @param tokenOut - The token output configuration
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenOut(tokenOut: TokenOut): SwapBuilder {
    this.tokensOut.push(tokenOut)
    return this
  }

  /**
   * Adds multiple output tokens to the swap.
   * @param tokensOut - Array of token output configurations
   * @returns This SwapBuilder instance for method chaining
   */
  addTokensOut(tokensOut: TokenOut[]): SwapBuilder {
    for (let i = 0; i < tokensOut.length; i++) this.addTokenOut(tokensOut[i])
    return this
  }

  /**
   * Adds an input token from a TokenAmount.
   * @param tokenAmount - The token amount to swap from (must be on source chain)
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenInFromTokenAmount(tokenAmount: TokenAmount): SwapBuilder {
    if (tokenAmount.token.chainId !== this.sourceChain) throw new Error('Tokens in must be on the same chain')
    return this.addTokenIn(TokenIn.fromTokenAmount(tokenAmount))
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
    if (token.chainId !== this.sourceChain) throw new Error('Tokens in must be on the same chain')
    return this.addTokenIn(TokenIn.fromStringDecimal(token, amount))
  }

  /**
   * Adds an output token from a TokenAmount.
   * @param tokenAmount - The minimum token amount to receive (must be on destination chain)
   * @param recipient - The address to receive the tokens
   * @returns This SwapBuilder instance for method chaining
   */
  addTokenOutFromTokenAmount(tokenAmount: TokenAmount, recipient: Address): SwapBuilder {
    if (tokenAmount.token.chainId !== this.destinationChain) throw new Error('Tokens out must be on the same chain')
    return this.addTokenOut(TokenOut.fromTokenAmount(tokenAmount, recipient))
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
    if (token.chainId !== this.destinationChain) throw new Error('Tokens out must be on the same chain')
    return this.addTokenOut(TokenOut.fromStringDecimal(token, amount, recipient))
  }

  /**
   * Sets the settler address for this intent.
   * @param settler - The settler address as an Address instance
   * @returns This SwapBuilder instance for method chaining
   */
  addSettler(settler: Address): SwapBuilder {
    return changetype<SwapBuilder>(super.addSettler(settler))
  }

  /**
   * Sets the settler address from a string.
   * @param settler - The settler address as a hex string
   * @returns This SwapBuilder instance for method chaining
   */
  addSettlerAsString(settler: string): SwapBuilder {
    return changetype<SwapBuilder>(super.addSettlerAsString(settler))
  }

  /**
   * Sets the deadline for this intent.
   * @param deadline - The deadline as a timestamp
   * @returns This SwapBuilder instance for method chaining
   */
  addDeadline(deadline: BigInt): SwapBuilder {
    return changetype<SwapBuilder>(super.addDeadline(deadline))
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
   * Sets the nonce for this intent.
   * @param nonce - A unique identifier to prevent replay attacks
   * @returns This SwapBuilder instance for method chaining
   */
  addNonce(nonce: string): SwapBuilder {
    return changetype<SwapBuilder>(super.addNonce(nonce))
  }

  /**
   * Adds a max fee for this intent.
   * @param fee - The max fee token amount (must be on same chain)
   * @returns This SwapBuilder instance for method chaining
   */
  addMaxFee(fee: TokenAmount): SwapBuilder {
    if (fee.token.chainId !== this.destinationChain) throw new Error('Fee token must be on the destination chain')
    this.maxFees.push(fee)
    return this
  }

  /**
   * Builds and returns the final Swap intent.
   * @returns A new Swap instance with all configured parameters
   */
  build(): Swap {
    if (this.tokensIn.length === 0 || this.tokensOut.length === 0) throw new Error('Tokens in and out are required')

    return new Swap(
      this.sourceChain,
      this.tokensIn,
      this.tokensOut,
      this.destinationChain,
      this.settler,
      this.user,
      this.deadline,
      this.nonce,
      this.maxFees
    )
  }
}

/**
 * Represents an input token configuration for a swap operation.
 * Specifies the token address and amount to be swapped.
 */
@json
export class TokenIn {
  token: string
  amount: string

  /**
   * Creates a TokenIn from a TokenAmount.
   * @param tokenAmount - The token amount to swap from
   * @returns A new TokenIn instance
   */
  static fromTokenAmount(tokenAmount: TokenAmount): TokenIn {
    return new TokenIn(tokenAmount.token.address, tokenAmount.amount)
  }

  /**
   * Creates a TokenIn from a 32-bit integer amount.
   * @param token - The token to swap from
   * @param amount - The amount as a whole number
   * @returns A new TokenIn instance
   */
  static fromI32(token: Token, amount: i32): TokenIn {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount))
  }

  /**
   * Creates a TokenIn from a BigInt amount.
   * @param token - The token to swap from
   * @param amount - The amount in the token's smallest unit
   * @returns A new TokenIn instance
   */
  static fromBigInt(token: Token, amount: BigInt): TokenIn {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount))
  }

  /**
   * Creates a TokenIn from a decimal string amount.
   * @param token - The token to swap from
   * @param amount - The amount as a decimal string
   * @returns A new TokenIn instance
   */
  static fromStringDecimal(token: Token, amount: string): TokenIn {
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
export class TokenOut {
  token: string
  minAmount: string
  recipient: string

  /**
   * Creates a TokenOut from a TokenAmount.
   * @param tokenAmount - The minimum token amount to receive
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromTokenAmount(tokenAmount: TokenAmount, recipient: Address): TokenOut {
    return new TokenOut(tokenAmount.token.address, tokenAmount.amount, recipient)
  }

  /**
   * Creates a TokenOut from a 32-bit integer amount.
   * @param token - The token to receive
   * @param amount - The minimum amount as a whole number
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromI32(token: Token, amount: i32, recipient: Address): TokenOut {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount), recipient)
  }

  /**
   * Creates a TokenOut from a BigInt amount.
   * @param token - The token to receive
   * @param amount - The minimum amount in the token's smallest unit
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromBigInt(token: Token, amount: BigInt, recipient: Address): TokenOut {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount), recipient)
  }

  /**
   * Creates a TokenOut from a decimal string amount.
   * @param token - The token to receive
   * @param amount - The minimum amount as a decimal string
   * @param recipient - The address to receive the tokens
   * @returns A new TokenOut instance
   */
  static fromStringDecimal(token: Token, amount: string, recipient: Address): TokenOut {
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
export class Swap extends Intent {
  /**
   * Creates a simple single-chain swap intent.
   * @param chainId - The blockchain network identifier
   * @param tokenIn - The input token address
   * @param amountIn - The amount to swap from
   * @param tokenOut - The output token address
   * @param minAmountOut - The minimum amount to receive
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   * @returns A new Swap instance
   */
  static create(
    chainId: ChainId,
    tokenIn: Address,
    amountIn: BigInt,
    tokenOut: Address,
    minAmountOut: BigInt,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ): Swap {
    const context = environment.getContext()
    const recipient = user || context.user
    const swapIn = TokenIn.fromBigInt(Token.fromAddress(tokenIn, chainId), amountIn)
    const swapOut = TokenOut.fromBigInt(Token.fromAddress(tokenOut, chainId), minAmountOut, recipient)
    return new Swap(chainId, [swapIn], [swapOut], chainId, settler, user, deadline, nonce)
  }

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
    public tokensIn: TokenIn[],
    public tokensOut: TokenOut[],
    public destinationChain: ChainId,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null,
    maxFees: TokenAmount[] | null = null
  ) {
    super(OperationType.Swap, sourceChain, settler, user, deadline, nonce, maxFees)
    if (tokensIn.length === 0) throw new Error('TokenIn list cannot be empty')
    if (tokensOut.length === 0) throw new Error('TokenOut list cannot be empty')
  }

  /**
   * Sends this Swap intent to the execution environment.
   */
  send(): void {
    environment.swap(this)
  }
}
