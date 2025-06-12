import { environment } from '../environment'
import { TokenAmount } from '../tokens'
import { Address, BigInt, Bytes } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

export class CallBuilder extends IntentBuilder {
  private calls: CallData[] = []
  private feeTokenAmount: TokenAmount
  private chainId: u64

  static fromTokenAmountAndChain(feeTokenAmount: TokenAmount, chainId: u64): CallBuilder {
    return new CallBuilder(feeTokenAmount, chainId)
  }

  constructor(feeTokenAmount: TokenAmount, chainId: u64) {
    super()
    this.feeTokenAmount = feeTokenAmount
    this.chainId = chainId
    if (feeTokenAmount.token.chainId !== this.chainId)
      throw new Error('Fee token must be on the same chain as the intent')
  }

  addCall(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()): CallBuilder {
    this.calls.push(new CallData(target, data, value))
    return this
  }

  addFeeTokenAmount(feeTokenAmount: TokenAmount): CallBuilder {
    if (feeTokenAmount.token.chainId !== this.chainId)
      throw new Error('Fee token must be on the same chain as the intent')
    this.feeTokenAmount = feeTokenAmount
    return this
  }

  build(): Call {
    return new Call(
      this.calls,
      this.feeTokenAmount.token.address,
      this.feeTokenAmount.amount,
      this.chainId,
      this.settler,
      this.deadline
    )
  }
}

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

  public send(): void {
    environment.call(this)
  }
}
