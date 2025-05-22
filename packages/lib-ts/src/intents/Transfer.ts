import { Address, BigInt } from '../types'

import { Intent, OperationType } from './Intent'

@json
export class TransferData {
  public token: string
  public amount: string
  public recipient: string

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

  constructor(
    transfers: TransferData[],
    feeToken: Address,
    feeAmount: BigInt,
    settler: Address | null,
    deadline: BigInt | null
  ) {
    super(OperationType.Transfer, settler, deadline)

    if (transfers.length === 0) {
      throw new Error('Transfer list cannot be empty')
    }

    this.transfers = transfers
    this.feeToken = feeToken.toString()
    this.feeAmount = feeAmount.toString()
  }
}
