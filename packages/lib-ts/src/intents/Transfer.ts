import { environment } from '../environment'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt, ChainId } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

export class TransferBuilder extends IntentBuilder {
  private chainId: ChainId
  private transfers: TransferData[] = []
  private fee: TokenAmount | null = null

  static forChain(chainId: ChainId): TransferBuilder {
    return new TransferBuilder(chainId)
  }

  static forChainWithFee(chainId: ChainId, fee: TokenAmount): TransferBuilder {
    const builder = new TransferBuilder(chainId)
    builder.addFee(fee)
    return builder
  }

  constructor(chainId: ChainId) {
    super()
    this.chainId = chainId
  }

  addTransfer(transfer: TransferData): TransferBuilder {
    this.transfers.push(transfer)
    return this
  }

  addTransfers(transfers: TransferData[]): TransferBuilder {
    for (let i = 0; i < transfers.length; i++) this.transfers.push(transfers[i])
    return this
  }

  addTransferFromTokenAmount(tokenAmount: TokenAmount, recipient: Address): TransferBuilder {
    if (tokenAmount.token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromTokenAmount(tokenAmount, recipient))
  }

  addTransferFromI32(token: Token, amount: i32, recipient: Address): TransferBuilder {
    if (token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromI32(token, amount, recipient))
  }

  addTransferFromBigInt(token: Token, amount: BigInt, recipient: Address): TransferBuilder {
    if (token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromBigInt(token, amount, recipient))
  }

  addTransferFromStringDecimal(token: Token, amount: string, recipient: Address): TransferBuilder {
    if (token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromStringDecimal(token, amount, recipient))
  }

  addTransfersFromTokenAmounts(tokenAmounts: TokenAmount[], recipient: Address): TransferBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) this.addTransferFromTokenAmount(tokenAmounts[i], recipient)
    return this
  }

  addFee(fee: TokenAmount): TransferBuilder {
    if (fee.token.chainId !== this.chainId) throw new Error('Fee token must be on the same chain')
    this.fee = fee
    return this
  }

  addSettler(settler: Address): TransferBuilder {
    return changetype<TransferBuilder>(super.addSettler(settler))
  }

  addSettlerAsString(settler: string): TransferBuilder {
    return changetype<TransferBuilder>(super.addSettlerAsString(settler))
  }

  addDeadline(deadline: BigInt): TransferBuilder {
    return changetype<TransferBuilder>(super.addDeadline(deadline))
  }

  addUser(user: Address): TransferBuilder {
    return changetype<TransferBuilder>(super.addUser(user))
  }

  addUserAsString(user: string): TransferBuilder {
    return changetype<TransferBuilder>(super.addUserAsString(user))
  }

  addNonce(nonce: string): TransferBuilder {
    return changetype<TransferBuilder>(super.addNonce(nonce))
  }

  build(): Transfer {
    if (!this.fee) throw new Error('Transfer fee must be specified')
    return new Transfer(
      this.chainId,
      this.transfers,
      this.fee as TokenAmount,
      this.settler,
      this.user,
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

  static fromI32(token: Token, amount: i32, recipient: Address): TransferData {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount), recipient)
  }

  static fromBigInt(token: Token, amount: BigInt, recipient: Address): TransferData {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount), recipient)
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
  public chainId: ChainId
  public transfers: TransferData[]
  public feeToken: string
  public feeAmount: string

  static create(
    chainId: ChainId,
    token: Address,
    amount: BigInt,
    recipient: Address,
    fee: BigInt,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ): Transfer {
    const transferToken = Token.fromAddress(token, chainId)
    const transferAmount = TokenAmount.fromBigInt(transferToken, amount)
    const transferData = TransferData.fromTokenAmount(transferAmount, recipient)
    const feeAmount = TokenAmount.fromBigInt(transferToken, fee)
    return new Transfer(chainId, [transferData], feeAmount, settler, user, deadline, nonce)
  }

  constructor(
    chainId: ChainId,
    transfers: TransferData[],
    fee: TokenAmount,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ) {
    super(OperationType.Transfer, settler, user, deadline, nonce)

    if (transfers.length === 0) throw new Error('Transfer list cannot be empty')

    this.transfers = transfers
    this.feeToken = fee.token.address.toString()
    this.feeAmount = fee.amount.toString()
    this.chainId = chainId
  }

  send(): void {
    environment.transfer(this)
  }
}
