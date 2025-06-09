import { Token, TokenAmount } from '../tokens'
import { Address, BigInt } from '../types'

import { Intent, OperationType } from './Intent'

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
}
