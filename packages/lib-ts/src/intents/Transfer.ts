import { environment } from '../environment'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

export class TransferBuilder extends IntentBuilder {
  private transfers: TransferData[] = []
  private feeTokenAmount: TokenAmount
  private chainId: u64

  static fromTokenAmountAndChain(feeTokenAmount: TokenAmount, chainId: u64): TransferBuilder {
    return new TransferBuilder(feeTokenAmount, chainId)
  }

  constructor(feeTokenAmount: TokenAmount, chainId: u64) {
    super()
    if (feeTokenAmount.token.chainId !== chainId) {
      throw new Error('Fee token must be on the same chain as the intent')
    }
    this.feeTokenAmount = feeTokenAmount
    this.chainId = chainId
  }

  addTransfer(transfer: TransferData): TransferBuilder {
    this.transfers.push(transfer)
    return this
  }

  addTransfers(transfers: TransferData[]): TransferBuilder {
    for (let i = 0; i < transfers.length; i++) {
      this.transfers.push(transfers[i])
    }
    return this
  }

  addTransferFromTokenAmount(tokenAmount: TokenAmount, recipient: Address): TransferBuilder {
    if (tokenAmount.token.chainId !== this.chainId) {
      throw new Error('All tokens must be on the same chain')
    }
    return this.addTransfer(TransferData.fromTokenAmount(tokenAmount, recipient))
  }

  addTransferFromStringDecimal(token: Token, amount: string, recipient: Address): TransferBuilder {
    if (token.chainId !== this.chainId) {
      throw new Error('All tokens must be on the same chain')
    }
    return this.addTransfer(TransferData.fromStringDecimal(token, amount, recipient))
  }

  addTransfersFromTokenAmounts(tokenAmounts: TokenAmount[], recipient: Address): TransferBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) {
      this.addTransferFromTokenAmount(tokenAmounts[i], recipient)
    }
    return this
  }

  build(): Transfer {
    return new Transfer(
      this.transfers,
      this.feeTokenAmount.token.address,
      this.feeTokenAmount.amount,
      this.chainId,
      this.user,
      this.settler,
      this.deadline,
      this.nonce
    )
  }
}

@json
export class TransferData {
  public token: string
  public amount: string
  public recipient: string

  static fromTokenAmount(tokenAmount: TokenAmount, recipient: Address): TransferData {
    return new TransferData(tokenAmount.token.address, tokenAmount.amount, recipient)
  }

  static fromStringDecimal(token: Token, amount: string, recipient: Address): TransferData {
    return this.fromTokenAmount(TokenAmount.fromStringDecimal(token, amount), recipient)
  }

  constructor(token: Address, amount: BigInt, recipient: Address) {
    this.token = token.toString()
    this.amount = amount.toString()
    this.recipient = recipient.toString()
  }
}

@json
export class Transfer extends Intent {
  public transfers: TransferData[]
  public feeToken: string
  public feeAmount: string
  public chainId: u64
  constructor(
    transfers: TransferData[],
    feeToken: Address,
    feeAmount: BigInt,
    chainId: u64,
    user: Address | null = null,
    settler: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string = ''
  ) {
    super(OperationType.Transfer, user, settler, deadline, nonce)

    if (transfers.length === 0) {
      throw new Error('Transfer list cannot be empty')
    }

    this.transfers = transfers
    this.feeToken = feeToken.toString()
    this.feeAmount = feeAmount.toString()
    this.chainId = chainId
  }

  send(): void {
    environment.transfer(this)
  }
}
