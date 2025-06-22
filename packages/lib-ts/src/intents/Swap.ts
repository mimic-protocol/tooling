import { environment } from '../environment'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt, ChainId } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

export class SwapBuilder extends IntentBuilder {
  private sourceChain: ChainId
  private destinationChain: ChainId
  private tokensIn: TokenIn[] = []
  private tokensOut: TokenOut[] = []

  static forChain(chainId: ChainId): SwapBuilder {
    return new SwapBuilder(chainId, chainId)
  }

  static forChains(sourceChain: ChainId, destinationChain: ChainId): SwapBuilder {
    return new SwapBuilder(sourceChain, destinationChain)
  }

  constructor(sourceChain: ChainId, destinationChain: ChainId) {
    super()
    this.sourceChain = sourceChain
    this.destinationChain = destinationChain
  }

  addTokenIn(tokenIn: TokenIn): SwapBuilder {
    this.tokensIn.push(tokenIn)
    return this
  }

  addTokensIn(tokensIn: TokenIn[]): SwapBuilder {
    for (let i = 0; i < tokensIn.length; i++) {
      this.addTokenIn(tokensIn[i])
    }
    return this
  }

  addTokenOut(tokenOut: TokenOut): SwapBuilder {
    this.tokensOut.push(tokenOut)
    return this
  }

  addTokensOut(tokensOut: TokenOut[]): SwapBuilder {
    for (let i = 0; i < tokensOut.length; i++) {
      this.addTokenOut(tokensOut[i])
    }
    return this
  }

  addTokenInFromTokenAmount(tokenAmount: TokenAmount): SwapBuilder {
    if (tokenAmount.token.chainId !== this.sourceChain) {
      throw new Error('All tokens in must be on the same chain')
    }
    return this.addTokenIn(TokenIn.fromTokenAmount(tokenAmount))
  }

  addTokensInFromTokenAmounts(tokenAmounts: TokenAmount[]): SwapBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) {
      this.addTokenInFromTokenAmount(tokenAmounts[i])
    }
    return this
  }

  addTokenInFromStringDecimal(token: Token, amount: string): SwapBuilder {
    if (token.chainId !== this.sourceChain) {
      throw new Error('All tokens in must be on the same chain')
    }
    return this.addTokenIn(TokenIn.fromStringDecimal(token, amount))
  }

  addTokenOutFromTokenAmount(tokenAmount: TokenAmount, recipient: Address): SwapBuilder {
    if (tokenAmount.token.chainId !== this.destinationChain) {
      throw new Error('All tokens out must be on the same chain')
    }
    return this.addTokenOut(TokenOut.fromTokenAmount(tokenAmount, recipient))
  }

  addTokensOutFromTokenAmounts(tokenAmounts: TokenAmount[], recipient: Address): SwapBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) {
      this.addTokenOutFromTokenAmount(tokenAmounts[i], recipient)
    }
    return this
  }

  addTokenOutFromStringDecimal(token: Token, amount: string, recipient: Address): SwapBuilder {
    if (token.chainId !== this.destinationChain) {
      throw new Error('All tokens out must be on the same chain')
    }
    return this.addTokenOut(TokenOut.fromStringDecimal(token, amount, recipient))
  }

  addSettler(settler: Address): SwapBuilder {
    return changetype<SwapBuilder>(super.addSettler(settler))
  }

  addSettlerAsString(settler: string): SwapBuilder {
    return changetype<SwapBuilder>(super.addSettlerAsString(settler))
  }

  addDeadline(deadline: BigInt): SwapBuilder {
    return changetype<SwapBuilder>(super.addDeadline(deadline))
  }

  addUser(user: Address): SwapBuilder {
    return changetype<SwapBuilder>(super.addUser(user))
  }

  addUserAsString(user: string): SwapBuilder {
    return changetype<SwapBuilder>(super.addUserAsString(user))
  }

  addNonce(nonce: string): SwapBuilder {
    return changetype<SwapBuilder>(super.addNonce(nonce))
  }

  build(): Swap {
    if (this.tokensIn.length === 0 || this.tokensOut.length === 0) {
      throw new Error('Tokens in and out are required')
    }

    return new Swap(
      this.sourceChain,
      this.tokensIn,
      this.tokensOut,
      this.destinationChain,
      this.settler,
      this.user,
      this.deadline,
      this.nonce
    )
  }
}

@json
export class TokenIn {
  token: string
  amount: string

  static fromTokenAmount(tokenAmount: TokenAmount): TokenIn {
    return new TokenIn(tokenAmount.token.address, tokenAmount.amount)
  }

  static fromI32(token: Token, amount: i32): TokenIn {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount))
  }

  static fromBigInt(token: Token, amount: BigInt): TokenIn {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount))
  }

  static fromStringDecimal(token: Token, amount: string): TokenIn {
    return this.fromTokenAmount(TokenAmount.fromStringDecimal(token, amount))
  }

  constructor(token: Address, amount: BigInt) {
    this.token = token.toString()
    this.amount = amount.toString()
  }
}

@json
export class TokenOut {
  token: string
  minAmount: string
  recipient: string

  static fromTokenAmount(tokenAmount: TokenAmount, recipient: Address): TokenOut {
    return new TokenOut(tokenAmount.token.address, tokenAmount.amount, recipient)
  }

  static fromI32(token: Token, amount: i32, recipient: Address): TokenOut {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount), recipient)
  }

  static fromBigInt(token: Token, amount: BigInt, recipient: Address): TokenOut {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount), recipient)
  }

  static fromStringDecimal(token: Token, amount: string, recipient: Address): TokenOut {
    return this.fromTokenAmount(TokenAmount.fromStringDecimal(token, amount), recipient)
  }

  constructor(token: Address, minAmount: BigInt, recipient: Address) {
    this.token = token.toString()
    this.minAmount = minAmount.toString()
    this.recipient = recipient.toString()
  }
}

@json
export class Swap extends Intent {
  static create(
    chainId: ChainId,
    tokenIn: Address,
    amountIn: BigInt,
    tokenOut: Address,
    minAmountOut: BigInt,
    user: Address | null = null,
    settler: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ): Swap {
    const context = environment.getContext()
    const recipient = user || context.user
    const swapIn = TokenIn.fromBigInt(Token.fromAddress(tokenIn, chainId), amountIn)
    const swapOut = TokenOut.fromBigInt(Token.fromAddress(tokenOut, chainId), minAmountOut, recipient)
    return new Swap(chainId, [swapIn], [swapOut], chainId, settler, user, deadline, nonce)
  }

  constructor(
    public sourceChain: ChainId,
    public tokensIn: TokenIn[],
    public tokensOut: TokenOut[],
    public destinationChain: ChainId,
    user: Address | null = null,
    settler: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ) {
    super(OperationType.Swap, user, settler, deadline, nonce)
    if (tokensIn.length === 0) throw new Error('TokenIn list cannot be empty')
    if (tokensOut.length === 0) throw new Error('TokenOut list cannot be empty')
  }

  send(): void {
    environment.swap(this)
  }
}
