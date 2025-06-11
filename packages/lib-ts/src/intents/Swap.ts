import { environment } from '../environment'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

export class SwapBuilder extends IntentBuilder {
  private sourceChain: u64
  private tokensIn: TokenIn[] = []
  private tokensOut: TokenOut[] = []
  private destinationChain: u64

  static fromChains(sourceChain: u64, destinationChain: u64): SwapBuilder {
    return new SwapBuilder(sourceChain, destinationChain)
  }

  constructor(sourceChain: u64, destinationChain: u64) {
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
      this.tokensIn.push(tokensIn[i])
    }
    return this
  }

  addTokenOut(tokenOut: TokenOut): SwapBuilder {
    this.tokensOut.push(tokenOut)
    return this
  }

  addTokensOut(tokensOut: TokenOut[]): SwapBuilder {
    for (let i = 0; i < tokensOut.length; i++) {
      this.tokensOut.push(tokensOut[i])
    }
    return this
  }

  addTokenInFromTokenAmount(tokenAmount: TokenAmount): SwapBuilder {
    return this.addTokenIn(TokenIn.fromTokenAmount(tokenAmount))
  }

  addTokensInFromTokenAmounts(tokenAmounts: TokenAmount[]): SwapBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) {
      this.addTokenInFromTokenAmount(tokenAmounts[i])
    }
    return this
  }

  addTokenInFromStringDecimal(token: Token, amount: string): SwapBuilder {
    return this.addTokenIn(TokenIn.fromStringDecimal(token, amount))
  }

  addTokenOutFromTokenAmount(tokenAmount: TokenAmount, recipient: Address): SwapBuilder {
    return this.addTokenOut(TokenOut.fromTokenAmount(tokenAmount, recipient))
  }

  addTokensOutFromTokenAmounts(tokenAmounts: TokenAmount[], recipient: Address): SwapBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) {
      this.addTokenOutFromTokenAmount(tokenAmounts[i], recipient)
    }
    return this
  }

  addTokenOutFromStringDecimal(token: Token, amount: string, recipient: Address): SwapBuilder {
    return this.addTokenOut(TokenOut.fromStringDecimal(token, amount, recipient))
  }

  build(): Swap {
    return new Swap(this.sourceChain, this.tokensIn, this.tokensOut, this.destinationChain, this.settler, this.deadline)
  }
}

@json
export class TokenIn {
  token: string
  amount: string

  static fromTokenAmount(tokenAmount: TokenAmount): TokenIn {
    return new TokenIn(tokenAmount.token.address, tokenAmount.amount)
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
  constructor(
    public sourceChain: u64,
    public tokensIn: TokenIn[],
    public tokensOut: TokenOut[],
    public destinationChain: u64,
    settler: Address | null,
    deadline: BigInt | null
  ) {
    super(OperationType.Swap, settler, deadline)
    if (tokensIn.length === 0) {
      throw new Error('TokenIn list cannot be empty')
    }
    if (tokensOut.length === 0) {
      throw new Error('TokenOut list cannot be empty')
    }
  }

  send(): void {
    environment.swap(this)
  }
}
