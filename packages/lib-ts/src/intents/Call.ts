import { Address, BigInt, Bytes } from '../types'

import { Intent, OperationType } from './Intent'

@json
export class CallData {
  public target: string
  public data: string
  public value: string

  constructor(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()) {
    this.target = target.toString()
    this.data = data.toHexString()
    this.value = value.toString()
  }
}

@json
export class Call extends Intent {
  public calls: CallData[]
  public feeToken: string
  public feeAmount: string
  public chainId: u64

  constructor(
    calls: CallData[],
    feeToken: Address,
    feeAmount: BigInt,
    chainId: u64,
    settler: Address | null = null,
    deadline: BigInt | null = null
  ) {
    super(OperationType.Call, settler, deadline)

    if (calls.length === 0) {
      throw new Error('Call list cannot be empty')
    }

    this.calls = calls
    this.feeToken = feeToken.toString()
    this.feeAmount = feeAmount.toString()
    this.chainId = chainId
  }
}
